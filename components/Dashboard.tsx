
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { View } from '../types';
import StudentManager from './StudentManager';
import FeesManager from './FeesManager';
import AttendanceManager from './AttendanceManager';
import ExamManager from './ExamManager';
import TeacherManager from './TeacherManager';
import { db } from '../services/db';
import { Users, IndianRupee, CheckSquare, Award, PieChart, GraduationCap, Menu } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
      totalStudents: 0,
      totalTeachers: 0,
      totalRevenue: 0,
      attendanceToday: 0,
      passPercentage: 0,
      genderStats: { male: 0, female: 0 }
  });

  useEffect(() => {
      // Initialize simulated DB
      db.initializeData();
      updateStats();
      // Poll for updates occasionally to reflect changes
      const interval = setInterval(updateStats, 2000);
      return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
      const students = db.getStudents();
      const fees = db.getFees();
      const attendance = db.getAttendance();
      const exams = db.getExams();
      const teacherCount = db.getTeacherCount();

      const revenue = fees.reduce((acc, curr) => {
          return acc + (curr.semester1Paid ? 11000 : 0) + (curr.semester2Paid ? 11000 : 0);
      }, 0);

      const today = new Date().toISOString().split('T')[0];
      const presentToday = attendance.filter(a => a.date === today && a.status === 'Present').length;

      // Calculate average pass rate (marks > 40)
      const passed = exams.filter(e => e.marksObtained >= 40).length;
      const passRate = exams.length > 0 ? Math.round((passed / exams.length) * 100) : 0;

      // Calculate Gender Stats
      const maleCount = students.filter(s => s.gender === 'Male').length;
      const femaleCount = students.filter(s => s.gender === 'Female').length;

      setStats({
          totalStudents: students.length,
          totalTeachers: teacherCount,
          totalRevenue: revenue,
          attendanceToday: presentToday,
          passPercentage: passRate,
          genderStats: { male: maleCount, female: femaleCount }
      });
  };

  const renderContent = () => {
    switch (currentView) {
      case View.STUDENTS:
        return <StudentManager />;
      case View.TEACHERS:
        return <TeacherManager />;
      case View.FEES:
        return <FeesManager />;
      case View.ATTENDANCE:
        return <AttendanceManager />;
      case View.EXAMS:
        return <ExamManager />;
      case View.DASHBOARD:
      default:
        return <DashboardHome stats={stats} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent text-zinc-100">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={onLogout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content Wrapper */}
      <main className={`flex-1 p-4 md:p-8 overflow-hidden h-screen flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-64'}`}>
        <header className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
             <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm">{currentView === View.DASHBOARD ? 'Overview' : currentView.replace('_', ' ')}</h1>
                    <p className="text-zinc-300 text-xs md:text-sm hidden sm:block">Welcome back, Administrator.</p>
                </div>
             </div>
             <div className="text-xs md:text-sm bg-black/30 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm text-zinc-200 border border-white/10 whitespace-nowrap">
                 {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
             </div>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

const DashboardHome = ({ stats, onNavigate }: { stats: any, onNavigate: (view: View) => void }) => {
    const pieData = [
        { name: 'Boys', value: stats.genderStats?.male || 0 },
        { name: 'Girls', value: stats.genderStats?.female || 0 },
    ];
    
    // Fallback for empty data to show empty chart visual if needed, or just let Recharts handle 0s
    // If no students, we can add a placeholder to avoid empty visual glitch if desired, 
    // but usually 0 is fine (chart is empty). 
    
    const COLORS = ['#6366f1', '#ec4899'];

    return (
        <div className="space-y-6 overflow-y-auto h-full pb-24 custom-scrollbar pr-1">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="bg-indigo-600" />
                <StatCard title="Active Teachers" value={stats.totalTeachers} icon={GraduationCap} color="bg-teal-600" />
                <StatCard title="Fees Collected" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="bg-green-600" />
                <StatCard title="Present Today" value={stats.attendanceToday} icon={CheckSquare} color="bg-orange-600" />
                <StatCard title="Exam Pass Rate" value={`${stats.passPercentage}%`} icon={Award} color="bg-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl p-6 rounded-xl shadow-lg border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Quick Shortcuts</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div 
                            onClick={() => onNavigate(View.STUDENTS)}
                            className="p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition cursor-pointer flex flex-col items-center text-center group"
                        >
                            <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-300 mb-2 shadow-sm group-hover:text-indigo-200"><Users size={24}/></div>
                            <span className="font-medium text-zinc-300 group-hover:text-white text-sm">New Admission</span>
                        </div>
                        <div 
                            onClick={() => onNavigate(View.TEACHERS)}
                            className="p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition cursor-pointer flex flex-col items-center text-center group"
                        >
                            <div className="p-3 bg-teal-500/20 rounded-full text-teal-300 mb-2 shadow-sm group-hover:text-teal-200"><GraduationCap size={24}/></div>
                            <span className="font-medium text-zinc-300 group-hover:text-white text-sm">Manage Teachers</span>
                        </div>
                        <div 
                            onClick={() => onNavigate(View.FEES)}
                            className="p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition cursor-pointer flex flex-col items-center text-center group"
                        >
                            <div className="p-3 bg-green-500/20 rounded-full text-green-300 mb-2 shadow-sm group-hover:text-green-200"><IndianRupee size={24}/></div>
                            <span className="font-medium text-zinc-300 group-hover:text-white text-sm">Collect Fees</span>
                        </div>
                        <div 
                            onClick={() => onNavigate(View.ATTENDANCE)}
                            className="p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition cursor-pointer flex flex-col items-center text-center group"
                        >
                            <div className="p-3 bg-orange-500/20 rounded-full text-orange-300 mb-2 shadow-sm group-hover:text-orange-200"><CheckSquare size={24}/></div>
                            <span className="font-medium text-zinc-300 group-hover:text-white text-sm">Mark Attendance</span>
                        </div>
                        <div 
                            onClick={() => onNavigate(View.EXAMS)}
                            className="p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition cursor-pointer flex flex-col items-center text-center group"
                        >
                            <div className="p-3 bg-purple-500/20 rounded-full text-purple-300 mb-2 shadow-sm group-hover:text-purple-200"><Award size={24}/></div>
                            <span className="font-medium text-zinc-300 group-hover:text-white text-sm">Publish Results</span>
                        </div>
                    </div>
                </div>

                {/* Demographics Chart */}
                <div className="bg-black/40 backdrop-blur-xl p-6 rounded-xl shadow-lg border border-white/10 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <PieChart size={20} className="text-zinc-400"/> Demographics
                    </h3>
                    <div className="flex-1 min-h-[200px]">
                        {stats.totalStudents > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', color: '#f4f4f5', borderRadius: '8px'}} />
                                </RePieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm">
                                <PieChart size={48} className="opacity-20 mb-2" />
                                No student data available
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center gap-6 text-sm text-zinc-300 mt-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span> 
                            Boys <span className="text-zinc-500 text-xs">({stats.genderStats?.male || 0})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-pink-500"></span> 
                            Girls <span className="text-zinc-500 text-xs">({stats.genderStats?.female || 0})</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 border border-white/10 text-white rounded-xl p-8 relative overflow-hidden backdrop-blur-sm shadow-lg">
                 <div className="relative z-10">
                     <h2 className="text-2xl font-bold mb-2">Udaan Vidhyalay Pro</h2>
                     <p className="text-indigo-100 max-w-xl">Manage your institution with the latest tools in education technology. Secure database, automated reports, and AI insights.</p>
                 </div>
            </div>
        </div>
    );
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-black/40 backdrop-blur-xl p-6 rounded-xl shadow-lg border border-white/10 flex items-center gap-4 hover:bg-black/50 transition-all">
        <div className={`${color} p-3 md:p-4 rounded-lg text-white shadow-lg shadow-black/20 shrink-0`}>
            <Icon size={20} className="md:w-6 md:h-6" />
        </div>
        <div className="min-w-0">
            <p className="text-zinc-400 text-xs md:text-sm font-medium truncate">{title}</p>
            <h3 className="text-lg md:text-2xl font-bold text-white truncate">{value}</h3>
        </div>
    </div>
);

export default Dashboard;
