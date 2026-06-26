import React from 'react';

interface PasswordModalProps {
  actionName: string | null;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  actionName,
  passwordInput,
  setPasswordInput,
  onSubmit,
  onClose
}) => {
  return (
    <div className="password-modal-overlay" onClick={onClose}>
      <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Masukkan Password</h3>
        <p>Otorisasi diperlukan untuk aksi <strong>{actionName === 'edit' || actionName === 'edit_report' ? 'Edit' : 'Hapus'}</strong>.</p>
        <form onSubmit={onSubmit}>
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
          <div className="modal-actions">
            <button type="submit" className="submit-btn">Konfirmasi</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
};
