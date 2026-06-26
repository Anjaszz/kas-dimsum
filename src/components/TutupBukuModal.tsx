import React from 'react';

interface TutupBukuModalProps {
  activeTab: 'dashboard' | 'profit' | 'report';
  startDate: string;
  endDate: string;
  batchName: string;
  onChangeStartDate: (val: string) => void;
  onChangeEndDate: (val: string) => void;
  onChangeBatchName: (val: string) => void;
  currentTotalIncome: number;
  currentTotalExpense: number;
  currentBalance: number;
  currentPeriodProfit: number;
  formatCurrency: (amount: number) => string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const TutupBukuModal: React.FC<TutupBukuModalProps> = ({
  activeTab,
  startDate,
  endDate,
  batchName,
  onChangeStartDate,
  onChangeEndDate,
  onChangeBatchName,
  currentTotalIncome,
  currentTotalExpense,
  currentBalance,
  currentPeriodProfit,
  formatCurrency,
  isSubmitting,
  onSubmit,
  onClose
}) => {
  return (
    <div className="password-modal-overlay">
      <div className="password-modal-content" style={{ maxWidth: '450px' }}>
        <h3>Konfirmasi Tutup Buku {activeTab === 'profit' ? 'Profit' : 'Kas'}</h3>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Silakan tinjau rentang tanggal dan nama batch sebelum menutup buku periode ini.
        </p>
        
        <form onSubmit={onSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Nama Batch</label>
            <input 
              type="text" 
              className="form-control" 
              value={batchName}
              onChange={(e) => onChangeBatchName(e.target.value)}
              required
            />
          </div>
          
          <div className="modal-date-grid">
            <div className="form-group">
              <label>Tanggal Mulai</label>
              <input 
                type="date" 
                className="form-control" 
                value={startDate}
                onChange={(e) => onChangeStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Tanggal Akhir</label>
              <input 
                type="date" 
                className="form-control" 
                value={endDate}
                onChange={(e) => onChangeEndDate(e.target.value)}
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

          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Ya, Tutup Buku'}
            </button>
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
