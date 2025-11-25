import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { db } from '../services/db';
import { Plus, Trash2, Edit, Save, X, Wand2, AlertCircle, Calendar, Download, Filter, CopyPlus, RotateCcw, Search, Lock, Sparkles } from 'lucide-react';
import { generateStudentReport } from '../services/geminiService';

// Improved Custom Date Picker Component
const CustomDatePicker = ({ label, value, onChange, error, touched }: any) => {
    return (
        <div className="relative">
            <label className="block text-sm font-medium text-zinc-300 mb-1">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className={`relative flex items-center w-full border rounded-lg bg-white/5 backdrop-blur-sm transition-all duration-200 ${touched && error ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-white/10 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent'}`}>
                <input 
                    type="date" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-3 pl-3 pr-10 outline-none text-zinc-100 rounded-lg bg-transparent text-sm font-medium [color-scheme:dark]"
                />
                <Calendar size={18} className={`absolute right-3 pointer-events-none transition-colors ${touched && error ? 'text-red-400' : 'text-zinc-500'}`} />
            </div>
            {touched && error && (
                <div className="flex items-center gap-1 mt-1.5 text-red-400 text-xs font-medium animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}

// Helper Component for Form Fields
const FormField = ({ 
  label, 
  name, 
  value, 
  error, 
  touched, 
  onChange, 
  onBlur, 
  type = "text", 
  placeholder, 
  options,
  disabled = false
}: any) => {
    const isError = touched && error;
    const inputClasses = `w-full p-3 border rounded-lg focus:ring-2 outline-none bg-white/5 backdrop-blur-sm text-zinc-100 transition-all duration-200 
        ${disabled ? 'opacity-60 cursor-not-allowed bg-white/10 pr-10' : ''}
        ${isError 
          ? 'border-red-500/50 focus:ring-red-500/20 focus:border-red-500' 
          : 'border-white/10 focus:ring-indigo-500 focus:border-transparent hover:border-white/20'}`;
    
    const isWide = name === 'address' || name === 'fullName';

    return (
      <div className={isWide ? 'col-span-2' : ''}>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
              {label} <span className="text-red-500">*</span>
          </label>
          
          <div className="relative">
            {options ? (
                <select 
                    name={name}
                    value={value} 
                    onChange={(e) => onChange(name, e.target.value)}
                    onBlur={() => onBlur(name)}
                    className={`${inputClasses} appearance-none`}
                    disabled={disabled}
                >
                    <option value="" className="bg-zinc-900">Select {label}</option>
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
                    ))}
                </select>
            ) : name === 'address' ? (
                <textarea 
                    name={name}
                    rows={3}
                    value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                    onBlur={() => onBlur(name)}
                    className={inputClasses}
                    placeholder={placeholder}
                    disabled={disabled}
                />
            ) : (
                <input 
                    type={type}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                    onBlur={() => onBlur(name)}
                    className={inputClasses}
                    placeholder={placeholder}
                    disabled={disabled}
                />
            )}

            {/* Lock Icon for Disabled Fields (Auto-filled) */}
            {disabled && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" title="Auto-generated / Read-only">
                    <Lock size={16} />
                </div>
            )}
          </div>
          
          {isError && (
              <div className="flex items-center gap-1 mt-1.5 text-red-400 text-xs font-medium animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle size={12} />
                  <span>{error}</span>
              </div>
          )}
      </div>
    );
};

