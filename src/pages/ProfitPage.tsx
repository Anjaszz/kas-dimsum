import React from 'react';
import type { Transaction, Batch } from '../types';

interface ProfitPageProps {
  allTimeProfit: number;
  currentPeriodProfit: number;
  openTutupBukuProfitModal: () => void;
  isSubmitting: boolean;
  
  editingId: string | null;
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
  
  currentProfitTransactions: Transaction[];
  profitTransactions: Transaction[];
  promptPassword: (action: 'edit' | 'delete' | 'edit_report' | 'delete_report', data: any) => void;
  
  profitBatches: Batch[];
  expandedProfitBatchId: string | null;
  setExpandedProfitBatchId: (id: string | null) => void;
  
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export const ProfitPage: React.FC<ProfitPageProps> = ({
  allTimeProfit,
  currentPeriodProfit,
  openTutupBukuProfitModal,
  isSubmitting,
  
  editingId,
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
  
  currentProfitTransactions,
  profitTransactions,
  promptPassword,
  
  profitBatches,
  expandedProfitBatchId,
  setExpandedProfitBatchId,
  
  formatCurrency,
  formatDate
}) => {
  return (
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
        <button className="tutup-buku-btn" onClick={openTutupBukuProfitModal} disabled={isSubmitting}>
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
                    <div className="batch-details" style={{ display: 'block' }}>
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
  );
};
