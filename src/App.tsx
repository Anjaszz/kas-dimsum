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

  // Initialize Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (isSupabaseConfigured && supabase) {
        try {
          // Fetch from Supabase DB
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });
          
          if (error) {
            console.error(error);
            alert("Terjadi kesalahan saat memuat data DB.");
          }
          if (data) setTransactions(data);
        } catch (error) {
          console.error("Gagal terhubung ke Supabase:", error);
        }
      } else {
        // Fallback to localstorage if Supabase keys not set
        const saved = localStorage.getItem('dimsum_transactions');
        setTransactions(saved ? JSON.parse(saved) : []);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

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

        // 2. Insert ke Database
        const dbTransactionData = {
          type,
          amount: numericAmount,
          date,
          description: description || (type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'),
          image: imageUrl
        };

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

      } catch (err) {
        console.error("Error tidak terduga:", err);
        setIsSubmitting(false);
        return;
      }
    } else {
      // Localstorage fallback mode
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type,
        amount: numericAmount,
        date,
        description: description || (type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'),
        image: finalBase64Preview
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    // Reset Form
    setAmount('');
    setDescription('');
    setImagePreview(null);
    setImageFile(null);
    setDate(getLocalDateTime());
    setIsSubmitting(false);
    
    const fileInput = document.getElementById('image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Memuat data transaksi...
        </div>
      ) : (
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
                <span>✍️</span> Catat Transaksi
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

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan ke Server...' : 'Simpan Transaksi'}
                </button>
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
      )}

      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="image-modal-close" onClick={() => setSelectedImage(null)}>&times;</span>
            <img src={selectedImage} alt="Bukti Full" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
