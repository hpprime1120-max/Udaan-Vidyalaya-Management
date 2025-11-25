import { GoogleGenAI } from "@google/genai";
import { Student, ExamResult, AttendanceRecord } from "../types";

const getClient = () => {
    let apiKey = '';
    try {
        // Safety check: In some browser environments, process is not defined, leading to a crash.
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY || '';
        }
    } catch (e) {
        console.warn("Environment variable access failed", e);
    }

    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
}

export const generateStudentReport = async (
    student: Student,
    exams: ExamResult[],
    attendance: AttendanceRecord[]
): Promise<string> => {
    const client = getClient();
    if (!client) return "API Key is missing. Please configure the environment.";

    const academicData = exams.length > 0 
        ? exams.map(e => `- ${e.subject} (${e.examType}): ${e.marksObtained}/${e.totalMarks}`).join('\n')
        : "No exam records available.";

    const attendanceSummary = attendance.length > 0
        ? `Total Records: ${attendance.length}, Present: ${attendance.filter(a => a.status === 'Present').length}, Absent: ${attendance.filter(a => a.status === 'Absent').length}`
        : "No attendance records available.";

    const userPrompt = `
    Student Name: ${student.fullName}
    Class: ${student.className}-${student.section}
    
    Academic Performance:
    ${academicData}
    
    Attendance Overview:
    ${attendanceSummary}
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: "You are an expert academic counselor for 'Udaan Vidhyalay'. Analyze the student data provided (Grades and Attendance) and write a professional, encouraging, 1-paragraph performance summary suitable for a report card. Highlight strengths and suggest areas for improvement politely.",
                temperature: 0.7,
            }
        });
        return response.text || "No report generated.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Error communicating with AI service. Please try again later.";
    }
};

export const generateAttendanceAnalysis = async (
    records: AttendanceRecord[],
    totalStudents: number
): Promise<string> => {
    const client = getClient();
    if (!client) return "API Key is missing.";

    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    const lateCount = records.filter(r => r.status === 'Late').length;

    // Group by date to find trends
    const dateMap: Record<string, any> = {};
    records.forEach(r => {
        if(!dateMap[r.date]) dateMap[r.date] = { P: 0, A: 0 };
        if(r.status === 'Present') dateMap[r.date].P++;
        if(r.status === 'Absent') dateMap[r.date].A++;
    });

    const userPrompt = `
    Total Records Scanned: ${records.length}
    Total Students in DB: ${totalStudents}
    
    Summary:
    - Present: ${presentCount}
    - Absent: ${absentCount}
    - Late: ${lateCount}
    
    Daily Breakdown (Sample):
    ${JSON.stringify(Object.entries(dateMap).slice(0, 5))}
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: "You are a school administrator analyst. Provide a concise 3-bullet point analysis of the attendance data: 1) Overall Health, 2) Specific Observation, 3) Actionable Suggestion.",
                temperature: 0.5,
            }
        });
        return response.text || "Analysis failed.";
    } catch (error) {
        return "Error generating AI analysis.";
    }
}