const StudentManager: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');

  const [isEdit, setIsEdit] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Form Action State
  const [saveAction, setSaveAction] = useState<'SAVE' | 'SAVE_AND_NEW'>('SAVE');

  // Form State
  const initialFormState: Student = {
    id: '',
    rollNo: 0,
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    contactNumber: '',
    address: '',
    className: '',
    section: '',
    admissionDate: new Date().toISOString().split('T')[0]
  };
  const [formData, setFormData] = useState<Student>(initialFormState);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => {
    setStudents(db.getStudents());
  };

  const resetFormState = () => {
      setErrors({});
      setTouched({});
      setAiReport(null);
      setFormError(null);
  };

  // Helper to generate ID and Roll No
  const generateNewCredentials = () => {
    const nextRoll = db.getNextRollNo();
    const year = new Date().getFullYear();
    return {
        id: `UV-${year}-${nextRoll}`,
        rollNo: nextRoll
    };
  };

  const handleAddNew = () => {
    const creds = generateNewCredentials();
    setFormData({ ...initialFormState, ...creds });
    setIsEdit(false);
    resetFormState();
    setViewMode('FORM');
  };

  const handleEdit = (student: Student) => {
    setFormData(student);
    setIsEdit(true);
    resetFormState();
    setViewMode('FORM');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student? All records will be lost.')) {
      db.deleteStudent(id);
      loadStudents();
    }
  };

  const handleExportCSV = () => {
      if(students.length === 0) {
          alert("No students to export.");
          return;
      }
      const headers = ["ID", "Roll No", "Full Name", "Gender", "DOB", "Contact", "Address", "Class", "Section", "Admission Date"];
      const rows = students.map(s => [s.id, s.rollNo, s.fullName, s.gender, s.dateOfBirth, s.contactNumber, `"${s.address}"`, s.className, s.section, s.admissionDate]);
      
      const csvContent = [
          headers.join(','),
          ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Enhanced Validation Logic
  const validateField = (name: string, value: any, currentData: Student): string => {
    switch (name) {
      case 'id':
        if (!value || !value.toString().trim()) return 'Student ID is required';
        // Check for duplicate ID on create only
        if (!isEdit) {
            const exists = students.some(s => s.id.toLowerCase() === value.toString().toLowerCase());
            if (exists) return 'Student ID already exists';
        }
        return '';
      
      case 'rollNo':
        if (!value) return 'Roll Number is required';
        if (isNaN(value) || Number(value) <= 0) return 'Enter a valid positive roll number';
        return '';
      
      case 'fullName':
        if (!value || !value.trim()) return 'Full Name is required';
        if (value.length < 3) return 'Name must be at least 3 characters';
        if (!/^[a-zA-Z\s.]+$/.test(value)) return 'Name can only contain letters, dots, and spaces';
        return '';
      
      case 'contactNumber':
        if (!value) return 'Contact Number is required';
        // Relaxed validation: 10 digits
        if (!/^\d{10}$/.test(value)) return 'Enter a valid 10-digit mobile number';
        return '';
      
      case 'className':
        if (!value) return 'Class selection is required';
        return '';
      
      case 'section':
        if (!value) return 'Section selection is required';
        return '';
      
      case 'gender':
        if (!value) return 'Gender selection is required';
        return '';
      
      case 'dateOfBirth':
        if (!value) return 'Date of Birth is required';
        const dob = new Date(value);
        const today = new Date();
        if (dob >= today) return 'Date of Birth cannot be in the future';
        return '';
      
      case 'admissionDate':
        if (!value) return 'Admission Date is required';
        if (currentData.dateOfBirth) {
            const dobDate = new Date(currentData.dateOfBirth);
            const admDate = new Date(value);
            if (admDate <= dobDate) return 'Admission Date must be after Date of Birth';
        }
        return '';
      
      case 'address':
        if (!value || !value.trim()) return 'Address is required';
        if (value.trim().length < 5) return 'Address too short (min 5 chars)';
        return '';
      
      default:
        return '';
    }
  };

  const handleFieldChange = (name: keyof Student, value: string) => {
    // Handle numeric type for rollNo
    const processedValue = name === 'rollNo' ? (value === '' ? '' : Number(value)) : value;

    // Calculate new state immediately for validation context
    const newData = { ...formData, [name]: processedValue as any };
    setFormData(newData);
    
    // Clear generic form error when user types
    if (formError) setFormError(null);

    // Real-time validation if the field has been touched
    if (touched[name]) {
        setErrors(prev => ({ ...prev, [name]: validateField(name, processedValue, newData) }));
    }

    // Trigger dependent validation (e.g., changing DOB should re-validate Admission Date)
    if (name === 'dateOfBirth' && touched.admissionDate) {
         setErrors(prev => ({ ...prev, admissionDate: validateField('admissionDate', newData.admissionDate, newData) }));
    }
  };

  const handleBlur = (name: string) => {
      setTouched(prev => ({ ...prev, [name]: true }));
      setErrors(prev => ({ ...prev, [name]: validateField(name, formData[name as keyof Student], formData) }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields on submit
    const newErrors: Record<string, string> = {};
    let isValid = true;
    const fieldsToValidate = ['id', 'rollNo', 'fullName', 'contactNumber', 'className', 'section', 'dateOfBirth', 'admissionDate', 'address', 'gender'];
    
    fieldsToValidate.forEach(field => {
        const error = validateField(field, formData[field as keyof Student], formData);
        if (error) {
            newErrors[field] = error;
            isValid = false;
        }
    });

    setErrors(newErrors);
    setTouched(fieldsToValidate.reduce((acc, field) => ({...acc, [field]: true}), {}));

    if (!isValid) {
        setFormError("Please fix the errors in the form before saving.");
        return; 
    }

    try {
        db.saveStudent(formData);
        loadStudents();
        
        if (saveAction === 'SAVE_AND_NEW' && !isEdit) {
            // Reset for new entry with new auto-generated ID
            const creds = generateNewCredentials();
            setFormData({...initialFormState, ...creds});
            resetFormState();
        } else {
            setViewMode('LIST');
        }
    } catch (err) {
        console.error(err);
        setFormError("Failed to save student data.");
    }
  };

  const handleGenerateAIReport = async () => {
      if(!process.env.API_KEY) {
          alert("API Key not configured in environment.");
          return;
      }
      setAiLoading(true);
      // Fetch related data
      const exams = db.getExams().filter(e => e.studentId === formData.id);
      const attendance = db.getAttendance().filter(a => a.studentId === formData.id);
      
      const report = await generateStudentReport(formData, exams, attendance);
      setAiReport(report);
      setAiLoading(false);
  };

  const filteredStudents = students.filter(s => {
      const matchesSearch = 
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.rollNo.toString().includes(searchTerm) || 
        (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase()));

      // Strict comparison for class/section to avoid loose equality issues, converting to string
      const matchesClass = filterClass ? String(s.className) === String(filterClass) : true;
      const matchesSection = filterSection ? s.section === filterSection : true;
      
      return matchesSearch && matchesClass && matchesSection;
  });

  const clearFilters = () => {
      setFilterClass('');
      setFilterSection('');
      setSearchTerm('');
  };

  const hasActiveFilters = filterClass !== '' || filterSection !== '' || searchTerm !== '';

  // --- Render List ---
  if (viewMode === 'LIST') {
    return (
      <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 overflow-hidden h-full flex flex-col">
        <div className="p-4 md:p-6 border-b border-white/10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-white">Student Directory</h2>
                <p className="text-sm text-zinc-400">
                    {filteredStudents.length === students.length 
                        ? `Total Students: ${students.length}` 
                        : `Showing ${filteredStudents.length} of ${students.length} students`}
                </p>
            </div>
             <div className="flex gap-2">
                 <button 
                    onClick={handleExportCSV}
                    className="flex items-center justify-center p-2 md:px-4 md:py-2 bg-white/5 text-zinc-200 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium border border-white/10"
                    title="Export to CSV"
                >
                    <Download size={18} />
                 </button>
                 <button 
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-md shadow-indigo-900/50"
                >
                    <Plus size={18} /> <span className="hidden sm:inline">Add Student</span>
                 </button>
             </div>
          </div>
          
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
             <div className="relative flex-1 w-full lg:w-auto">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                 <input 
                    type="text" 
                    placeholder="Search Name, Roll No, ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
             </div>

             <div className="flex items-center gap-2 w-full lg:w-auto">
                 <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/10 flex-1 lg:flex-none">
                    <div className="flex items-center px-2 border-r border-white/10">
                        <Filter size={14} className="text-zinc-400 mr-2"/>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Filter</span>
                    </div>
                    <select 
                        value={filterClass} 
                        onChange={e => setFilterClass(e.target.value)}
                        className="bg-transparent outline-none text-sm p-1 text-zinc-300 w-24 cursor-pointer hover:text-white transition [&>option]:bg-zinc-900"
                    >
                        <option value="">All Classes</option>
                        {[...Array(12)].map((_, i) => <option key={i} value={i+1}>Class {i+1}</option>)}
                    </select>
                    <div className="w-px h-4 bg-white/10"></div>
                    <select 
                        value={filterSection} 
                        onChange={e => setFilterSection(e.target.value)}
                        className="bg-transparent outline-none text-sm p-1 text-zinc-300 w-24 cursor-pointer hover:text-white transition [&>option]:bg-zinc-900"
                    >
                        <option value="">All Sections</option>
                        {['A','B','C','D'].map(s => <option key={s} value={s}>Sec {s}</option>)}
                    </select>
                 </div>

                {hasActiveFilters && (
                    <button 
                        onClick={clearFilters}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                        title="Clear Filters"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}
             </div>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm text-zinc-300 min-w-[800px]">
            <thead className="bg-white/5 text-zinc-200 font-semibold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 border-b border-white/10">ID</th>
                <th className="px-6 py-4 border-b border-white/10">Roll No</th>
                <th className="px-6 py-4 border-b border-white/10">Name</th>
                <th className="px-6 py-4 border-b border-white/10">Class</th>
                <th className="px-6 py-4 border-b border-white/10">Contact</th>
                <th className="px-6 py-4 border-b border-white/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">{student.id}</td>
                      <td className="px-6 py-4 font-medium text-indigo-300">#{student.rollNo}</td>
                      <td className="px-6 py-4 font-medium text-white">{student.fullName}</td>
                      <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-white/10 rounded border border-white/10 text-xs font-medium">
                              {student.className} - {student.section}
                          </span>
                      </td>
                      <td className="px-6 py-4">{student.contactNumber}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button onClick={() => handleEdit(student)} className="p-2 text-blue-300 hover:bg-blue-900/30 rounded-lg transition" title="Edit">
                            <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 text-red-300 hover:bg-red-900/30 rounded-lg transition" title="Delete">
                            <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                          <div className="flex flex-col items-center gap-2">
                              <Filter size={32} className="opacity-20"/>
                              <p>No students found matching criteria.</p>
                              {hasActiveFilters && (
                                  <button onClick={clearFilters} className="text-indigo-400 hover:underline text-xs">Clear Filters</button>
                              )}
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- Render Form ---
  return (
    <div className="max-w-4xl mx-auto pb-10 h-full overflow-y-auto p-1 custom-scrollbar">
      <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 sticky top-0 z-20 backdrop-blur-xl">
          <h2 className="text-lg md:text-xl font-bold text-white">
            {isEdit ? 'Update Student Details' : 'New Student Registration'}
          </h2>
          <button onClick={() => setViewMode('LIST')} className="text-zinc-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 md:p-8">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6" noValidate>
                <FormField 
                    label="Student ID / Admission No" 
                    name="id" 
                    placeholder="Auto-generated" 
                    value={formData.id}
                    error={errors.id}
                    touched={touched.id}
                    onChange={handleFieldChange}
                    onBlur={handleBlur}
                    disabled={true} // Always auto-filled/locked for integrity
                />

                <FormField 
                    label="Roll Number" 
                    name="rollNo" 
                    type="number"
                    placeholder="e.g. 101"
                    value={formData.rollNo}
                    error={errors.rollNo}
                    touched={touched.rollNo}
                    onChange={handleFieldChange}
                    onBlur={handleBlur}
                />

                <FormField 
                    label="Full Name" 
                    name="fullName" 
                    placeholder="e.g. John Doe" 
                    value={formData.fullName}
                    error={errors.fullName}
                    touched={touched.fullName}
                    onChange={handleFieldChange}
                    onBlur={handleBlur}
                />

                <CustomDatePicker 
                    label="Admission Date"
                    value={formData.admissionDate}
                    onChange={(val: string) => handleFieldChange('admissionDate', val)}
                    error={errors.admissionDate}
                    touched={touched.admissionDate}
                />

                <FormField 
                    label="Class" 
                    name="className" 
                    options={[...Array(12)].map((_, i) => ({value: i+1, label: i+1}))} 
                    value={formData.className}
                    error={errors.className}
                    touched={touched.className}
                    onChange={handleFieldChange}
                    onBlur={handleBlur}
                />

                <FormField 
                    label="Section" 
                    name="section" 
                    options={['A','B','C','D'].map(s => ({value: s, label: s}))} 
                    value={formData.section}
                    error={errors.section}
                    touched={touched.section}
                    onChange={handleFieldChange}
                    onBlur={handleBlur}
                />

                <FormField 
                    label="Gender" 
                    name="gender" 
                    options={[{value: 'Male', label: 'Male'}, {value: 'Female', label: 'Female'}, {value: 'Other', label: 'Other'}]} 
                    value={formData.gender}
                    error={errors.gender}
                    touched={touched.gender}
                    onChange={handleFieldChange}
                    onBlur={handleBlur}
                />

                <CustomDatePicker 
                    label="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={(val: string) => handleFieldChange('dateOfBirth', val)}
                    error={errors.dateOfBirth}
                    touched={touched.dateOfBirth}
                />

                <FormField 
                    label="Contact Number" 
                    name="contactNumber" 
                    type="tel"
                    placeholder="10-digit mobile number" 
                    value={formData.contactNumber}
                    error={errors.contactNumber}
                    touched={touched.contactNumber}
                    onChange={handleFieldChange}
                    onBlur={handleBlur}
                />

                <FormField 
                    label="Address" 
                    name="address" 
                    placeholder="Full residential address (min 5 chars)" 
                    value={formData.address}
                    error={errors.address}
                    touched={touched.address}
                    onChange={handleFieldChange}
                    onBlur={handleBlur}
                />

                {formError && (
                    <div className="col-span-1 md:col-span-2 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-200 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                        <AlertCircle size={18} /> {formError}
                    </div>
                )}

                <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-4 mt-4 border-t border-white/10 pt-6">
                    <button 
                        type="submit" 
                        onClick={() => setSaveAction('SAVE')}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-900/50 flex justify-center items-center gap-2"
                    >
                        <Save size={20} /> {isEdit ? 'Update Student' : 'Save Student'}
                    </button>
                    
                    {!isEdit && (
                        <button 
                            type="submit"
                            onClick={() => setSaveAction('SAVE_AND_NEW')}
                            className="flex-1 bg-white/5 text-indigo-300 border border-white/10 py-3 rounded-lg font-medium hover:bg-white/10 transition flex justify-center items-center gap-2"
                        >
                            <CopyPlus size={20} /> Save & Add Another
                        </button>
                    )}

                    <button 
                        type="button" 
                        onClick={() => {
                            const creds = generateNewCredentials();
                            setFormData({...initialFormState, ...creds});
                            resetFormState();
                        }} 
                        className="px-6 py-3 border border-white/10 text-zinc-400 rounded-lg font-medium hover:bg-white/5 transition whitespace-nowrap"
                    >
                        Clear Form
                    </button>
                </div>
            </form>

            {/* AI Feature for Update Mode */}
            {isEdit && (
                <div className="mt-8 rounded-xl bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-transparent border border-indigo-500/20 overflow-hidden">
                    <div className="p-6 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                             <div>
                                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                     <Sparkles className="text-purple-400" size={20} /> 
                                     AI Performance Insight
                                 </h3>
                                 <p className="text-xs text-zinc-400 mt-1">
                                    Generates a professional report card summary based on exams & attendance.
                                 </p>
                             </div>
                             <button 
                                onClick={handleGenerateAIReport}
                                disabled={aiLoading}
                                className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium overflow-hidden transition-all hover:bg-purple-700 shadow-lg shadow-purple-900/40 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                             >
                                 {aiLoading ? (
                                     <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Analyzing Data...
                                     </span>
                                 ) : (
                                     <>
                                        <Wand2 size={16} className="group-hover:rotate-12 transition-transform" />
                                        <span>Generate Report</span>
                                     </>
                                 )}
                             </button>
                        </div>
                        
                        {aiReport && (
                            <div className="bg-black/40 border border-white/10 p-5 rounded-xl text-zinc-200 text-sm leading-relaxed italic shadow-inner relative animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="absolute -top-2 -left-2 text-4xl text-white/10 font-serif">"</div>
                                <p className="relative z-10">{aiReport}</p>
                                <div className="absolute -bottom-4 -right-2 text-4xl text-white/10 font-serif">"</div>
                            </div>
                        )}
                        
                        {!aiReport && !aiLoading && (
                            <div className="text-center py-6 text-zinc-500 text-xs border-2 border-dashed border-white/5 rounded-xl">
                                Click generate to analyze student performance data.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StudentManager;