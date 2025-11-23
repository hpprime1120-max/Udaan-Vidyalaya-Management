import React, { useState, useEffect } from 'react';
import { Teacher, TeacherAttendance } from '../types';
import { db } from '../services/db';
import { UserPlus, Trash2, Edit, Save, X, CheckCircle, XCircle, IndianRupee, Calendar, Phone, Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const TeacherManager: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [activeTab, setActiveTab] = useState<'LIST' | 'ATTENDANCE'>('LIST');
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const initialFormState: Teacher = {
        id: '',
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        qualification: '',
        salary: 0,
        joinDate: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState<Teacher>(initialFormState);
    
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent'>>({});

    useEffect(() => {
        loadTeachers();
    }, []);

    useEffect(() => {
        if (activeTab === 'ATTENDANCE') {
            loadAttendance();
        }
    }, [activeTab, attendanceDate]);

    const loadTeachers = () => {
        setTeachers(db.getTeachers());
    };

    const loadAttendance = () => {
        const allRecs = db.getTeacherAttendance();
        const todaysRecs = allRecs.filter(r => r.date === attendanceDate);
        const map: Record<string, any> = {};
        todaysRecs.forEach(r => map[r.teacherId] = r.status);
        setAttendanceMap(map);
    };

    const validateForm = (): string | null => {
        if (!formData.fullName.trim()) return "Full Name is required";
        if (!formData.subject.trim()) return "Subject is required";
        
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) return "Invalid email address format";
        }

        if (formData.phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(formData.phone)) return "Phone number must be exactly 10 digits";
        }

        if (formData.salary <= 0) return "Salary must be a positive number greater than zero";
        
        return null;
    };

    const handleSaveTeacher = (e: React.FormEvent) => {
        e.preventDefault();
        
        const error = validateForm();
        if (error) {
            alert(error);
            return;
        }

        const teacher = { ...formData, id: formData.id || Date.now().toString() };
        db.saveTeacher(teacher);
        setShowForm(false);
        loadTeachers();
        setFormData(initialFormState);
    };

    const handleDelete = (id: string) => {
        if(confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) {
            db.deleteTeacher(id);
            loadTeachers();
        }
    };

    const markAttendance = (teacherId: string, status: 'Present' | 'Absent') => {
        const record: TeacherAttendance = {
            id: `${teacherId}-${attendanceDate}`,
            teacherId,
            date: attendanceDate,
            status
        };
        db.saveTeacherAttendance(record);
        loadAttendance();
    };

    const changeDate = (days: number) => {
        const date = new Date(attendanceDate);
        // Use UTC to avoid timezone jumping issues when adding/subtracting days
        date.setUTCDate(date.getUTCDate() + days);
        setAttendanceDate(date.toISOString().split('T')[0]);
    };

    const filteredTeachers = teachers.filter(t => 
        t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-sm border border-white/10 h-full flex flex-col">
            <div className="p-4 md:p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-bold text-white">Teacher Management</h2>
                <div className="flex w-full md:w-auto gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                    <button 
                        onClick={() => setActiveTab('LIST')} 
                        className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'LIST' ? 'bg-white/10 text-indigo-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Staff Directory
                    </button>
                    <button 
                        onClick={() => setActiveTab('ATTENDANCE')} 
                        className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ATTENDANCE' ? 'bg-white/10 text-indigo-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Attendance
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-4 md:p-6">
                {activeTab === 'LIST' && (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search teachers..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white/5 text-white placeholder-zinc-500"
                                />
                            </div>
                            <button 
                                onClick={() => { setShowForm(true); setFormData(initialFormState); }}
                                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-900/50 font-medium"
                            >
                                <UserPlus size={18} /> Add Teacher
                            </button>
                        </div>

                        {showForm && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-zinc-900/90 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
                                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                        <h3 className="font-bold text-lg text-white">{formData.id ? 'Edit Teacher Details' : 'Add New Teacher'}</h3>
                                        <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white"><X size={20}/></button>
                                    </div>
                                    <form onSubmit={handleSaveTeacher} className="p-6 space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Full Name <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                required 
                                                className="w-full p-2.5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white bg-white/5" 
                                                placeholder="e.g. Dr. Sarah Smith"
                                                value={formData.fullName} 
                                                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Subject <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    className="w-full p-2.5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white bg-white/5"
                                                    placeholder="e.g. Physics" 
                                                    value={formData.subject} 
                                                    onChange={e => setFormData({...formData, subject: e.target.value})} 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Qualification</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full p-2.5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white bg-white/5" 
                                                    placeholder="e.g. M.Sc, B.Ed"
                                                    value={formData.qualification} 
                                                    onChange={e => setFormData({...formData, qualification: e.target.value})} 
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Phone (10-digit)</label>
                                                <input 
                                                    type="tel" 
                                                    className="w-full p-2.5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white bg-white/5" 
                                                    placeholder="9876543210"
                                                    maxLength={10}
                                                    value={formData.phone} 
                                                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
                                                <input 
                                                    type="email" 
                                                    className="w-full p-2.5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white bg-white/5" 
                                                    placeholder="teacher@school.com"
                                                    value={formData.email} 
                                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Salary (₹) <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="number" 
                                                    required 
                                                    min="1"
                                                    className="w-full p-2.5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white bg-white/5" 
                                                    placeholder="50000"
                                                    value={formData.salary || ''} 
                                                    onChange={e => setFormData({...formData, salary: parseInt(e.target.value) || 0})} 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Join Date</label>
                                                <input 
                                                    type="date" 
                                                    className="w-full p-2.5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white bg-white/5 [color-scheme:dark]" 
                                                    value={formData.joinDate} 
                                                    onChange={e => setFormData({...formData, joinDate: e.target.value})} 
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-md shadow-indigo-900/50 transition">
                                                {formData.id ? 'Update Details' : 'Register Teacher'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="overflow-auto h-[calc(100vh-240px)] pr-2 custom-scrollbar">
                            {filteredTeachers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                    {filteredTeachers.map(teacher => (
                                        <div key={teacher.id} className="p-5 bg-white/5 border border-white/10 rounded-xl hover:shadow-lg transition-all group hover:bg-white/10 backdrop-blur-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">{teacher.fullName}</h3>
                                                    <span className="inline-block mt-1 text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium border border-indigo-500/20">
                                                        {teacher.subject}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setFormData(teacher); setShowForm(true); }} className="p-2 text-blue-300 hover:bg-blue-900/30 rounded-full transition"><Edit size={16}/></button>
                                                    <button onClick={() => handleDelete(teacher.id)} className="p-2 text-red-300 hover:bg-red-900/30 rounded-full transition"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 text-sm text-zinc-400 pt-2 border-t border-white/10">
                                                <div className="flex items-center gap-2.5">
                                                    <Phone size={14} className="text-zinc-500"/> 
                                                    <span>{teacher.phone || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Mail size={14} className="text-zinc-500"/> 
                                                    <span className="truncate">{teacher.email || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <IndianRupee size={14} className="text-zinc-500"/> 
                                                    <span className="font-medium text-zinc-300">₹{teacher.salary.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Calendar size={14} className="text-zinc-500"/> 
                                                    <span>Joined: {teacher.joinDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-zinc-500">
                                    No teachers found matching your search.
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'ATTENDANCE' && (
                    <div className="h-full flex flex-col bg-white/5 rounded-lg border border-white/10 shadow-sm overflow-hidden backdrop-blur-md">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-white/5 p-4 border-b border-white/10">
                            <div className="flex items-center gap-1 bg-black/20 border border-white/10 rounded-lg p-1 w-full lg:w-auto justify-between lg:justify-start">
                                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded text-zinc-400"><ChevronLeft size={18}/></button>
                                <div className="flex items-center gap-2 px-2 border-x border-white/10 flex-1 justify-center lg:flex-none">
                                    <Calendar size={16} className="text-indigo-400"/>
                                    <input 
                                        type="date" 
                                        value={attendanceDate} 
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                        className="text-sm text-white outline-none bg-transparent font-medium w-32 [color-scheme:dark]"
                                    />
                                </div>
                                <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded text-zinc-400"><ChevronRight size={18}/></button>
                            </div>
                            
                            <button 
                                onClick={() => setAttendanceDate(new Date().toISOString().split('T')[0])}
                                className="text-xs font-medium text-indigo-300 hover:text-indigo-200 underline hidden lg:block"
                            >
                                Jump to Today
                            </button>

                            <div className="lg:ml-auto flex w-full lg:w-auto gap-2 text-sm">
                                <div className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg border border-green-500/20">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="text-xs md:text-sm">Present: <span className="font-bold">{Object.values(attendanceMap).filter(v => v === 'Present').length}</span></span>
                                </div>
                                <div className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg border border-red-500/20">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span className="text-xs md:text-sm">Absent: <span className="font-bold">{Object.values(attendanceMap).filter(v => v === 'Absent').length}</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left text-sm text-zinc-300 min-w-[600px]">
                                <thead className="bg-white/5 text-zinc-200 uppercase font-semibold text-xs sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="p-4 border-b border-white/10 w-1/3">Teacher Name</th>
                                        <th className="p-4 border-b border-white/10">Subject</th>
                                        <th className="p-4 border-b border-white/10 text-center">Status</th>
                                        <th className="p-4 border-b border-white/10 text-right">Mark Attendance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {teachers.map(teacher => {
                                        const status = attendanceMap[teacher.id];
                                        return (
                                            <tr key={teacher.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{teacher.fullName}</div>
                                                    <div className="text-xs text-zinc-400">{teacher.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-white/10 rounded text-zinc-300 text-xs font-medium border border-white/10">
                                                        {teacher.subject}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {status === 'Present' && (
                                                        <span className="inline-flex items-center gap-1 text-green-300 font-bold px-2.5 py-1 bg-green-500/20 rounded-full text-xs">
                                                            <CheckCircle size={12} /> Present
                                                        </span>
                                                    )}
                                                    {status === 'Absent' && (
                                                        <span className="inline-flex items-center gap-1 text-red-300 font-bold px-2.5 py-1 bg-red-500/20 rounded-full text-xs">
                                                            <XCircle size={12} /> Absent
                                                        </span>
                                                    )}
                                                    {!status && <span className="text-zinc-500 text-xs italic">--</span>}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => markAttendance(teacher.id, 'Present')}
                                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${status === 'Present' ? 'bg-green-600 text-white shadow-md shadow-green-900/50' : 'bg-white/5 border border-white/10 text-zinc-400 hover:border-green-500 hover:text-green-400'}`}
                                                        >
                                                            Present
                                                        </button>
                                                        <button 
                                                            onClick={() => markAttendance(teacher.id, 'Absent')}
                                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${status === 'Absent' ? 'bg-red-600 text-white shadow-md shadow-red-900/50' : 'bg-white/5 border border-white/10 text-zinc-400 hover:border-red-500 hover:text-red-400'}`}
                                                        >
                                                            Absent
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {teachers.length === 0 && (
                                <div className="text-center py-12 text-zinc-500">No teachers available. Add teachers from the Staff Directory tab.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherManager;