import React, { useState, useEffect } from 'react';
import { Student, ExamResult } from '../types';
import { db } from '../services/db';
import { FileSpreadsheet, Save } from 'lucide-react';

const ExamManager: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [examType, setExamType] = useState<'Mid-Term' | 'Final'>('Mid-Term');
  const [subject, setSubject] = useState('Mathematics');
  const [results, setResults] = useState<Record<string, number>>({}); // studentId -> marks

  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];

  useEffect(() => {
    const s = db.getStudents();
    setStudents(s);
    loadResults(s, examType, subject);
  }, [examType, subject]);

  const loadResults = (studentList: Student[], type: string, sub: string) => {
    const allResults = db.getExams();
    const mapping: Record<string, number> = {};
    studentList.forEach(s => {
        const match = allResults.find(r => r.studentId === s.id && r.examType === type && r.subject === sub);
        if(match) mapping[s.id] = match.marksObtained;
    });
    setResults(mapping);
  };

  const handleMarkChange = (studentId: string, marks: string) => {
    const val = parseFloat(marks);
    // Allow empty string to clear
    if (marks === '') {
        const newResults = {...results};
        delete newResults[studentId];
        setResults(newResults);
        return;
    }
    if(isNaN(val) || val < 0 || val > 100) return; 
    setResults(prev => ({...prev, [studentId]: val}));
  };

  const saveAll = () => {
      students.forEach(s => {
          if (results[s.id] !== undefined) {
              const result: ExamResult = {
                  id: `${s.id}-${examType}-${subject}`,
                  studentId: s.id,
                  subject,
                  examType,
                  marksObtained: results[s.id],
                  totalMarks: 100
              };
              db.saveExamResult(result);
          }
      });
      alert("Marks saved successfully!");
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-sm border border-white/10 h-full flex flex-col">
      <div className="p-4 md:p-6 border-b border-white/10 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-400" /> Exam Results
        </h2>
        <div className="flex gap-3 w-full md:w-auto">
            <select value={examType} onChange={e => setExamType(e.target.value as any)} className="flex-1 md:flex-none border border-white/10 rounded-lg p-2 text-sm bg-white/5 text-white outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-zinc-900">
                <option value="Mid-Term">Mid-Term</option>
                <option value="Final">Final</option>
            </select>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="flex-1 md:flex-none border border-white/10 rounded-lg p-2 text-sm bg-white/5 text-white outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-zinc-900">
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-zinc-300 min-w-[700px]">
          <thead className="bg-white/5 text-zinc-200 font-semibold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
            <tr>
                <th className="px-6 py-4 border-b border-white/10">Roll No</th>
                <th className="px-6 py-4 border-b border-white/10">Student Name</th>
                <th className="px-6 py-4 border-b border-white/10 text-center">Total Marks</th>
                <th className="px-6 py-4 border-b border-white/10 text-center">Obtained Marks</th>
                <th className="px-6 py-4 border-b border-white/10 text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {students.map(student => {
                const marks = results[student.id];
                const hasMarks = marks !== undefined;
                let grade = '-';
                
                if (hasMarks) {
                    if(marks >= 90) grade = 'A+';
                    else if(marks >= 80) grade = 'A';
                    else if(marks >= 70) grade = 'B';
                    else if(marks >= 60) grade = 'C';
                    else if(marks >= 40) grade = 'D';
                    else grade = 'F';
                }

                return (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-zinc-400">#{student.rollNo}</td>
                        <td className="px-6 py-4 font-medium text-zinc-200">{student.fullName}</td>
                        <td className="px-6 py-4 text-center">100</td>
                        <td className="px-6 py-4 text-center">
                            <input 
                                type="number" 
                                value={hasMarks ? marks : ''} 
                                onChange={e => handleMarkChange(student.id, e.target.value)}
                                className="w-20 p-2 border border-white/10 rounded text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white/5 text-white transition-all placeholder-zinc-600"
                                placeholder="0"
                            />
                        </td>
                        <td className={`px-6 py-4 text-center font-bold ${grade === 'F' ? 'text-red-400' : 'text-green-400'}`}>{grade}</td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end backdrop-blur-md">
        <button 
            onClick={saveAll}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md shadow-indigo-900/50"
        >
            <Save size={20} /> Save Results
        </button>
      </div>
    </div>
  );
};

export default ExamManager;