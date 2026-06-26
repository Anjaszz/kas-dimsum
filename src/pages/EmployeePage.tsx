import React from 'react';
import type { EmployeeBatch } from '../types';

interface EmployeePageProps {
  savedReports: any[];
  employees: string[];
  selectedEmployees: string[];
  newEmployeeName: string;
  setNewEmployeeName: (val: string) => void;
  editingReportId: string | null;
  reportDate: string;
  setReportDate: (val: string) => void;
  grossIncome: string;
  setGrossIncome: (val: string) => void;
  isSubmitting: boolean;
  
  editingEmployeeName: string | null;
  setEditingEmployeeName: (val: string | null) => void;
  editEmployeeInput: string;
  setEditEmployeeInput: (val: string) => void;
  
  expandedEmployeeCard: string | null;
  setExpandedEmployeeCard: (val: string | null) => void;
  expandedReportId: string | null;
  setExpandedReportId: (val: string | null) => void;
  expandedEmpBatchId: string | null;
  setExpandedEmpBatchId: (val: string | null) => void;
  
  employeeBatches: EmployeeBatch[];
  setEmployeeBatches: React.Dispatch<React.SetStateAction<EmployeeBatch[]>>;
  
  getReportEmployees: (report: any) => string[];
  isEmployeeReport: (report: any) => boolean;
  getEmployeeStats: () => any[];
  handleAddEmployee: (e: React.FormEvent) => void;
  handleDeleteEmployee: (name: string) => void;
  handleToggleSelectEmployee: (name: string) => void;
  handleUpdateEmployee: (oldName: string, newName: string) => void;
  handleSaveReport: () => void;
  handleCancelReportEdit: () => void;
  handleDeleteReport: (id: string) => void;
  loadReportToForm: (report: any) => void;
  handleOpenTutupBukuKaryawan: () => void;
  
  formatCurrency: (amount: number) => string;
}

