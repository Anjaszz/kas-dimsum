import React from 'react';

interface TutupBukuKaryawanModalProps {
  startDate: string;
  endDate: string;
  batchName: string;
  onChangeStartDate: (val: string) => void;
  onChangeEndDate: (val: string) => void;
  onChangeBatchName: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const TutupBukuKaryawanModal: React.FC<TutupBukuKaryawanModalProps> = ({
  startDate,
  endDate,
  batchName,
  onChangeStartDate,
  onChangeEndDate,
  onChangeBatchName,
  isSubmitting,
  onSubmit,
  onClose
}) => {
  return (
    <div className="password-modal-overlay">
      <div className="password-modal-content" style={{ maxWidth: '450px' }}>
        <h3>Konfirmasi Tutup Buku Performa Karyawan</h3>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Aksi ini akan mengarsipkan ringkasan performa karyawan dan **menghapus** riwayat harian aktif pada rentang tanggal berikut untuk bulan baru.
        </p>
        
        <form onSubmit={onSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Nama Batch Arsip</label>
            <input 
              type="text" 
              className="form-control" 
              value={batchName}
              onChange={(e) => onChangeBatchName(e.target.value)}
              placeholder="Contoh: Periode Juni 2026"
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
