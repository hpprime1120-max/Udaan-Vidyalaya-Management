import React from 'react';
import { LayoutDashboard, Users, Banknote, CheckSquare, FileSpreadsheet, LogOut, School, GraduationCap, X } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, isOpen, onClose }) => {
  
  const menuItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.STUDENTS, label: 'Students', icon: Users },
    { id: View.TEACHERS, label: 'Teachers', icon: GraduationCap },
    { id: View.FEES, label: 'Fees Management', icon: Banknote },
    { id: View.ATTENDANCE, label: 'Attendance', icon: CheckSquare },
    { id: View.EXAMS, label: 'Exam Results', icon: FileSpreadsheet },
  ];

  const handleNavigation = (view: View) => {
    onChangeView(view);
    onClose(); // Close sidebar on mobile when item clicked
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
            onClick={onClose}
        />
      )}

      {/* Sidebar Container - Glassmorphism */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-black/40 backdrop-blur-2xl border-r border-white/10 text-white shadow-2xl z-40 
        transition-transform duration-300 ease-in-out transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:z-20
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/40">
                <School size={24} className="text-white" />
            </div>
            <div>
                <h2 className="font-bold text-lg leading-tight">Udaan</h2>
                <span className="text-xs text-zinc-400 uppercase tracking-wider">Vidhyalay</span>
            </div>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                  <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive 
                          ? 'bg-indigo-600/80 text-white shadow-lg shadow-indigo-900/20 backdrop-blur-sm' 
                          : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                  </button>
              );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;