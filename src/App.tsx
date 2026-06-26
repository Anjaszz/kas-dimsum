import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Transaction, Batch, EmployeeBatch, TransactionType } from './types';
import { PasswordModal } from './components/PasswordModal';
import { ImageModal } from './components/ImageModal';
import { TutupBukuModal } from './components/TutupBukuModal';
import { TutupBukuKaryawanModal } from './components/TutupBukuKaryawanModal';
import { DashboardPage } from './pages/DashboardPage';
import { ProfitPage } from './pages/ProfitPage';
import { EmployeePage } from './pages/EmployeePage';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{isOpen: boolean, action: 'edit' | 'delete' | 'edit_report' | 'delete_report' | null, data: any}>({isOpen: false, action: null, data: null});
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'profit'>('dashboard');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [profitTransactions, setProfitTransactions] = useState<Transaction[]>([]);
  const [profitBatches, setProfitBatches] = useState<Batch[]>([]);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [expandedProfitBatchId, setExpandedProfitBatchId] = useState<string | null>(null);

  // Daily Report State
  const [grossIncome, setGrossIncome] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [tutupBukuModal, setTutupBukuModal] = useState<{isOpen: boolean, startDate: string, endDate: string, batchName: string}>({
    isOpen: false,
    startDate: '',
    endDate: '',
    batchName: ''
  });

  // Employee Sales & Performance State
  const [employees, setEmployees] = useState<string[]>(() => {
    const saved = localStorage.getItem('dimsum_employees');
    return saved ? JSON.parse(saved) : ['Sabrina', 'Tiara'];
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState<string>('');
  const [employeeBatches, setEmployeeBatches] = useState<EmployeeBatch[]>(() => {
    const saved = localStorage.getItem('dimsum_employee_batches');
    return saved ? JSON.parse(saved) : [];
  });
  const [tutupBukuKaryawanModal, setTutupBukuKaryawanModal] = useState<{isOpen: boolean, startDate: string, endDate: string, batchName: string}>({
    isOpen: false,
    startDate: '',
    endDate: '',
    batchName: ''
  });
  const [expandedEmpBatchId, setExpandedEmpBatchId] = useState<string | null>(null);
  const [expandedEmployeeCard, setExpandedEmployeeCard] = useState<string | null>(null);
  const [editingEmployeeName, setEditingEmployeeName] = useState<string | null>(null);
  const [editEmployeeInput, setEditEmployeeInput] = useState<string>('');

  const [type, setType] = useState<TransactionType>('pemasukan');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLocalDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [date, setDate] = useState<string>(getLocalDateTime());
  const [description, setDescription] = useState<string>('');
  
  // Storage logic
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Initialize Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      const savedTrans = localStorage.getItem('dimsum_transactions');
      if (savedTrans) setTransactions(JSON.parse(savedTrans));
      
      const savedRep = localStorage.getItem('dimsum_reports');
      if (savedRep) setSavedReports(JSON.parse(savedRep));

      const savedBatches = localStorage.getItem('dimsum_batches');
      if (savedBatches) setBatches(JSON.parse(savedBatches));

      const savedProfitTrans = localStorage.getItem('dimsum_profit_transactions');
      if (savedProfitTrans) setProfitTransactions(JSON.parse(savedProfitTrans));

      const savedProfitBatches = localStorage.getItem('dimsum_profit_batches');
      if (savedProfitBatches) setProfitBatches(JSON.parse(savedProfitBatches));

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: transData, error: transError } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });
          
          if (!transError && transData) {
            setTransactions(transData);
            localStorage.setItem('dimsum_transactions', JSON.stringify(transData));
          }

          const { data: reportData, error: reportError } = await supabase
            .from('daily_reports')
            .select('*')
            .order('date', { ascending: false });
          
          if (!reportError && reportData) {
            setSavedReports(reportData);
            localStorage.setItem('dimsum_reports', JSON.stringify(reportData));
          }

          const { data: batchData, error: batchError } = await supabase
            .from('batches')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!batchError && batchData) {
            setBatches(batchData);
            localStorage.setItem('dimsum_batches', JSON.stringify(batchData));
          }

          const { data: profitTransData, error: profitTransError } = await supabase
            .from('profit_transactions')
            .select('*')
            .order('date', { ascending: false });
          
          if (!profitTransError && profitTransData) {
            setProfitTransactions(profitTransData);
            localStorage.setItem('dimsum_profit_transactions', JSON.stringify(profitTransData));
          }

          const { data: profitBatchData, error: profitBatchError } = await supabase
            .from('profit_batches')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!profitBatchError && profitBatchData) {
            setProfitBatches(profitBatchData);
            localStorage.setItem('dimsum_profit_batches', JSON.stringify(profitBatchData));
          }
        } catch (error) {
          console.error("Gagal sinkronisasi Supabase:", error);
        }
      } 

      setIsLoading(false);
    };
    loadData();
  }, []);

  // Save reports to local storage whenever changed
  useEffect(() => {
    localStorage.setItem('dimsum_reports', JSON.stringify(savedReports));
  }, [savedReports]);

  // Save batches to local storage
  useEffect(() => {
    localStorage.setItem('dimsum_batches', JSON.stringify(batches));
  }, [batches]);

  // Save employees to local storage
  useEffect(() => {
    localStorage.setItem('dimsum_employees', JSON.stringify(employees));
  }, [employees]);

  // Save employee batches to local storage
  useEffect(() => {
    localStorage.setItem('dimsum_employee_batches', JSON.stringify(employeeBatches));
  }, [employeeBatches]);

  // Save profit data to local storage
  useEffect(() => {
    localStorage.setItem('dimsum_profit_transactions', JSON.stringify(profitTransactions));
  }, [profitTransactions]);

  useEffect(() => {
    localStorage.setItem('dimsum_profit_batches', JSON.stringify(profitBatches));
  }, [profitBatches]);

  // Save to local storage only if not configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('dimsum_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  const promptPassword = (action: 'edit' | 'delete' | 'edit_report' | 'delete_report', data: any) => {
    setPasswordModal({ isOpen: true, action, data });
    setPasswordInput('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Anjas123') {
      if (passwordModal.action === 'edit') {
        const t = passwordModal.data as Transaction;
        setEditingId(t.id);
        setType(t.type);
        setAmount(new Intl.NumberFormat('id-ID').format(t.amount));
        setDate(t.date);
        setDescription(t.description);
        setImagePreview(t.image);
        setImageFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (passwordModal.action === 'delete') {
        if (activeTab === 'profit') {
          executeDeleteProfit(passwordModal.data as string);
        } else {
          executeDelete(passwordModal.data as string);
        }
      } else if (passwordModal.action === 'edit_report') {
        const report = passwordModal.data;
        setEditingReportId(report.id);
        setReportDate(report.date);
        setGrossIncome(new Intl.NumberFormat('id-ID').format(report.gross));
        const reportEmps = report.expenses 
          ? report.expenses.map((e: any) => e.name).filter(Boolean) 
          : [];
        setSelectedEmployees(reportEmps);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (passwordModal.action === 'delete_report') {
        executeDeleteReport(passwordModal.data as string);
      }
      setPasswordModal({ isOpen: false, action: null, data: null });
    } else {
      alert('Password salah!');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
    setImagePreview(null);
    setImageFile(null);
    setDate(getLocalDateTime());
    const fileInput = document.getElementById('image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const executeDelete = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } catch (err) {
        console.error("Gagal menghapus:", err);
        alert("Gagal menghapus transaksi dari database.");
        return;
      }
    }
    
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const executeDeleteProfit = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profit_transactions')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } catch (err) {
        console.error("Gagal menghapus profit:", err);
        alert("Gagal menghapus transaksi profit dari database.");
        return;
      }
    }
    
    setProfitTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 2MB');
        e.target.value = '';
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/\./g, ''));
    if (!numericAmount || isNaN(numericAmount)) return;

    setIsSubmitting(true);
    let imageUrl: string | null = null;
    let finalBase64Preview = imagePreview;

    if (isSupabaseConfigured && supabase) {
      try {
        if (imageFile) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('transactions_media')
            .upload(filePath, imageFile);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            alert("Gagal mengupload gambar struk ke Supabase Storage.");
            setIsSubmitting(false);
            return;
          }

          const { data: publicUrlData } = supabase.storage
            .from('transactions_media')
            .getPublicUrl(filePath);
            
          imageUrl = publicUrlData.publicUrl;
        }

        const tableName = activeTab === 'profit' ? 'profit_transactions' : 'transactions';
        const dbTransactionData = {
          type: activeTab === 'profit' ? 'pemasukan' : type,
          amount: numericAmount,
          date,
          description: description || (activeTab === 'profit' ? 'Profit Bulanan' : (type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran')),
          image: imageUrl ? imageUrl : (editingId && !imageFile ? finalBase64Preview : null)
        };

        if (editingId) {
          const { error: updateError } = await supabase
            .from(tableName)
            .update(dbTransactionData)
            .eq('id', editingId);
            
          if (updateError) {
            console.error("DB Update Error:", updateError);
            alert("Gagal memperbarui transaksi.");
            setIsSubmitting(false);
            return;
          }
          if (activeTab === 'profit') {
            setProfitTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...dbTransactionData, id: editingId } : t));
          } else {
            setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...dbTransactionData, id: editingId } : t));
          }
        } else {
          const { data: insertedData, error: insertError } = await supabase
            .from(tableName)
            .insert([dbTransactionData])
            .select()
            .single();
            
          if (insertError) {
            console.error("DB Insert Error:", insertError);
            alert("Gagal menyimpan transaksi ke database.");
            setIsSubmitting(false);
            return;
          }
          
          if (activeTab === 'profit') {
            setProfitTransactions(prev => [insertedData, ...prev]);
          } else {
            setTransactions(prev => [insertedData, ...prev]);
          }
        }

      } catch (err) {
        console.error("Error tidak terduga:", err);
        setIsSubmitting(false);
        return;
      }
    } else {
      const transactionData = {
        type: activeTab === 'profit' ? 'pemasukan' : type,
        amount: numericAmount,
        date,
        description: description || (activeTab === 'profit' ? 'Profit Bulanan' : (type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran')),
        image: finalBase64Preview
      };

      if (editingId) {
        if (activeTab === 'profit') {
          setProfitTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...transactionData, id: editingId } : t));
        } else {
          setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...transactionData, id: editingId } : t));
        }
      } else {
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          ...transactionData
        };
        if (activeTab === 'profit') {
          setProfitTransactions(prev => [newTransaction, ...prev]);
        } else {
          setTransactions(prev => [newTransaction, ...prev]);
        }
      }
    }
    
    handleCancelEdit();
    setIsSubmitting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpense;

  const currentTransactions = transactions.filter(t => !t.batch_id);
  const currentTotalIncome = currentTransactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentTotalExpense = currentTransactions
    .filter(t => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = currentTotalIncome - currentTotalExpense;

  const allTimeProfit = profitTransactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentProfitTransactions = profitTransactions.filter(t => !t.batch_id);
  const currentPeriodProfit = currentProfitTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Helper to extract employee names from a report record
  const getReportEmployees = (report: any): string[] => {
    if (!report || !report.expenses || !Array.isArray(report.expenses)) return [];
    return report.expenses
      .filter((exp: any) => exp && typeof exp === 'object' && exp.name && !('amount' in exp))
      .map((exp: any) => exp.name);
  };

  const isEmployeeReport = (report: any): boolean => {
    return getReportEmployees(report).length > 0;
  };

  const getEmployeeStats = () => {
    const statsMap: { [key: string]: any } = {};
    
    employees.forEach(empName => {
      statsMap[empName] = {
        name: empName,
        daysWorked: 0,
        totalGross: 0,
        splitGross: 0,
        avgGross: 0,
        history: [],
        isActive: true
      };
    });

    savedReports.forEach((report: any) => {
      const reportEmps = getReportEmployees(report);
      if (reportEmps.length === 0) return;

      const grossVal = report.gross || 0;
      const splitVal = grossVal / reportEmps.length;

      reportEmps.forEach((empName: string) => {
        if (!statsMap[empName]) {
          statsMap[empName] = {
            name: empName,
            daysWorked: 0,
            totalGross: 0,
            splitGross: 0,
            avgGross: 0,
            history: [],
            isActive: false
          };
        }
        
        const s = statsMap[empName];
        s.daysWorked += 1;
        s.totalGross += grossVal;
        s.splitGross += splitVal;
        s.history.push({
          id: report.id,
          date: report.date,
          gross: grossVal,
          split: splitVal,
          numEmployees: reportEmps.length
        });
      });
    });

    Object.keys(statsMap).forEach(empName => {
      const s = statsMap[empName];
      if (s.daysWorked > 0) {
        s.avgGross = s.totalGross / s.daysWorked;
        s.history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    });

    return Object.values(statsMap).sort((a: any, b: any) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.splitGross - a.splitGross;
    });
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newEmployeeName.trim();
    if (!cleanName) return;
    if (employees.some(emp => emp.toLowerCase() === cleanName.toLowerCase())) {
      alert(`Karyawan dengan nama "${cleanName}" sudah ada!`);
      return;
    }
    setEmployees(prev => [...prev, cleanName]);
    setNewEmployeeName('');
  };

  const handleDeleteEmployee = (name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus "${name}" dari daftar aktif?\n\nCatatan: Riwayat kerjanya di laporan bulanan tidak akan hilang.`)) {
      setEmployees(prev => prev.filter(emp => emp !== name));
      setSelectedEmployees(prev => prev.filter(emp => emp !== name));
    }
  };

  const handleToggleSelectEmployee = (name: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(name)) {
        return prev.filter(emp => emp !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  const handleUpdateEmployee = async (oldName: string, newName: string) => {
    const cleanNewName = newName.trim();
    if (!cleanNewName) return;
    if (cleanNewName.toLowerCase() === oldName.toLowerCase()) {
      setEditingEmployeeName(null);
      return;
    }
    if (employees.some(emp => emp.toLowerCase() === cleanNewName.toLowerCase())) {
      alert(`Karyawan dengan nama "${cleanNewName}" sudah ada!`);
      return;
    }

    setIsSubmitting(true);
    setEmployees(prev => prev.map(emp => emp === oldName ? cleanNewName : emp));
    setSelectedEmployees(prev => prev.map(emp => emp === oldName ? cleanNewName : emp));

    const updatedReports = savedReports.map(report => {
      const reportEmps = getReportEmployees(report);
      if (reportEmps.includes(oldName)) {
        const newExpenses = report.expenses.map((exp: any) => 
          exp && exp.name === oldName ? { ...exp, name: cleanNewName } : exp
        );
        const updatedRep = { ...report, expenses: newExpenses };

        if (isSupabaseConfigured && supabase) {
          supabase
            .from('daily_reports')
            .update({ expenses: newExpenses })
            .eq('id', report.id)
            .then(({ error }) => {
              if (error) {
                console.error(`Gagal memperbarui nama di laporan ${report.id} pada database:`, error);
              }
            });
        }
        return updatedRep;
      }
      return report;
    });

    setSavedReports(updatedReports);
    setEditingEmployeeName(null);
    setIsSubmitting(false);
    alert(`Nama karyawan berhasil diubah dari "${oldName}" menjadi "${cleanNewName}".`);
  };

  const numericGross = Number(grossIncome.replace(/\./g, '')) || 0;

  const handleSaveReport = async () => {
    if (numericGross <= 0) {
      alert("Mohon masukkan jumlah total penjualan yang valid.");
      return;
    }
    if (selectedEmployees.length === 0) {
      alert("Mohon pilih minimal 1 karyawan yang bertugas hari ini.");
      return;
    }

    const reportData = {
      date: reportDate,
      gross: numericGross,
      expenses: selectedEmployees.map(name => ({ name })),
      sisa: 0
    };

    setIsSubmitting(true);
    if (isSupabaseConfigured && supabase) {
      try {
        if (editingReportId) {
          const { error } = await supabase
            .from('daily_reports')
            .update(reportData)
            .eq('id', editingReportId);
          
          if (error) {
            console.error("DB Update Report Error:", error);
            alert("Gagal memperbarui laporan di database.");
          } else {
            setSavedReports(prev => prev.map(r => r.id === editingReportId ? { ...r, ...reportData } : r));
            alert("Laporan berhasil diperbarui!");
            handleCancelReportEdit();
          }
        } else {
          const newReport = { id: Date.now().toString(), ...reportData };
          const { data, error } = await supabase
            .from('daily_reports')
            .insert([newReport])
            .select()
            .single();
          
          if (error) {
            console.error("DB Save Report Error:", error);
            alert("Gagal menyimpan laporan ke database.");
          } else {
            setSavedReports(prev => [data, ...prev]);
            alert("Laporan berhasil disimpan!");
            handleCancelReportEdit();
          }
        }
      } catch (err) {
        console.error("Unexpected error saving report:", err);
      }
    } else {
      if (editingReportId) {
        setSavedReports(prev => prev.map(r => r.id === editingReportId ? { ...r, ...reportData } : r));
        alert("Laporan berhasil diperbarui (Lokal)!");
      } else {
        const newReport = {
          id: Date.now().toString(),
          ...reportData
        };
        setSavedReports(prev => [newReport, ...prev]);
        alert("Laporan berhasil disimpan (Lokal)!");
      }
      handleCancelReportEdit();
    }

    setIsSubmitting(false);
  };

  const handleDeleteReport = (id: string) => {
    promptPassword('delete_report', id);
  };

  const executeDeleteReport = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('daily_reports').delete().eq('id', id);
      } catch (err) {
        console.error("Delete report error:", err);
      }
    }

    setSavedReports(prev => prev.filter(r => r.id !== id));
    if (editingReportId === id) handleCancelReportEdit();
  };

  const handleCancelReportEdit = () => {
    setEditingReportId(null);
    setGrossIncome('');
    setReportDate(new Date().toISOString().split('T')[0]);
    setSelectedEmployees([]);
  };

  const handleTutupBukuKaryawanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { startDate, endDate, batchName } = tutupBukuKaryawanModal;
    if (!startDate || !endDate || !batchName) {
      alert("Mohon lengkapi semua bidang.");
      return;
    }

    const periodReports = savedReports.filter(r => r.date >= startDate && r.date <= endDate);
    if (periodReports.length === 0) {
      alert("Tidak ada laporan karyawan dalam rentang tanggal tersebut.");
      return;
    }

    setIsSubmitting(true);

    const statsMap: { [key: string]: any } = {};
    employees.forEach(name => {
      statsMap[name] = { name, daysWorked: 0, totalGross: 0, splitGross: 0, avgGross: 0 };
    });

    periodReports.forEach(report => {
      const reportEmps = getReportEmployees(report);
      if (reportEmps.length === 0) return;
      const grossVal = report.gross || 0;
      const splitVal = grossVal / reportEmps.length;

      reportEmps.forEach(name => {
        if (!statsMap[name]) {
          statsMap[name] = { name, daysWorked: 0, totalGross: 0, splitGross: 0, avgGross: 0 };
        }
        statsMap[name].daysWorked += 1;
        statsMap[name].totalGross += grossVal;
        statsMap[name].splitGross += splitVal;
      });
    });

    Object.keys(statsMap).forEach(name => {
      const s = statsMap[name];
      if (s.daysWorked > 0) {
        s.avgGross = s.totalGross / s.daysWorked;
      }
    });

    const activeStats = Object.values(statsMap).filter((s: any) => s.daysWorked > 0);

    const newBatch: EmployeeBatch = {
      id: Date.now().toString(),
      batchName,
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
      stats: activeStats
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('daily_reports')
          .delete()
          .gte('date', startDate)
          .lte('date', endDate);

        if (error) throw error;
      } catch (err) {
        console.error("Gagal menghapus laporan di Supabase saat tutup buku:", err);
        alert("Gagal melakukan tutup buku karyawan di database. Proses dibatalkan.");
        setIsSubmitting(false);
        return;
      }
    }

    setEmployeeBatches(prev => [newBatch, ...prev]);
    setSavedReports(prev => prev.filter(r => r.date < startDate || r.date > endDate));

    setIsSubmitting(false);
    setTutupBukuKaryawanModal({ isOpen: false, startDate: '', endDate: '', batchName: '' });
    alert("Tutup buku performa karyawan berhasil diselesaikan dan diarsipkan!");
  };

  const handleOpenTutupBukuKaryawan = () => {
    const empReports = savedReports.filter(isEmployeeReport);
    if (empReports.length === 0) {
      alert("Tidak ada laporan harian karyawan untuk ditutup buku.");
      return;
    }
    const sorted = [...empReports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startDate = sorted[0].date;
    const endDate = sorted[sorted.length - 1].date;
    const batchName = `Batch Karyawan ${employeeBatches.length + 1}`;
    setTutupBukuKaryawanModal({
      isOpen: true,
      startDate,
      endDate,
      batchName
    });
  };

  const openTutupBukuModal = () => {
    if (currentTransactions.length === 0) {
      alert("Tidak ada transaksi untuk ditutup buku.");
      return;
    }

    const sorted = [...currentTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startDate = sorted[0].date.split('T')[0];
    const endDate = sorted[sorted.length - 1].date.split('T')[0];
    const batchName = `Batch ${batches.length + 1}`;

    setTutupBukuModal({
      isOpen: true,
      startDate,
      endDate,
      batchName
    });
  };

  const handleTutupBuku = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const batchData = {
      batch_name: tutupBukuModal.batchName,
      start_date: tutupBukuModal.startDate,
      end_date: tutupBukuModal.endDate,
      total_income: currentTotalIncome,
      total_expense: currentTotalExpense,
      total_balance: currentBalance,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: newBatch, error: batchError } = await supabase
          .from('batches')
          .insert([batchData])
          .select()
          .single();

        if (batchError) throw batchError;

        const { error: transError } = await supabase
          .from('transactions')
          .update({ batch_id: newBatch.id })
          .is('batch_id', null);

        if (transError) throw transError;

        setBatches(prev => [newBatch, ...prev]);
        setTransactions(prev => prev.map(t => (!t.batch_id ? { ...t, batch_id: newBatch.id } : t)));
        
      } catch (err) {
        console.error("Gagal tutup buku:", err);
        alert("Gagal melakukan tutup buku di database.");
      }
    } else {
      const localBatch = { id: Date.now().toString(), ...batchData };
      setBatches(prev => [localBatch, ...prev]);
      setTransactions(prev => prev.map(t => (!t.batch_id ? { ...t, batch_id: localBatch.id } : t)));
    }

    setIsSubmitting(false);
    setTutupBukuModal({ ...tutupBukuModal, isOpen: false });
    alert("Tutup buku berhasil!");
  };

  const handleTutupBukuProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProfitTransactions.length === 0) {
      alert("Tidak ada profit untuk ditutup buku.");
      return;
    }
    setIsSubmitting(true);
    
    const batchData = {
      batch_name: tutupBukuModal.batchName,
      start_date: tutupBukuModal.startDate,
      end_date: tutupBukuModal.endDate,
      total_income: currentPeriodProfit,
      total_expense: 0,
      total_balance: currentPeriodProfit,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: newBatch, error: batchError } = await supabase
          .from('profit_batches')
          .insert([batchData])
          .select()
          .single();

        if (batchError) throw batchError;

        const { error: transError } = await supabase
          .from('profit_transactions')
          .update({ batch_id: newBatch.id })
          .is('batch_id', null);

        if (transError) throw transError;

        setProfitBatches(prev => [newBatch, ...prev]);
        setProfitTransactions(prev => prev.map(t => (!t.batch_id ? { ...t, batch_id: newBatch.id } : t)));
        
      } catch (err) {
        console.error("Gagal tutup buku profit:", err);
        alert("Gagal melakukan tutup buku profit di database.");
      }
    } else {
      const localBatch = { id: Date.now().toString(), ...batchData };
      setProfitBatches(prev => [localBatch, ...prev]);
      setProfitTransactions(prev => prev.map(t => (!t.batch_id ? { ...t, batch_id: localBatch.id } : t)));
    }

    setIsSubmitting(false);
    setTutupBukuModal({ ...tutupBukuModal, isOpen: false });
    alert("Tutup buku profit berhasil!");
  };

  const loadReportToForm = (report: any) => {
    promptPassword('edit_report', report);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Dimsum Rasa Terakhir System</h1>
        <p>Dashboard Arus Kas, Profit & Laporan</p>
        {!isSupabaseConfigured && (
          <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--expense)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
            <strong>Catatan:</strong> Koneksi Supabase belum dikonfigurasi. Mode saat ini menyimpan semua data menggunakan Local Storage di perangkat Anda.
          </div>
        )}
      </header>

      <nav className="nav-tabs">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard Kas
        </button>
        <button 
          className={`nav-btn ${activeTab === 'profit' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('profit');
            setType('pemasukan');
          }}
        >
          💰 Profit
        </button>
        <button 
          className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          👥 Laporan Karyawan
        </button>
      </nav>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Memuat data...
        </div>
      ) : activeTab === 'dashboard' ? (
        <DashboardPage
          balance={balance}
          currentTotalIncome={currentTotalIncome}
          currentTotalExpense={currentTotalExpense}
          openTutupBukuModal={openTutupBukuModal}
          isSubmitting={isSubmitting}
          editingId={editingId}
          type={type}
          setType={setType}
          amount={amount}
          setAmount={setAmount}
          date={date}
          setDate={setDate}
          description={description}
          setDescription={setDescription}
          imagePreview={imagePreview}
          handleImageChange={handleImageChange}
          handleSubmit={handleSubmit}
          handleCancelEdit={handleCancelEdit}
          currentTransactions={currentTransactions}
          transactions={transactions}
          promptPassword={promptPassword}
          setSelectedImage={setSelectedImage}
          batches={batches}
          expandedBatchId={expandedBatchId}
          setExpandedBatchId={setExpandedBatchId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      ) : activeTab === 'profit' ? (
        <ProfitPage
          allTimeProfit={allTimeProfit}
          currentPeriodProfit={currentPeriodProfit}
          openTutupBukuProfitModal={() => {
            if (currentProfitTransactions.length === 0) {
              alert("Tidak ada profit untuk ditutup buku.");
              return;
            }
            const sorted = [...currentProfitTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const startDate = sorted[0].date.split('T')[0];
            const endDate = sorted[sorted.length - 1].date.split('T')[0];
            const batchName = `Profit Batch ${profitBatches.length + 1}`;
            setTutupBukuModal({ isOpen: true, startDate, endDate, batchName });
          }}
          isSubmitting={isSubmitting}
          editingId={editingId}
          amount={amount}
          setAmount={setAmount}
          date={date}
          setDate={setDate}
          description={description}
          setDescription={setDescription}
          imagePreview={imagePreview}
          handleImageChange={handleImageChange}
          handleSubmit={handleSubmit}
          handleCancelEdit={handleCancelEdit}
          currentProfitTransactions={currentProfitTransactions}
          profitTransactions={profitTransactions}
          promptPassword={promptPassword}
          profitBatches={profitBatches}
          expandedProfitBatchId={expandedProfitBatchId}
          setExpandedProfitBatchId={setExpandedProfitBatchId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      ) : (
        <EmployeePage
          savedReports={savedReports}
          employees={employees}
          selectedEmployees={selectedEmployees}
          newEmployeeName={newEmployeeName}
          setNewEmployeeName={setNewEmployeeName}
          editingReportId={editingReportId}
          reportDate={reportDate}
          setReportDate={setReportDate}
          grossIncome={grossIncome}
          setGrossIncome={setGrossIncome}
          isSubmitting={isSubmitting}
          editingEmployeeName={editingEmployeeName}
          setEditingEmployeeName={setEditingEmployeeName}
          editEmployeeInput={editEmployeeInput}
          setEditEmployeeInput={setEditEmployeeInput}
          expandedEmployeeCard={expandedEmployeeCard}
          setExpandedEmployeeCard={setExpandedEmployeeCard}
          expandedReportId={expandedReportId}
          setExpandedReportId={setExpandedReportId}
          expandedEmpBatchId={expandedEmpBatchId}
          setExpandedEmpBatchId={setExpandedEmpBatchId}
          employeeBatches={employeeBatches}
          setEmployeeBatches={setEmployeeBatches}
          getReportEmployees={getReportEmployees}
          isEmployeeReport={isEmployeeReport}
          getEmployeeStats={getEmployeeStats}
          handleAddEmployee={handleAddEmployee}
          handleDeleteEmployee={handleDeleteEmployee}
          handleToggleSelectEmployee={handleToggleSelectEmployee}
          handleUpdateEmployee={handleUpdateEmployee}
          handleSaveReport={handleSaveReport}
          handleCancelReportEdit={handleCancelReportEdit}
          handleDeleteReport={handleDeleteReport}
          loadReportToForm={loadReportToForm}
          handleOpenTutupBukuKaryawan={handleOpenTutupBukuKaryawan}
          formatCurrency={formatCurrency}
        />
      )}

      {tutupBukuKaryawanModal.isOpen && (
        <TutupBukuKaryawanModal
          startDate={tutupBukuKaryawanModal.startDate}
          endDate={tutupBukuKaryawanModal.endDate}
          batchName={tutupBukuKaryawanModal.batchName}
          onChangeStartDate={(val) => setTutupBukuKaryawanModal({ ...tutupBukuKaryawanModal, startDate: val })}
          onChangeEndDate={(val) => setTutupBukuKaryawanModal({ ...tutupBukuKaryawanModal, endDate: val })}
          onChangeBatchName={(val) => setTutupBukuKaryawanModal({ ...tutupBukuKaryawanModal, batchName: val })}
          isSubmitting={isSubmitting}
          onSubmit={handleTutupBukuKaryawanSubmit}
          onClose={() => setTutupBukuKaryawanModal({ ...tutupBukuKaryawanModal, isOpen: false })}
        />
      )}

      {tutupBukuModal.isOpen && (
        <TutupBukuModal
          activeTab={activeTab}
          startDate={tutupBukuModal.startDate}
          endDate={tutupBukuModal.endDate}
          batchName={tutupBukuModal.batchName}
          onChangeStartDate={(val) => setTutupBukuModal({ ...tutupBukuModal, startDate: val })}
          onChangeEndDate={(val) => setTutupBukuModal({ ...tutupBukuModal, endDate: val })}
          onChangeBatchName={(val) => setTutupBukuModal({ ...tutupBukuModal, batchName: val })}
          currentTotalIncome={currentTotalIncome}
          currentTotalExpense={currentTotalExpense}
          currentBalance={currentBalance}
          currentPeriodProfit={currentPeriodProfit}
          formatCurrency={formatCurrency}
          isSubmitting={isSubmitting}
          onSubmit={activeTab === 'profit' ? handleTutupBukuProfit : handleTutupBuku}
          onClose={() => setTutupBukuModal({ ...tutupBukuModal, isOpen: false })}
        />
      )}

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {passwordModal.isOpen && (
        <PasswordModal
          actionName={passwordModal.action}
          passwordInput={passwordInput}
          setPasswordInput={setPasswordInput}
          onSubmit={handlePasswordSubmit}
          onClose={() => setPasswordModal({ isOpen: false, action: null, data: null })}
        />
      )}
    </div>
  );
}

export default App;
