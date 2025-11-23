import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord } from '../types';
import { db } from '../services/db';
import { Calendar as CalendarIcon, BrainCircuit } from 'lucide-react';
import { generateAttendanceAnalysis } from '../services/geminiService';

const AttendanceManager: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>>({});
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setStudents(db.getStudents());
    loadAttendanceForDate(selectedDate);
  }, [selectedDate]);

  const loadAttendanceForDate = (date: string) => {
    const records = db.getAttendance().filter(r => r.date === date);
    const map: Record<string, any> = {};
    records.forEach(r => {
        map[r.studentId] = r.status;
    });
    setAttendanceMap(map);
  };

  const updateStatus = (studentId: string, status: AttendanceRecord['status']) => {
    const newMap = { ...attendanceMap, [studentId]: status };
    setAttendanceMap(newMap);

    // Persist
    const existing = db.getAttendance().find(r => r.studentId === studentId && r.date === selectedDate);
    const record: AttendanceRecord = {
        id: existing ? existing.id : `${studentId}-${selectedDate}`,
        studentId,
        date: selectedDate,
        status
    };
    db.saveAttendance(record);
  };

  const markAll = (status: AttendanceRecord['status']) => {
      students.forEach(s => updateStatus(s.id, status));
  };

  const handleAnalyze = async () => {
      setIsAnalyzing(true);
      setAiAnalysis(null);
      const allRecords = db.getAttendance();
      const result = await generateAttendanceAnalysis(allRecords, students.length);
      setAiAnalysis(result);
      setIsAnalyzing(false);
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-sm border border-white/10 h-full flex flex-col">
      <div className="p-4 md:p-6 border-b border-white/10 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarIcon className="text-indigo-400" /> Daily Attendance
            </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex justify-center items-center gap-2 bg-purple-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition shadow-md shadow-purple-900/50 disabled:opacity-70 backdrop-blur-sm"
            >
                <BrainCircuit size={18} />
                {isAnalyzing ? 'Analyzing...' : 'AI Insights'}
            </button>
            <div className="hidden sm:block w-px h-8 bg-white/10 mx-2"></div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)}
                    className="flex-1 sm:flex-none border border-white/10 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white/5 text-white [color-scheme:dark]"
                />
                <div className="flex gap-2">
                    <button onClick={() => markAll('Present')} className="px-3 py-2 sm:py-1 text-xs bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 border border-green-500/20 whitespace-nowrap transition">All Present</button>
                    <button onClick={() => markAll('Absent')} className="px-3 py-2 sm:py-1 text-xs bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 border border-red-500/20 whitespace-nowrap transition">All Absent</button>
                </div>
            </div>
        </div>
      </div>

      {/* AI Analysis Result Section */}
      {aiAnalysis && (
          <div className="mx-4 md:mx-6 mt-4 md:mt-6 p-4 bg-purple-900/30 border border-purple-500/30 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md">
              <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-purple-200 flex items-center gap-2">
                      <BrainCircuit size={18} /> Attendance Analysis Report
                  </h3>
                  <button onClick={() => setAiAnalysis(null)} className="text-purple-300 hover:text-purple-100">Close</button>
              </div>
              <div className="prose prose-sm text-zinc-200 max-w-none whitespace-pre-line leading-relaxed">
                  {aiAnalysis}
              </div>
          </div>
      )}

      <div className="overflow-auto flex-1 p-4 md:p-6 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students.map(student => {
                const status = attendanceMap[student.id] || 'Present'; // Default visual
                const isMarked = attendanceMap[student.id] !== undefined;

                return (
                    <div key={student.id} className={`p-4 rounded-lg border backdrop-blur-sm transition-all ${isMarked ? 'border-white/10 bg-white/5' : 'border-orange-500/30 bg-orange-500/10'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-zinc-200 truncate max-w-[150px]">{student.fullName}</h3>
                                <p className="text-xs text-zinc-400">#{student.rollNo} • {student.className}-{student.section}</p>
                            </div>
                            {!isMarked && <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded border border-orange-500/20">Unmarked</span>}
                        </div>
                        
                        <div className="flex gap-1 bg-black/20 p-1 rounded-md border border-white/5">
                            {['Present', 'Absent', 'Late', 'Excused'].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => updateStatus(student.id, opt as any)}
                                    className={`flex-1 text-xs py-1.5 rounded font-medium transition-all ${
                                        status === opt 
                                        ? opt === 'Present' ? 'bg-green-600 text-white shadow-sm' 
                                          : opt === 'Absent' ? 'bg-red-600 text-white shadow-sm'
                                          : 'bg-yellow-600 text-white shadow-sm'
                                        : 'text-zinc-500 hover:bg-white/10 hover:text-zinc-300'
                                    }`}
                                >
                                    {opt[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;