import React, { useState, useEffect } from 'react';
import { Student, FeeRecord, Transaction } from '../types';
import { db } from '../services/db';
import { CheckCircle, XCircle, Banknote, History, ChevronDown, ChevronUp, Search, Filter, Printer, CreditCard, Wallet, Receipt, AlertCircle } from 'lucide-react';

const FeesManager: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [academicYear] = useState('2023-2024');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  
  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'PARTIAL'>('ALL');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
      studentId: string;
      studentName: string;
      semester: 1 | 2;
      currentDue: number;
  } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
      amount: 0,
      mode: 'CASH',
      date: new Date().toISOString().split('T')[0],
      transactionId: ''
  });

  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [receiptStudent, setReceiptStudent] = useState<Student | null>(null);

  const SEMESTER_FEE = 11000;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const s = db.getStudents();
    const f = db.getFees();
    setStudents(s);
    setFees(f);
  };

  const getFeeRecord = (studentId: string): FeeRecord => {
    const existing = fees.find(f => f.studentId === studentId && f.academicYear === academicYear);
    if (existing) return existing;
    return {
        id: `${studentId}-${academicYear}`,
        studentId,
        academicYear,
        semester1Paid: false,
        semester2Paid: false,
        transactions: []
    };
  };

  const getSemesterStats = (record: FeeRecord, semester: 1 | 2) => {
      const txns = record.transactions || [];
      const paid = txns.filter(t => t.semester === semester).reduce((sum, t) => sum + t.amount, 0);
      const due = SEMESTER_FEE - paid;
      const status = paid >= SEMESTER_FEE ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING';
      return { paid, due, status };
  };

  // --- Statistics Calculation ---
  const totalStudents = students.length;
  const totalExpectedRevenue = totalStudents * SEMESTER_FEE * 2;
  
  const totalCollected = fees.reduce((acc, f) => {
      const txns = f.transactions || [];
      return acc + txns.reduce((sum, t) => sum + t.amount, 0);
  }, 0);

  const pendingRevenue = totalExpectedRevenue - totalCollected;
  
  const defaultersCount = students.filter(s => {
      const r = getFeeRecord(s.id);
      const s1 = getSemesterStats(r, 1);
      const s2 = getSemesterStats(r, 2);
      return s1.status !== 'PAID' || s2.status !== 'PAID';
  }).length;

  // --- Handlers ---

  const initiatePayment = (student: Student, semester: 1 | 2) => {
      const record = getFeeRecord(student.id);
      const stats = getSemesterStats(record, semester);

      if (stats.status === 'PAID') {
          alert(`Semester ${semester} fees are already fully paid.`);
          return;
      }

      setSelectedPayment({
          studentId: student.id,
          studentName: student.fullName,
          semester,
          currentDue: stats.due
      });
      setPaymentForm({
          amount: stats.due, // Auto-fill remaining amount
          mode: 'CASH',
          date: new Date().toISOString().split('T')[0],
          transactionId: `TXN-${Date.now()}`
      });
      setShowPaymentModal(true);
  };

  const processPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPayment) return;

      if (paymentForm.amount <= 0) {
          alert("Please enter a valid amount.");
          return;
      }
      if (paymentForm.amount > selectedPayment.currentDue) {
          alert(`Amount exceeds the due balance of ₹${selectedPayment.currentDue}`);
          return;
      }

      const record = getFeeRecord(selectedPayment.studentId);
      
      const newTransaction: Transaction = {
          id: paymentForm.transactionId || `TXN-${Date.now()}`,
          date: paymentForm.date,
          amount: paymentForm.amount,
          type: paymentForm.mode as any,
          semester: selectedPayment.semester
      };

      const updatedRecord = { ...record };
      if (!updatedRecord.transactions) updatedRecord.transactions = [];
      updatedRecord.transactions.push(newTransaction);

      // Update boolean flags based on new totals for backward compatibility
      const s1Stats = getSemesterStats(updatedRecord, 1);
      const s2Stats = getSemesterStats(updatedRecord, 2);
      
      updatedRecord.semester1Paid = s1Stats.status === 'PAID';
      updatedRecord.semester2Paid = s2Stats.status === 'PAID';
      updatedRecord.lastPaymentDate = paymentForm.date;

      db.saveFeeRecord(updatedRecord);
      loadData();
      setShowPaymentModal(false);
      
      const student = students.find(s => s.id === selectedPayment.studentId);
      if(student) {
        handleShowReceipt(newTransaction, student);
      }
  };

  const handleShowReceipt = (txn: Transaction, student: Student) => {
      setReceiptStudent(student);
      setShowReceipt(txn);
  };

  const toggleHistory = (studentId: string) => {
      setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  // --- Filtering ---
  const filteredStudents = students.filter(s => {
      const record = getFeeRecord(s.id);
      const s1 = getSemesterStats(record, 1);
      const s2 = getSemesterStats(record, 2);
      
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.rollNo.toString().includes(searchTerm);
      
      if (statusFilter === 'PAID') {
          return matchesSearch && (s1.status === 'PAID' && s2.status === 'PAID');
      }
      if (statusFilter === 'PENDING') {
          return matchesSearch && (s1.status === 'PENDING' || s2.status === 'PENDING');
      }
      if (statusFilter === 'PARTIAL') {
          return matchesSearch && (s1.status === 'PARTIAL' || s2.status === 'PARTIAL');
      }
      
      return matchesSearch;
  });

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-sm border border-white/10 h-full flex flex-col relative">
      {/* Header & Stats */}
      <div className="p-6 border-b border-white/10 space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Banknote className="text-green-400" /> Fees Management
                </h2>
                <p className="text-zinc-400 text-sm mt-1">Academic Year: {academicYear}</p>
            </div>
            <div className="flex gap-2">
                <div className="text-right hidden md:block">
                    <div className="text-xs text-zinc-400">Standard Fee</div>
                    <div className="text-lg font-bold text-white">₹{SEMESTER_FEE.toLocaleString()} <span className="text-xs font-normal text-zinc-500">/ sem</span></div>
                </div>
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                <div className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Total Collected</div>
                <div className="text-2xl font-bold text-green-400">₹{totalCollected.toLocaleString()}</div>
                <div className="text-xs text-green-500/60 mt-1">Revenue realized</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                <div className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Pending Fees</div>
                <div className="text-2xl font-bold text-orange-400">₹{pendingRevenue.toLocaleString()}</div>
                <div className="text-xs text-orange-500/60 mt-1">Outstanding amount</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                <div className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Defaulters</div>
                <div className="text-2xl font-bold text-red-400">{defaultersCount}</div>
                <div className="text-xs text-red-500/60 mt-1">Students with dues</div>
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search by Name or Roll No..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/10 overflow-x-auto">
                {(['ALL', 'PAID', 'PARTIAL', 'PENDING'] as const).map((filter) => (
                    <button 
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                            statusFilter === filter 
                            ? 'bg-white/10 text-white shadow-sm' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        {filter.charAt(0) + filter.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-zinc-300 min-w-[900px]">
          <thead className="bg-white/5 text-zinc-200 font-semibold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 border-b border-white/10">Student Info</th>
              <th className="px-6 py-4 border-b border-white/10 text-center">Sem 1 Status</th>
              <th className="px-6 py-4 border-b border-white/10 text-center">Sem 2 Status</th>
              <th className="px-6 py-4 border-b border-white/10 text-center">Total Paid</th>
              <th className="px-6 py-4 border-b border-white/10 text-center">History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredStudents.length > 0 ? filteredStudents.map((student) => {
              const record = getFeeRecord(student.id);
              const s1 = getSemesterStats(record, 1);
              const s2 = getSemesterStats(record, 2);
              const totalPaid = s1.paid + s2.paid;
              const isExpanded = expandedStudent === student.id;

              const renderStatus = (stats: { paid: number, due: number, status: string }, semester: 1 | 2) => (
                  <div className="flex flex-col items-center gap-1">
                      <button 
                          onClick={() => initiatePayment(student, semester)}
                          disabled={stats.status === 'PAID'}
                          className={`group relative px-4 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all w-32
                              ${stats.status === 'PAID'
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/20 cursor-default' 
                                  : stats.status === 'PARTIAL'
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                  : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-900/50'
                              }`}
                      >
                          {stats.status === 'PAID' ? (
                              <><CheckCircle size={14} /> <span>PAID</span></>
                          ) : stats.status === 'PARTIAL' ? (
                              <><AlertCircle size={14} /> <span>PARTIAL</span></>
                          ) : (
                              <><Wallet size={14} /> <span>PAY NOW</span></>
                          )}
                      </button>
                      {stats.status !== 'PAID' && (
                          <div className="text-[10px] text-zinc-500 font-mono">
                              Due: <span className="text-red-400">₹{stats.due.toLocaleString()}</span>
                          </div>
                      )}
                  </div>
              );

              return (
                <React.Fragment key={student.id}>
                    <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-medium text-white text-base">{student.fullName}</div>
                            <div className="text-xs text-zinc-400 mt-0.5">Roll: <span className="text-zinc-300">#{student.rollNo}</span> | Class: {student.className}-{student.section}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            {renderStatus(s1, 1)}
                        </td>
                        <td className="px-6 py-4 text-center">
                            {renderStatus(s2, 2)}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-medium text-white bg-white/5">
                            ₹{totalPaid.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <button onClick={() => toggleHistory(student.id)} className={`p-2 rounded-lg transition ${isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
                                {isExpanded ? <ChevronUp size={18}/> : <History size={18}/>}
                            </button>
                        </td>
                    </tr>
                    {isExpanded && (
                        <tr className="bg-black/30 shadow-inner">
                            <td colSpan={5} className="px-6 py-6 border-b border-white/10">
                                <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-4">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                                        <Receipt size={14} /> Transaction History
                                    </h4>
                                    {record.transactions && record.transactions.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {record.transactions.map((t, idx) => (
                                                <div key={idx} className="relative bg-black/40 p-4 rounded-lg border border-white/5 hover:border-indigo-500/30 transition-colors group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`p-1.5 rounded bg-white/5 ${t.type === 'UPI' ? 'text-blue-400' : t.type === 'CASH' ? 'text-green-400' : 'text-purple-400'}`}>
                                                                <CreditCard size={14} />
                                                            </span>
                                                            <span className="font-medium text-zinc-200 text-sm">{t.type}</span>
                                                        </div>
                                                        <div className="text-xs text-zinc-500 font-mono">{t.date}</div>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <div className="text-xs text-zinc-500 mb-0.5">Semester {t.semester}</div>
                                                            <div className="font-mono text-lg font-bold text-white">₹{t.amount.toLocaleString()}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleShowReceipt(t, student)}
                                                            className="opacity-0 group-hover:opacity-100 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all shadow-lg"
                                                            title="Print Receipt"
                                                        >
                                                            <Printer size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="absolute top-2 right-2 text-[10px] text-zinc-600 font-mono">{t.id}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-zinc-500 italic text-center py-4">No transactions recorded yet.</div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
              );
            }) : (
                <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                        No students found matching criteria.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <div>
                          <h3 className="text-xl font-bold text-white">Collect Fees</h3>
                          <p className="text-sm text-zinc-400">Semester {selectedPayment.semester} Payment</p>
                      </div>
                      <button onClick={() => setShowPaymentModal(false)} className="text-zinc-400 hover:text-white"><XCircle size={24} /></button>
                  </div>
                  <form onSubmit={processPayment} className="p-6 space-y-5">
                      <div>
                          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Student</label>
                          <div className="text-lg font-medium text-white">{selectedPayment.studentName}</div>
                          <div className="text-sm text-zinc-400 font-mono mt-0.5">ID: {selectedPayment.studentId}</div>
                      </div>

                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                          <div className="flex justify-between text-sm mb-1">
                                <span className="text-zinc-400">Total Fee</span>
                                <span className="text-zinc-200">₹{SEMESTER_FEE.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Pending Due</span>
                                <span className="text-red-400 font-bold">₹{selectedPayment.currentDue.toLocaleString()}</span>
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Paying Amount (₹)</label>
                          <input 
                              type="number" 
                              max={selectedPayment.currentDue}
                              min={1}
                              value={paymentForm.amount}
                              onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-xl font-mono text-white focus:ring-2 focus:ring-green-500 outline-none"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Payment Mode</label>
                              <select 
                                  value={paymentForm.mode}
                                  onChange={e => setPaymentForm({...paymentForm, mode: e.target.value})}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none [&>option]:bg-zinc-900"
                              >
                                  <option value="CASH">Cash</option>
                                  <option value="UPI">UPI / GPay</option>
                                  <option value="CHEQUE">Cheque</option>
                                  <option value="ONLINE">Net Banking</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Date</label>
                              <input 
                                  type="date"
                                  value={paymentForm.date}
                                  onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Transaction ID (Optional)</label>
                          <input 
                              type="text" 
                              placeholder="Auto-generated if empty"
                              value={paymentForm.transactionId}
                              onChange={e => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                      </div>

                      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-900/40 transition flex items-center justify-center gap-2 mt-4">
                          <CheckCircle size={20} /> Confirm Payment
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Receipt Modal (Simulation) */}
      {showReceipt && receiptStudent && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4">
              <div className="bg-white text-zinc-900 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-200">
                  <div className="p-8 border-b-2 border-zinc-100 border-dashed flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center mb-3">
                          <Banknote size={24} />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight">Udaan Vidhyalay</h2>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Payment Receipt</p>
                  </div>
                  
                  <div className="p-8 space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">Date</span>
                          <span className="font-medium">{showReceipt.date}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">Receipt No</span>
                          <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded">{showReceipt.id}</span>
                      </div>
                      <div className="border-t border-dashed border-zinc-200 my-2"></div>
                      <div>
                          <span className="text-xs text-zinc-400 block mb-1">Student Details</span>
                          <div className="font-bold">{receiptStudent.fullName}</div>
                          <div className="text-sm text-zinc-600">Class {receiptStudent.className} - {receiptStudent.section}</div>
                      </div>
                      <div>
                          <span className="text-xs text-zinc-400 block mb-1">Description</span>
                          <div className="flex justify-between">
                              <span className="text-sm font-medium">Semester {showReceipt.semester} Fees</span>
                              <span className="font-bold">₹{showReceipt.amount.toLocaleString()}</span>
                          </div>
                      </div>
                      <div className="bg-zinc-50 p-3 rounded-lg flex justify-between items-center border border-zinc-100 mt-4">
                          <span className="text-sm text-zinc-500">Paid via</span>
                          <span className="font-bold text-zinc-800">{showReceipt.type}</span>
                      </div>
                  </div>

                  <div className="bg-zinc-900 p-4 text-white text-center">
                       <div className="flex gap-2 justify-center">
                            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-md text-sm font-bold hover:bg-zinc-200 transition">
                                <Printer size={16} /> Print
                            </button>
                            <button onClick={() => setShowReceipt(null)} className="px-4 py-2 border border-white/20 rounded-md text-sm font-medium hover:bg-white/10 transition">
                                Close
                            </button>
                       </div>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute top-[148px] -left-3 w-6 h-6 bg-zinc-900 rounded-full"></div>
                  <div className="absolute top-[148px] -right-3 w-6 h-6 bg-zinc-900 rounded-full"></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FeesManager;