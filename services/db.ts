
import { Student, FeeRecord, AttendanceRecord, ExamResult, Transaction, Teacher, TeacherAttendance } from '../types';

// Keys for LocalStorage
const STORAGE_KEYS = {
  STUDENTS: 'uv_students_v1',
  TEACHERS: 'uv_teachers_v1',
  TEACHER_ATTENDANCE: 'uv_teacher_attendance_v1',
  FEES: 'uv_fees_v1',
  ATTENDANCE: 'uv_attendance_v1',
  EXAMS: 'uv_exams_v1',
};

class DatabaseService {
  // Helper to simulate DB delay for realism (optional, kept 0 for speed)
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- Teachers ---
  getTeachers(): Teacher[] {
    const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return data ? JSON.parse(data) : [];
  }

  saveTeacher(teacher: Teacher): void {
    const teachers = this.getTeachers();
    const existingIndex = teachers.findIndex(t => t.id === teacher.id);
    
    if (existingIndex >= 0) {
      teachers[existingIndex] = teacher;
    } else {
      teachers.push(teacher);
    }
    
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }

  deleteTeacher(id: string): void {
    const teachers = this.getTeachers().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }

  getTeacherAttendance(): TeacherAttendance[] {
    const data = localStorage.getItem(STORAGE_KEYS.TEACHER_ATTENDANCE);
    return data ? JSON.parse(data) : [];
  }

  saveTeacherAttendance(record: TeacherAttendance): void {
    const data = this.getTeacherAttendance();
    const index = data.findIndex(d => d.id === record.id);
    if (index >= 0) data[index] = record;
    else data.push(record);
    localStorage.setItem(STORAGE_KEYS.TEACHER_ATTENDANCE, JSON.stringify(data));
  }

  getTeacherCount(): number {
    return this.getTeachers().length;
  }

  // --- Students ---
  getStudents(): Student[] {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return data ? JSON.parse(data) : [];
  }

  saveStudent(student: Student): void {
    const students = this.getStudents();
    const existingIndex = students.findIndex(s => s.id === student.id);
    
    if (existingIndex >= 0) {
      students[existingIndex] = student;
    } else {
      students.push(student);
    }
    
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  deleteStudent(id: string): void {
    const students = this.getStudents().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    
    // Cleanup related records
    this.cleanupRelatedRecords(id);
  }

  private cleanupRelatedRecords(studentId: string) {
    // Fees
    const fees = this.getFees().filter(f => f.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(fees));
    // Attendance
    const att = this.getAttendance().filter(a => a.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(att));
    // Exams
    const exams = this.getExams().filter(e => e.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  }

  getNextRollNo(): number {
    const students = this.getStudents();
    if (students.length === 0) return 1001;
    const maxRoll = Math.max(...students.map(s => s.rollNo));
    return maxRoll + 1;
  }

  // --- Fees ---
  getFees(): FeeRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.FEES);
    return data ? JSON.parse(data) : [];
  }

  saveFeeRecord(record: FeeRecord): void {
    const fees = this.getFees();
    const index = fees.findIndex(f => f.id === record.id);
    if (index >= 0) fees[index] = record;
    else fees.push(record);
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(fees));
  }

  // --- Attendance ---
  getAttendance(): AttendanceRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  }

  saveAttendance(record: AttendanceRecord): void {
    const data = this.getAttendance();
    const index = data.findIndex(d => d.id === record.id);
    if (index >= 0) data[index] = record;
    else data.push(record);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data));
  }

  // --- Exams ---
  getExams(): ExamResult[] {
    const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
    return data ? JSON.parse(data) : [];
  }

  saveExamResult(result: ExamResult): void {
    const data = this.getExams();
    const index = data.findIndex(d => d.id === result.id);
    if (index >= 0) data[index] = result;
    else data.push(result);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(data));
  }

  // Initialize fake data if empty
  initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
        // Initialize with empty array instead of dummy data
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
        // Initialize with empty array instead of dummy data
        localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify([]));
    }
  }
}

export const db = new DatabaseService();
