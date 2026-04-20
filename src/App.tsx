import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase, isSupabaseConfigured } from './supabase';

type TransactionType = 'pemasukan' | 'pengeluaran';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  image: string | null;
  batch_id?: string | null;
}

interface Batch {
  id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  total_income: number;
  total_expense: number;
  total_balance: number;
  created_at: string;
}

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
  const [expenseItems, setExpenseItems] = useState<{ name: string; amount: string }[]>([
    { name: 'Masuk Kas', amount: '' },
    { name: 'Karyawan', amount: '' },
    { name: 'Kontrakan', amount: '' },
    { name: 'Gas', amount: '' },
  ]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [tutupBukuModal, setTutupBukuModal] = useState<{isOpen: boolean, startDate: string, endDate: string, batchName: string}>({
    isOpen: false,
    startDate: '',
    endDate: '',
    batchName: ''
  });

  // Initialize Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // 1. Load from LocalStorage first (for quick initial display)
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

      // 2. Sync with Supabase (Source of Truth)
      if (isSupabaseConfigured && supabase) {
        try {
          // Fetch transactions
          const { data: transData, error: transError } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });
          
          if (!transError && transData) {
            setTransactions(transData);
            localStorage.setItem('dimsum_transactions', JSON.stringify(transData));
          }

          // Fetch reports
          const { data: reportData, error: reportError } = await supabase
            .from('daily_reports')
            .select('*')
            .order('date', { ascending: false });
          
          if (!reportError && reportData) {
            setSavedReports(reportData);
            localStorage.setItem('dimsum_reports', JSON.stringify(reportData));
          }

          // Fetch batches
          const { data: batchData, error: batchError } = await supabase
            .from('batches')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!batchError && batchData) {
            setBatches(batchData);
            localStorage.setItem('dimsum_batches', JSON.stringify(batchData));
          }

          // Fetch profit transactions
          const { data: profitTransData, error: profitTransError } = await supabase
            .from('profit_transactions')
            .select('*')
            .order('date', { ascending: false });
          
          if (!profitTransError && profitTransData) {
            setProfitTransactions(profitTransData);
            localStorage.setItem('dimsum_profit_transactions', JSON.stringify(profitTransData));
          }

          // Fetch profit batches
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
        setExpenseItems(report.expenses);
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
    let finalBase64Preview = imagePreview; // Digunakan sebagai fallback

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Upload ke Storage jika ada File
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
            return; // hentikan save DB jika upload foto error
          }

          const { data: publicUrlData } = supabase.storage
            .from('transactions_media')
            .getPublicUrl(filePath);
            
          imageUrl = publicUrlData.publicUrl;
        }

        // 2. Insert atau Update ke Database
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
          
          // Simpan state dengan ID dari supabase
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
      // Localstorage fallback mode
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
    
    // Reset Form
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

  // Current Dashboard Totals (Only Non-Batched)
  const currentTransactions = transactions.filter(t => !t.batch_id);
  const currentTotalIncome = currentTransactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentTotalExpense = currentTransactions
    .filter(t => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = currentTotalIncome - currentTotalExpense;

  // Profit Tab Calculations
  const allTimeProfit = profitTransactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentProfitTransactions = profitTransactions.filter(t => !t.batch_id);
  const currentPeriodProfit = currentProfitTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Report logic
  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { name: '', amount: '' }]);
  };

  const removeExpenseItem = (index: number) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  const updateExpenseItem = (index: number, field: 'name' | 'amount', value: string) => {
    const newItems = [...expenseItems];
    if (field === 'amount') {
      const rawValue = value.replace(/[^0-9]/g, '');
      const formattedValue = rawValue ? new Intl.NumberFormat('id-ID').format(Number(rawValue)) : '';
      newItems[index][field] = formattedValue;
    } else {
      newItems[index][field] = value;
    }
    setExpenseItems(newItems);
  };

  const numericGross = Number(grossIncome.replace(/\./g, '')) || 0;
  const totalReportExpenses = expenseItems.reduce((sum, item) => {
    const amt = Number(item.amount.replace(/\./g, '')) || 0;
    return sum + amt;
  }, 0);
  const remainingCash = numericGross - totalReportExpenses;

  const copyReportToClipboard = () => {
    const d = new Date(reportDate);
    const dateFormatted = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    
    let text = `Laporan Harian - tgl ${dateFormatted}\n\n`;
    text += `Total: ${formatCurrency(numericGross)}\n`;
    expenseItems.forEach(item => {
      if (item.name && item.amount) {
        text += `${item.name.toLowerCase()} = ${item.amount}\n`;
      }
    });
    text += `\nsisa uang nya masuk kembalian: ${formatCurrency(remainingCash)}`;
    
    navigator.clipboard.writeText(text);
    alert('Laporan berhasil disalin ke clipboard!');
  };

  const handleSaveReport = async () => {
    if (!grossIncome || expenseItems.some(i => i.name && !i.amount)) {
      alert("Mohon lengkapi data penghasilan dan jumlah pengeluaran.");
      return;
    }

    const reportData = {
      date: reportDate,
      gross: numericGross,
      expenses: expenseItems.filter(i => i.name && i.amount),
      sisa: remainingCash
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
          } else {
            setSavedReports(prev => prev.map(r => r.id === editingReportId ? { ...r, ...reportData } : r));
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
          } else {
            setSavedReports(prev => [data, ...prev]);
          }
        }
      } catch (err) {
        console.error("Unexpected error saving report:", err);
      }
    } else {
      // Localstorage fallback mode
      if (editingReportId) {
        setSavedReports(prev => prev.map(r => r.id === editingReportId ? { ...r, ...reportData } : r));
      } else {
        const newReport = {
          id: Date.now().toString(),
          ...reportData
        };
        setSavedReports(prev => [newReport, ...prev]);
      }
    }

    setIsSubmitting(false);
    alert(editingReportId ? "Laporan berhasil diperbarui!" : "Laporan berhasil disimpan!");
    
    // Clear form after save
    handleCancelReportEdit();
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
    setExpenseItems([
      { name: 'Masuk kas', amount: '' },
      { name: 'Karyawan', amount: '' },
      { name: 'Kontrakan', amount: '' },
      { name: 'Gas', amount: '' },
    ]);
  };

  const openTutupBukuModal = () => {
    if (currentTransactions.length === 0) {
      alert("Tidak ada transaksi untuk ditutup buku.");
      return;
    }

    // Sort transactions to get default date range
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
        // 1. Create Batch
        const { data: newBatch, error: batchError } = await supabase
          .from('batches')
          .insert([batchData])
          .select()
          .single();

        if (batchError) throw batchError;

        // 2. Update Transactions
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
      // LocalStorage Mode
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
        <h1>Dimsum Anjas</h1>
        <p>Dashboard Arus Kas & Profit</p>
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
            setType('pemasukan'); // Always income in profit tab
          }}
        >
          💰 Profit
        </button>
        <button 
          className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          📝 Laporan Harian
        </button>
      </nav>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Memuat data...
        </div>
      ) : activeTab === 'dashboard' ? (
        <>
          <section className="dashboard-cards">
            <div className="card balance">
              <div className="card-title">Total Saldo Global (Kas)</div>
              <div className="card-amount">{formatCurrency(balance)}</div>
            </div>
            <div className="card income">
              <div className="card-title">Pemasukan Periode Ini</div>
              <div className="card-amount income">{formatCurrency(currentTotalIncome)}</div>
            </div>
            <div className="card expense">
              <div className="card-title">Pengeluaran Periode Ini</div>
              <div className="card-amount expense">{formatCurrency(currentTotalExpense)}</div>
            </div>
          </section>

          <div className="tutup-buku-container">
            <button className="tutup-buku-btn" onClick={openTutupBukuModal} disabled={isSubmitting}>
              <span>📤</span> {isSubmitting ? 'Memproses...' : 'Tutup Buku Sekarang'}
            </button>
          </div>

          <div className="main-content">
            <div className="glass-panel">
              <h2 className="panel-title">
                <span>✍️</span> {editingId ? 'Edit Transaksi' : 'Catat Transaksi'}
              </h2>
              <form className="transaction-form" onSubmit={handleSubmit}>
                <div className="type-selector">
                  <button
                    type="button"
                    className={`type-btn income ${type === 'pemasukan' ? 'active' : ''}`}
                    onClick={() => setType('pemasukan')}
                  >
                    ↓ Pemasukan
                  </button>
                  <button
                    type="button"
                    className={`type-btn expense ${type === 'pengeluaran' ? 'active' : ''}`}
                    onClick={() => setType('pengeluaran')}
                  >
                    ↑ Pengeluaran
                  </button>
                </div>

                <div className="form-group">
                  <label>Jumlah (Rp)*</label>
                  <input
                    type="text"
                    className="form-control"
                    value={amount}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      if (!rawValue) {
                        setAmount('');
                        return;
                      }
                      const formattedValue = new Intl.NumberFormat('id-ID').format(Number(rawValue));
                      setAmount(formattedValue);
                    }}
                    placeholder="Contoh: 50.000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tanggal & Waktu*</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Deskripsi (Opsional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Penjualan 10 porsi dimsum"
                  />
                </div>

                <div className="form-group">
                  <label>Foto/Bukti (Opsional)</label>
                  <input
                    type="file"
                    id="image-input"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ padding: '0.7rem' }}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ flex: 1, marginTop: 0 }}>
                    {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Transaksi' : 'Simpan Transaksi')}
                  </button>
                  {editingId && (
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit} style={{ flex: 1, marginTop: 0 }}>
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="glass-panel">
              <h2 className="panel-title">
                <span>📋</span> Riwayat Transaksi (Periode Aktif)
              </h2>
              {currentTransactions.length > 0 ? (
                <div className="history-list">
                  {currentTransactions.map(t => (
                    <div key={t.id} className={`history-item ${t.type === 'pemasukan' ? 'income' : 'expense'}`}>
                      <div className="history-info">
                        <div className="history-icon">
                          {t.type === 'pemasukan' ? '↓' : '↑'}
                        </div>
                        <div className="history-details">
                          <h4>{t.description}</h4>
                          <p>{formatDate(t.date)}</p>
                        </div>
                      </div>
                      <div className="history-amount-container">
                        <div className={`history-amount ${t.type === 'pemasukan' ? 'income' : 'expense'}`}>
                          {t.type === 'pemasukan' ? '+' : '-'}{formatCurrency(t.amount)}
                        </div>
                        {t.image && (
                          <img 
                            src={t.image} 
                            alt="Bukti" 
                            className="history-img-preview" 
                            onClick={() => setSelectedImage(t.image)} 
                          />
                        )}
                        <div className="history-actions">
                          <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); promptPassword('edit', t); }}>Edit</button>
                          <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); promptPassword('delete', t.id); }}>Hapus</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  Belum ada transaksi di periode ini. Silakan catat transaksi baru atau cek riwayat batch di bawah.
                </div>
              )}
            </div>
          </div>

          <div className="batch-history-section">
            <div className="glass-panel">
              <h2 className="panel-title"><span>📚</span> Riwayat Tutup Buku (Batch Kas)</h2>
              {batches.length > 0 ? (
                <div className="batch-list">
                  {batches.map(batch => (
                    <div key={batch.id} className={`batch-card ${expandedBatchId === batch.id ? 'expanded' : ''}`}>
                      <div className="batch-header" onClick={() => setExpandedBatchId(expandedBatchId === batch.id ? null : batch.id)}>
                        <div className="batch-title-group">
                          <h3>{batch.batch_name}</h3>
                          <p className="batch-date-range">
                            {new Date(batch.start_date).toLocaleDateString()} - {new Date(batch.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="batch-summary">
                          <div className="summary-item">
                            <span className="summary-label">Saldo</span>
                            <span className="summary-value">{formatCurrency(batch.total_balance)}</span>
                          </div>
                          <div className={`expand-icon ${expandedBatchId === batch.id ? 'active' : ''}`}>▼</div>
                        </div>
                      </div>
                      
                      {expandedBatchId === batch.id && (
                        <div className="batch-details">
                          <div className="batch-mini-stats">
                            <div className="mini-stat income">
                              <span>Pemasukan:</span>
                              <strong>{formatCurrency(batch.total_income)}</strong>
                            </div>
                            <div className="mini-stat expense">
                              <span>Pengeluaran:</span>
                              <strong>{formatCurrency(batch.total_expense)}</strong>
                            </div>
                          </div>
                          <div className="batch-transactions-list">
                            {transactions
                              .filter(t => t.batch_id === batch.id)
                              .map(t => (
                                <div key={t.id} className="batch-trans-item">
                                  <span className="trans-desc">{t.description}</span>
                                  <span className={`trans-amt ${t.type === 'pemasukan' ? 'income' : 'expense'}`}>
                                    {t.type === 'pemasukan' ? '+' : '-'}{new Intl.NumberFormat('id-ID').format(t.amount)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Belum ada riwayat tutup buku kas.</div>
              )}
            </div>
          </div>
        </>
      ) : activeTab === 'profit' ? (
        <>
          <section className="dashboard-cards">
            <div className="card balance">
              <div className="card-title">Total Keuntungan All-Time</div>
              <div className="card-amount">{formatCurrency(allTimeProfit)}</div>
            </div>
            <div className="card income">
              <div className="card-title">Profit Bulan Ini</div>
              <div className="card-amount income">{formatCurrency(currentPeriodProfit)}</div>
            </div>
          </section>

          <div className="tutup-buku-container">
            <button className="tutup-buku-btn" onClick={() => {
              if (currentProfitTransactions.length === 0) {
                alert("Tidak ada profit untuk ditutup buku.");
                return;
              }
              const sorted = [...currentProfitTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              const startDate = sorted[0].date.split('T')[0];
              const endDate = sorted[sorted.length - 1].date.split('T')[0];
              const batchName = `Profit Batch ${profitBatches.length + 1}`;
              setTutupBukuModal({ isOpen: true, startDate, endDate, batchName });
            }} disabled={isSubmitting}>
              <span>📤</span> {isSubmitting ? 'Memproses...' : 'Tutup Buku Profit Bulan Ini'}
            </button>
          </div>

          <div className="main-content">
            <div className="glass-panel">
              <h2 className="panel-title">
                <span>💰</span> {editingId ? 'Edit Catatan Profit' : 'Catat Keuntungan'}
              </h2>
              <form className="transaction-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Jumlah Keuntungan (Rp)*</label>
                  <input
                    type="text"
                    className="form-control"
                    value={amount}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      if (!rawValue) {
                        setAmount('');
                        return;
                      }
                      const formattedValue = new Intl.NumberFormat('id-ID').format(Number(rawValue));
                      setAmount(formattedValue);
                    }}
                    placeholder="Contoh: 1.000.000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tanggal & Waktu*</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Keterangan Profit (Opsional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Profit Bersih Maret 2024"
                  />
                </div>

                <div className="form-group">
                  <label>Foto/Bukti (Opsional)</label>
                  <input
                    type="file"
                    id="image-input"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ flex: 1, marginTop: 0 }}>
                    {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Profit' : 'Simpan Profit')}
                  </button>
                  {editingId && (
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit} style={{ flex: 1, marginTop: 0 }}>
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="glass-panel">
              <h2 className="panel-title">
                <span>📋</span> Riwayat Profit (Periode Aktif)
              </h2>
              {currentProfitTransactions.length > 0 ? (
                <div className="history-list">
                  {currentProfitTransactions.map(t => (
                    <div key={t.id} className="history-item income">
                      <div className="history-info">
                        <div className="history-icon">💰</div>
                        <div className="history-details">
                          <h4>{t.description}</h4>
                          <p>{formatDate(t.date)}</p>
                        </div>
                      </div>
                      <div className="history-amount-container">
                        <div className="history-amount income">
                          +{formatCurrency(t.amount)}
                        </div>
                        <div className="history-actions">
                          <button className="action-btn edit" onClick={() => promptPassword('edit', t)}>Edit</button>
                          <button className="action-btn delete" onClick={() => promptPassword('delete', t.id)}>Hapus</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Belum ada catatan profit di periode ini.</div>
              )}
            </div>
          </div>

          <div className="batch-history-section">
            <div className="glass-panel">
              <h2 className="panel-title"><span>📚</span> Riwayat Tutup Buku Profit</h2>
              {profitBatches.length > 0 ? (
                <div className="batch-list">
                  {profitBatches.map(batch => (
                    <div key={batch.id} className={`batch-card ${expandedProfitBatchId === batch.id ? 'expanded' : ''}`}>
                      <div className="batch-header" onClick={() => setExpandedProfitBatchId(expandedProfitBatchId === batch.id ? null : batch.id)}>
                        <div className="batch-title-group">
                          <h3>{batch.batch_name}</h3>
                          <p className="batch-date-range">
                            {new Date(batch.start_date).toLocaleDateString()} - {new Date(batch.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="batch-summary">
                          <div className="summary-item">
                            <span className="summary-label">Total Profit</span>
                            <span className="summary-value">{formatCurrency(batch.total_balance)}</span>
                          </div>
                          <div className={`expand-icon ${expandedProfitBatchId === batch.id ? 'active' : ''}`}>▼</div>
                        </div>
                      </div>
                      {expandedProfitBatchId === batch.id && (
                        <div className="batch-details">
                          <div className="batch-transactions-list">
                            {profitTransactions
                              .filter(t => t.batch_id === batch.id)
                              .map(t => (
                                <div key={t.id} className="batch-trans-item">
                                  <span className="trans-desc">{t.description}</span>
                                  <span className="trans-amt income">+{new Intl.NumberFormat('id-ID').format(t.amount)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Belum ada riwayat tutup buku profit.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="report-container">
          <div className="report-grid">
            <div className="glass-panel">
              <h2 className="panel-title"><span>💰</span> Input Penghasilan & Pengeluaran</h2>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Tanggal Laporan</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={reportDate} 
                  onChange={(e) => setReportDate(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Total Penghasilan Kotor (Gross)*</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--income)' }}
                  value={grossIncome}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    const formattedValue = rawValue ? new Intl.NumberFormat('id-ID').format(Number(rawValue)) : '';
                    setGrossIncome(formattedValue);
                  }}
                  placeholder="Contoh: 1.840.000"
                />
              </div>

              <div style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Daftar Pengeluaran Harian</label>
              </div>

              {expenseItems.map((item, index) => (
                <div key={index} className="expense-item-row">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nama pengeluaran" 
                    value={item.name} 
                    onChange={(e) => updateExpenseItem(index, 'name', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Jumlah" 
                    value={item.amount} 
                    onChange={(e) => updateExpenseItem(index, 'amount', e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeExpenseItem(index)} title="Hapus">
                    &times;
                  </button>
                </div>
              ))}

              <button className="add-item-btn" onClick={addExpenseItem}>
                + Tambah Item Pengeluaran
              </button>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className="panel-title"><span>📄</span> Preview Laporan</h2>
              
              <div className="report-preview" id="printable-report">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>DIMSUM ANJAS</h3>
                  <p style={{ fontSize: '0.8rem', margin: '5px 0' }}>Laporan Penghasilan Harian</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    tgl {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(reportDate))}
                  </p>
                </div>

                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Keterangan</th>
                      <th className="text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Total Penghasilan</td>
                      <td className="text-right highlight">{formatCurrency(numericGross)}</td>
                    </tr>
                    {expenseItems.map((item, index) => item.name && (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-right" style={{ color: 'var(--expense)' }}>-{formatCurrency(Number(item.amount.replace(/\./g, '')) || 0)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>Sisa Uang (Kembalian)</td>
                      <td className="text-right highlight" style={{ fontSize: '1.2rem' }}>{formatCurrency(remainingCash)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button className="copy-report-btn" onClick={copyReportToClipboard}>
                <span>📋</span> Salin Teks Laporan
              </button>

              <button className="save-report-btn" onClick={handleSaveReport} disabled={isSubmitting}>
                <span>💾</span> {isSubmitting ? 'Menyimpan...' : (editingReportId ? 'Perbarui Laporan' : 'Simpan Laporan')}
              </button>

              {editingReportId && (
                <button className="cancel-btn" onClick={handleCancelReportEdit} style={{ width: '100%', marginTop: '0.8rem' }}>
                  Batal Edit
                </button>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Gunakan sisa uang ini untuk modal kembalian esok hari.
              </div>
            </div>

            {savedReports.length > 0 && (
              <div className="glass-panel saved-reports-list">
                <h2 className="panel-title"><span>📚</span> Riwayat Laporan Tersimpan</h2>
                <div className="reports-table-container">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Penghasilan Kotor</th>
                        <th>Banyak Item</th>
                        <th>Sisa (Kembalian)</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedReports.map(report => (
                        <React.Fragment key={report.id}>
                          <tr>
                            <td data-label="Tanggal">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(report.date))}</td>
                            <td data-label="Penghasilan Kotor" style={{ color: 'var(--income)', fontWeight: 'bold' }}>{formatCurrency(report.gross)}</td>
                            <td data-label="Banyak Item">{report.expenses?.length || 0} item</td>
                            <td data-label="Sisa (Kembalian)" style={{ color: 'var(--primary-orange)', fontWeight: 'bold' }}>{formatCurrency(report.sisa)}</td>
                            <td>
                              <div className="report-actions">
                                <button className={`report-action-btn view ${editingReportId === report.id ? 'active' : ''}`} onClick={() => loadReportToForm(report)}>
                                  {editingReportId === report.id ? 'Sedang Edit' : 'Edit'}
                                </button>
                                <button className="report-action-btn delete" onClick={() => handleDeleteReport(report.id)}>Hapus</button>
                                <button 
                                  className={`report-action-btn collapse-btn ${expandedReportId === report.id ? 'active' : ''}`}
                                  onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                                  title={expandedReportId === report.id ? 'Tutup Detail' : 'Lihat Detail'}
                                >
                                  {expandedReportId === report.id ? '▲ Tutup' : '▼ Detail'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedReportId === report.id && (
                            <tr className="expanded-row">
                              <td colSpan={5}>
                                <div className="expanded-content">
                                  <h4>Rincian Pengeluaran:</h4>
                                  <ul className="expense-details-list">
                                    {report.expenses.map((exp: any, idx: number) => (
                                      <li key={idx}>
                                        <span className="exp-name">{exp.name}</span>
                                        <span className="exp-amount">{exp.amount}</span>
                                      </li>
                                    ))}
                                    <li className="total-summary">
                                      <span>Sisa Kembalian:</span>
                                      <span style={{ color: 'var(--primary-orange)', fontWeight: 'bold' }}>{formatCurrency(report.sisa)}</span>
                                    </li>
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tutupBukuModal.isOpen && (
        <div className="password-modal-overlay">
          <div className="password-modal-content" style={{ maxWidth: '450px' }}>
            <h3>Konfirmasi Tutup Buku {activeTab === 'profit' ? 'Profit' : 'Kas'}</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Silakan tinjau rentang tanggal dan nama batch sebelum menutup buku periode ini.
            </p>
            
            <form onSubmit={activeTab === 'profit' ? handleTutupBukuProfit : handleTutupBuku}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nama Batch</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={tutupBukuModal.batchName}
                  onChange={(e) => setTutupBukuModal({...tutupBukuModal, batchName: e.target.value})}
                  required
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Tanggal Mulai</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={tutupBukuModal.startDate}
                    onChange={(e) => setTutupBukuModal({...tutupBukuModal, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tanggal Akhir</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={tutupBukuModal.endDate}
                    onChange={(e) => setTutupBukuModal({...tutupBukuModal, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="balance-info" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                {activeTab === 'profit' ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Total Profit:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--income)' }}>{formatCurrency(currentPeriodProfit)}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Pemasukan:</span>
                      <span style={{ color: 'var(--income)', fontWeight: 'bold' }}>{formatCurrency(currentTotalIncome)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Pengeluaran:</span>
                      <span style={{ color: 'var(--expense)', fontWeight: 'bold' }}>{formatCurrency(currentTotalExpense)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>Total Saldo Batch:</span>
                      <span style={{ fontWeight: 'bold' }}>{formatCurrency(currentBalance)}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ flex: 1, marginTop: 0 }}>
                  {isSubmitting ? 'Memproses...' : 'Ya, Tutup Buku'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setTutupBukuModal({ ...tutupBukuModal, isOpen: false })} 
                  style={{ flex: 1, marginTop: 0 }}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="image-modal-close" onClick={() => setSelectedImage(null)}>&times;</span>
            <img src={selectedImage} alt="Bukti Full" />
          </div>
        </div>
      )}

      {passwordModal.isOpen && (
        <div className="password-modal-overlay" onClick={() => setPasswordModal({ isOpen: false, action: null, data: null })}>
          <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Masukkan Password</h3>
            <p>Otorisasi diperlukan untuk aksi <strong>{passwordModal.action === 'edit' ? 'Edit' : 'Hapus'}</strong>.</p>
            <form onSubmit={handlePasswordSubmit}>
              <input 
                type="password" 
                autoFocus
                className="form-control" 
                placeholder="Password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ width: '100%', marginBottom: '1rem', marginTop: '1rem' }}
                required
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="submit-btn" style={{ flex: 1, marginTop: 0 }}>Konfirmasi</button>
                <button type="button" className="cancel-btn" onClick={() => setPasswordModal({ isOpen: false, action: null, data: null })} style={{ flex: 1, marginTop: 0 }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