export const EmployeePage: React.FC<EmployeePageProps> = ({
  savedReports,
  employees,
  selectedEmployees,
  newEmployeeName,
  setNewEmployeeName,
  editingReportId,
  reportDate,
  setReportDate,
  grossIncome,
  setGrossIncome,
  isSubmitting,
  
  editingEmployeeName,
  setEditingEmployeeName,
  editEmployeeInput,
  setEditEmployeeInput,
  
  expandedEmployeeCard,
  setExpandedEmployeeCard,
  expandedReportId,
  setExpandedReportId,
  expandedEmpBatchId,
  setExpandedEmpBatchId,
  
  employeeBatches,
  setEmployeeBatches,
  
  getReportEmployees,
  isEmployeeReport,
  getEmployeeStats,
  handleAddEmployee,
  handleDeleteEmployee,
  handleToggleSelectEmployee,
  handleUpdateEmployee,
  handleSaveReport,
  handleCancelReportEdit,
  handleDeleteReport,
  loadReportToForm,
  handleOpenTutupBukuKaryawan,
  
  formatCurrency
}) => {
  return (
    <div className="report-container">
      <section className="dashboard-cards" style={{ marginBottom: '1rem' }}>
        <div className="card balance" style={{ cursor: 'default' }}>
          <div className="card-title">Total Omset Periode Aktif</div>
          <div className="card-amount">
            {formatCurrency(savedReports.filter(isEmployeeReport).reduce((sum, r) => sum + (r.gross || 0), 0))}
          </div>
        </div>
        <div className="card income" style={{ cursor: 'default' }}>
          <div className="card-title">Karyawan Aktif</div>
          <div className="card-amount income" style={{ color: 'var(--primary-orange)' }}>
            {employees.length} Orang
          </div>
        </div>
      </section>

      <div className="tutup-buku-container">
        <button className="tutup-buku-btn" onClick={handleOpenTutupBukuKaryawan} disabled={isSubmitting}>
          <span>📤</span> {isSubmitting ? 'Memproses...' : 'Tutup Buku Performa Karyawan'}
        </button>
      </div>

      <div className="report-grid">
        <div className="glass-panel">
          <h2 className="panel-title">
            <span>💰</span> {editingReportId ? 'Edit Laporan Penjualan' : 'Input Penjualan Harian'}
          </h2>
          
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label>Tanggal Laporan</label>
            <input 
              type="date" 
              className="form-control" 
              value={reportDate} 
              onChange={(e) => setReportDate(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label>Total Penjualan Harian (Gross)*</label>
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
              placeholder="Contoh: 2.000.000"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label>Karyawan yang Bertugas hari ini*</label>
            {employees.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Belum ada karyawan. Tambahkan karyawan di bawah terlebih dahulu.
              </p>
            ) : (
              <div className="employee-checkbox-grid">
                {employees.map(empName => {
                  const isSelected = selectedEmployees.includes(empName);
                  return (
                    <button
                      key={empName}
                      type="button"
                      className={`employee-select-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleSelectEmployee(empName)}
                    >
                      <span className="checkbox-indicator">{isSelected ? '✓' : '+'}</span>
                      {empName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
            <button className="save-report-btn" onClick={handleSaveReport} disabled={isSubmitting}>
              <span>💾</span> {isSubmitting ? 'Menyimpan...' : (editingReportId ? 'Perbarui Laporan' : 'Simpan Laporan')}
            </button>
            {editingReportId && (
              <button className="cancel-btn" onClick={handleCancelReportEdit} style={{ width: '100%' }}>
                Batal Edit
              </button>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="panel-title"><span>📊</span> Performa Karyawan Periode Ini</h2>
          
          <div className="employee-stats-list">
            {getEmployeeStats().map(stats => {
              const isExpanded = expandedEmployeeCard === stats.name;
              return (
                <div key={stats.name} className={`employee-card ${stats.isActive ? '' : 'inactive-employee'} ${isExpanded ? 'expanded' : ''}`}>
                  <div className="employee-card-header" onClick={() => setExpandedEmployeeCard(isExpanded ? null : stats.name)}>
                    <div className="employee-card-title-group">
                      <h3>
                        {stats.name} {!stats.isActive && <span className="inactive-badge">Tidak Aktif</span>}
                      </h3>
                      <p>{stats.daysWorked} Hari Kerja</p>
                    </div>
                    <div className="employee-card-summary">
                      <div className="summary-val-group">
                        <span className="summary-label">Omset Bagi Rata</span>
                        <span className="summary-val">{formatCurrency(stats.splitGross)}</span>
                      </div>
                      <div className={`expand-icon ${isExpanded ? 'active' : ''}`}>▼</div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="employee-card-details">
                      <div className="employee-card-stats-grid">
                        <div className="emp-stat-item">
                          <span>Total Omset Shift</span>
                          <strong>{formatCurrency(stats.totalGross)}</strong>
                        </div>
                        <div className="emp-stat-item">
                          <span>Omset Bagi Rata</span>
                          <strong>{formatCurrency(stats.splitGross)}</strong>
                        </div>
                        <div className="emp-stat-item">
                          <span>Rata-rata / Shift</span>
                          <strong>{formatCurrency(stats.avgGross)}</strong>
                        </div>
                        <div className="emp-stat-item">
                          <span>Hari Kerja</span>
                          <strong>{stats.daysWorked} Hari</strong>
                        </div>
                      </div>
                      
                      <h4 style={{ marginTop: '1.2rem', marginBottom: '0.6rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Rincian Shift:
                      </h4>
                      {stats.history.length > 0 ? (
                        <div className="emp-shift-history">
                          {stats.history.map((hist: any) => (
                            <div key={hist.id} className="emp-shift-item">
                              <span className="shift-date">
                                {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(hist.date))}
                              </span>
                              <span className="shift-split-amt">
                                {formatCurrency(hist.split)}
                                <span className="shift-calc-detail">
                                  (dari {formatCurrency(hist.gross)} / {hist.numEmployees} org)
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          Belum ada riwayat shift periode ini.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {getEmployeeStats().length === 0 && (
              <div className="empty-state">Belum ada data performa karyawan. Tambahkan karyawan dan catat penjualan.</div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
          <h2 className="panel-title"><span>👥</span> Kelola Daftar Karyawan</h2>
          <form onSubmit={handleAddEmployee} className="add-employee-form">
            <input
              type="text"
              className="form-control add-employee-input"
              placeholder="Masukkan nama karyawan baru"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              required
            />
            <button type="submit" className="add-employee-btn">
              Tambah Karyawan
            </button>
          </form>

          {employees.length > 0 ? (
            <div className="employee-manage-grid">
              {employees.map(empName => {
                const isEditing = editingEmployeeName === empName;
                return isEditing ? (
                  <div key={empName} className="employee-manage-pill editing">
                    <form 
                      onSubmit={(e) => { 
                        e.preventDefault(); 
                        handleUpdateEmployee(empName, editEmployeeInput); 
                      }} 
                      className="employee-edit-form"
                    >
                      <input
                        type="text"
                        className="form-control employee-edit-input"
                        value={editEmployeeInput}
                        onChange={(e) => setEditEmployeeInput(e.target.value)}
                        autoFocus
                        required
                      />
                      <button type="submit" className="action-btn edit employee-edit-btn">Simpan</button>
                      <button type="button" className="action-btn delete employee-cancel-btn" onClick={() => setEditingEmployeeName(null)}>Batal</button>
                    </form>
                  </div>
                ) : (
                  <div key={empName} className="employee-manage-pill">
                    <span 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => {
                        setEditingEmployeeName(empName);
                        setEditEmployeeInput(empName);
                      }}
                      title="Klik untuk mengubah nama"
                    >
                      ✏️ {empName}
                    </span>
                    <div style={{ display: 'flex', gap: '0.3rem', marginLeft: '0.5rem', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        className="action-btn edit" 
                        style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                        onClick={() => {
                          setEditingEmployeeName(empName);
                          setEditEmployeeInput(empName);
                        }}
                        title="Ubah nama"
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        className="remove-btn" 
                        style={{ width: '22px', height: '22px', padding: 0, borderRadius: '50%', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleDeleteEmployee(empName)}
                        title="Hapus dari daftar aktif"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '1rem 0' }}>Belum ada karyawan aktif. Tambahkan nama di atas.</div>
          )}
        </div>

        <div className="glass-panel saved-reports-list">
          <h2 className="panel-title"><span>📚</span> Riwayat Laporan Penjualan Harian</h2>
          {savedReports.length > 0 ? (
            <div className="reports-table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Total Penjualan</th>
                    <th>Karyawan Bertugas</th>
                    <th>Bagi Rata / Orang</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {savedReports.map(report => {
                    const reportEmps = getReportEmployees(report);
                    const isEmpRep = reportEmps.length > 0;
                    const splitAmount = isEmpRep ? (report.gross / reportEmps.length) : 0;
                    
                    return (
                      <React.Fragment key={report.id}>
                        <tr>
                          <td data-label="Tanggal">
                            {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(report.date))}
                          </td>
                          <td data-label="Total Penjualan" style={{ color: 'var(--income)', fontWeight: 'bold' }}>
                            {formatCurrency(report.gross)}
                          </td>
                          <td data-label="Karyawan Bertugas">
                            {isEmpRep ? (
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {reportEmps.map(name => (
                                  <span key={name} className="report-emp-badge">{name}</span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Format Lama (Tanpa Karyawan)
                              </span>
                            )}
                          </td>
                          <td data-label="Bagi Rata / Orang" style={{ color: 'var(--primary-orange)', fontWeight: 'bold' }}>
                            {isEmpRep ? formatCurrency(splitAmount) : '-'}
                          </td>
                          <td>
                            <div className="report-actions">
                              <button 
                                className={`report-action-btn view ${editingReportId === report.id ? 'active' : ''}`} 
                                onClick={() => loadReportToForm(report)}
                              >
                                {editingReportId === report.id ? 'Sedang Edit' : 'Edit'}
                              </button>
                              <button className="report-action-btn delete" onClick={() => handleDeleteReport(report.id)}>
                                Hapus
                              </button>
                              {isEmpRep && (
                                <button 
                                  className={`report-action-btn collapse-btn ${expandedReportId === report.id ? 'active' : ''}`}
                                  onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                                >
                                  {expandedReportId === report.id ? '▲ Tutup' : '▼ Detail'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedReportId === report.id && isEmpRep && (
                          <tr className="expanded-row">
                            <td colSpan={5}>
                              <div className="expanded-content">
                                <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Rincian Distribusi Shift:</h4>
                                <ul className="expense-details-list">
                                  {reportEmps.map((empName: string) => (
                                    <li key={empName}>
                                      <span className="exp-name">{empName}</span>
                                      <span className="exp-amount" style={{ color: 'var(--income)' }}>
                                        +{formatCurrency(splitAmount)}
                                      </span>
                                    </li>
                                  ))}
                                  <li className="total-summary">
                                    <span>Total Penjualan Harian:</span>
                                    <span style={{ color: 'var(--income)', fontWeight: 'bold' }}>
                                      {formatCurrency(report.gross)}
                                    </span>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Belum ada laporan penjualan harian yang disimpan.</div>
          )}
        </div>

        <div className="batch-history-section">
          <div className="glass-panel">
            <h2 className="panel-title"><span>📚</span> Riwayat Tutup Buku Performa Karyawan (Arsip)</h2>
            {employeeBatches.length > 0 ? (
              <div className="batch-list">
                {employeeBatches.map(batch => {
                  const isExpanded = expandedEmpBatchId === batch.id;
                  return (
                    <div key={batch.id} className={`batch-card ${isExpanded ? 'expanded' : ''}`}>
                      <div 
                        className="batch-header" 
                        onClick={() => setExpandedEmpBatchId(isExpanded ? null : batch.id)}
                      >
                        <div className="batch-title-group">
                          <h3>{batch.batchName}</h3>
                          <p className="batch-date-range">
                            {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="batch-summary">
                          <div className="summary-item">
                            <span className="summary-label">Total Karyawan</span>
                            <span className="summary-value">{batch.stats?.length || 0} Orang</span>
                          </div>
                          <div className={`expand-icon ${isExpanded ? 'active' : ''}`}>▼</div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="batch-details" style={{ display: 'block' }}>
                          <div className="reports-table-container">
                            <table className="reports-table" style={{ width: '100%' }}>
                              <thead>
                                <tr>
                                  <th>Nama Karyawan</th>
                                  <th>Hari Kerja</th>
                                  <th>Total Omset Shift</th>
                                  <th>Omset Bagi Rata</th>
                                  <th>Rata-rata / Shift</th>
                                </tr>
                              </thead>
                              <tbody>
                                {batch.stats?.map((stat: any) => (
                                  <tr key={stat.name}>
                                    <td data-label="Nama Karyawan" style={{ fontWeight: 'bold' }}>{stat.name}</td>
                                    <td data-label="Hari Kerja">{stat.daysWorked} Hari</td>
                                    <td data-label="Total Omset Shift">{formatCurrency(stat.totalGross)}</td>
                                    <td data-label="Omset Bagi Rata" style={{ color: 'var(--income)' }}>{formatCurrency(stat.splitGross)}</td>
                                    <td data-label="Rata-rata / Shift">{formatCurrency(stat.avgGross)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="batch-actions-container">
                            <button 
                              className="report-action-btn delete batch-delete-btn"
                              onClick={() => {
                                if (window.confirm("Apakah Anda yakin ingin menghapus arsip tutup buku ini?")) {
                                  setEmployeeBatches(prev => prev.filter(b => b.id !== batch.id));
                                }
                              }}
                            >
                              Hapus Arsip
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">Belum ada riwayat tutup buku performa karyawan.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
