
export enum View {
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  FEES = 'FEES',
  ATTENDANCE = 'ATTENDANCE',
  EXAMS = 'EXAMS',
  SETTINGS = 'SETTINGS'
}

export interface Student {
  id: string;
  rollNo: number;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  contactNumber: string;
  address: string;
  className: string;
  section: string;
  admissionDate: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  qualification: string;
  phone: string;
  salary: number;
  joinDate: string;
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  date: string;
  status: 'Present' | 'Absent';
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'UPI' | 'CASH' | 'ONLINE';
  semester: 1 | 2;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  academicYear: string;
  semester1Paid: boolean; // 11000 (First 6 months)
  semester2Paid: boolean; // 11000 (After 6 months)
  lastPaymentDate?: string;
  transactions?: Transaction[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
}

export interface ExamResult {
  id: string;
  studentId: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  examType: 'Mid-Term' | 'Final';
}
