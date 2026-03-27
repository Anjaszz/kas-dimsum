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
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{isOpen: boolean, action: 'edit' | 'delete' | 'edit_report' | 'delete_report' | null, data: any}>({isOpen: false, action: null, data: null});
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('dashboard');

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

  // Initialize Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // 1. Load from LocalStorage first (for quick initial display)
      const savedTrans = localStorage.getItem('dimsum_transactions');
      if (savedTrans) setTransactions(JSON.parse(savedTrans));
      
      const savedRep = localStorage.getItem('dimsum_reports');
      if (savedRep) setSavedReports(JSON.parse(savedRep));

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
            console.log("Syncing reports from DB:", reportData.length, "found");
            setSavedReports(reportData);
            localStorage.setItem('dimsum_reports', JSON.stringify(reportData));
          } else if (reportError) {
             console.warn("DB daily_reports error:", reportError.message);
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
        executeDelete(passwordModal.data as string);
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
        const dbTransactionData = {
          type,
          amount: numericAmount,
          date,
          description: description || (type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'),
          image: imageUrl ? imageUrl : (editingId && !imageFile ? finalBase64Preview : null)
        };

        if (editingId) {
          const { error: updateError } = await supabase
            .from('transactions')
            .update(dbTransactionData)
            .eq('id', editingId);
            
          if (updateError) {
            console.error("DB Update Error:", updateError);
            alert("Gagal memperbarui transaksi.");
            setIsSubmitting(false);
            return;
          }
          setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...dbTransactionData, id: editingId } : t));
        } else {
          const { data: insertedData, error: insertError } = await supabase
            .from('transactions')
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
          setTransactions(prev => [insertedData, ...prev]);
        }

      } catch (err) {
        console.error("Error tidak terduga:", err);
        setIsSubmitting(false);
        return;
      }
    } else {
      // Localstorage fallback mode
      const transactionData = {
        type,
        amount: numericAmount,
        date,
        description: description || (type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'),
        image: finalBase64Preview
      };

      if (editingId) {
        setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...transactionData, id: editingId } : t));
      } else {
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          ...transactionData
        };
        setTransactions(prev => [newTransaction, ...prev]);
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

  const loadReportToForm = (report: any) => {
    promptPassword('edit_report', report);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Rasa Terakhir</h1>
        <p>Dashboard Arus Kas Dimsum</p>
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
              <div className="card-title">Total Saldo</div>
              <div className="card-amount">{formatCurrency(balance)}</div>
            </div>
            <div className="card income">
              <div className="card-title">Total Pemasukan</div>
              <div className="card-amount income">{formatCurrency(totalIncome)}</div>
            </div>
            <div className="card expense">
              <div className="card-title">Total Pengeluaran</div>
              <div className="card-amount expense">{formatCurrency(totalExpense)}</div>
            </div>
          </section>

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
                <span>📋</span> Riwayat Transaksi
              </h2>
              {transactions.length > 0 ? (
                <div className="history-list">
                  {transactions.map(t => (
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
                  Belum ada transaksi yang dicatat.
                </div>
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
                  <h3 style={{ margin: 0 }}>RASA TERAKHIR</h3>
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
