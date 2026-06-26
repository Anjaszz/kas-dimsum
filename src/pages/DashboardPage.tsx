import React from 'react';
import type { Transaction, Batch, TransactionType } from '../types';

interface DashboardPageProps {
  balance: number;
  currentTotalIncome: number;
  currentTotalExpense: number;
  openTutupBukuModal: () => void;
  isSubmitting: boolean;
  
  editingId: string | null;
  type: TransactionType;
  setType: (type: TransactionType) => void;
  amount: string;
  setAmount: (amt: string) => void;
  date: string;
  setDate: (date: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleCancelEdit: () => void;
  
  currentTransactions: Transaction[];
  transactions: Transaction[];
  promptPassword: (action: 'edit' | 'delete' | 'edit_report' | 'delete_report', data: any) => void;
  setSelectedImage: (img: string | null) => void;
  
  batches: Batch[];
  expandedBatchId: string | null;
  setExpandedBatchId: (id: string | null) => void;
  
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  balance,
  currentTotalIncome,
  currentTotalExpense,
  openTutupBukuModal,
  isSubmitting,
  
  editingId,
  type,
  setType,
  amount,
  setAmount,
  date,
  setDate,
  description,
  setDescription,
  imagePreview,
  handleImageChange,
  handleSubmit,
  handleCancelEdit,
  
  currentTransactions,
  transactions,
  promptPassword,
  setSelectedImage,
  
  batches,
  expandedBatchId,
  setExpandedBatchId,
  
  formatCurrency,
  formatDate
}) => {
  return (
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

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Transaksi' : 'Simpan Transaksi')}
              </button>
              {editingId && (
                <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
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
                    <div className="batch-details" style={{ display: 'block' }}>
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
  );
};
