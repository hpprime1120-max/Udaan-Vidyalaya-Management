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

    const prompt = `
    You are an expert academic counselor for 'Udaan Vidhyalay'.
    Analyze the following student data and write a professional, encouraging, but honest 1-paragraph performance summary for their report card.
    
    Student: ${student.fullName} (Class: ${student.className}-${student.section})
    
    Academic Performance:
    ${exams.map(e => `- ${e.subject} (${e.examType}): ${e.marksObtained}/${e.totalMarks}`).join('\n')}
    
    Attendance Records: ${attendance.length} records found.
    (Assume general attendance is good unless specified otherwise).

    The summary should mention their strengths based on high marks and areas for improvement based on low marks.
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
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

    const prompt = `
    You are a school administrator analyst. Analyze the following attendance data for 'Udaan Vidhyalay'.
    
    Total Records Scanned: ${records.length}
    Total Students in DB: ${totalStudents}
    
    Summary:
    - Present: ${presentCount}
    - Absent: ${absentCount}
    - Late: ${lateCount}
    
    Daily Breakdown (Sample):
    ${JSON.stringify(Object.entries(dateMap).slice(0, 5))}
    
    Please provide a 3-bullet point analysis:
    1. Overall Attendance Health (Excellent/Good/Poor).
    2. A specific observation (e.g., "High absenteeism observed on...").
    3. One actionable suggestion for improvement.
    Keep it concise and professional.
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text || "Analysis failed.";
    } catch (error) {
        return "Error generating AI analysis.";
    }
}