import React, { useEffect, useMemo, useState } from 'react';
import { CertificateManagementRow } from '../types';
import { formatDate } from '../utils/formatDate';

const PAGE_SIZE = 15;

interface CertificateManagementTabProps {
  certCode: string;
  setCertCode: (v: string) => void;
  certName: string;
  setCertName: (v: string) => void;
  certIssuedBy: string;
  setCertIssuedBy: (v: string) => void;
  handleCreateCertificate: () => void;
  certificateKeyword: string;
  setCertificateKeyword: (v: string) => void;
  loadManagedCertificates: (keyword?: string) => void;
  managedCertificates: CertificateManagementRow[];
}

export function CertificateManagementTab({
  certCode,
  setCertCode,
  certName,
  setCertName,
  certIssuedBy,
  setCertIssuedBy,
  handleCreateCertificate,
  certificateKeyword,
  setCertificateKeyword,
  loadManagedCertificates,
  managedCertificates
}: CertificateManagementTabProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(managedCertificates.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [managedCertificates.length]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedCertificates = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return managedCertificates.slice(start, start + PAGE_SIZE);
  }, [managedCertificates, currentPage]);

  const visibleStart = managedCertificates.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const visibleEnd = Math.min(currentPage * PAGE_SIZE, managedCertificates.length);

  return (
    <section className="panel">
      <h2>Quản lý chứng chỉ</h2>
      <div className="form-grid certificate-grid certificate-create-grid">
        <label>
          Mã chứng chỉ
          <input value={certCode} onChange={(e) => setCertCode(e.target.value)} />
        </label>
        <label>
          Tên chứng chỉ
          <input value={certName} onChange={(e) => setCertName(e.target.value)} />
        </label>
        <label>
          Đơn vị cấp
          <input value={certIssuedBy} onChange={(e) => setCertIssuedBy(e.target.value)} placeholder="Ví dụ: Bo NNPTNT" />
        </label>
        <label>
          &nbsp;
          <button onClick={handleCreateCertificate}>Tạo chứng chỉ mới</button>
        </label>
      </div>
      <div className="management-toolbar">
        <input
          placeholder="Tìm theo mã chứng chỉ, tên chứng chỉ, đơn vị cấp"
          value={certificateKeyword}
          onChange={(e) => setCertificateKeyword(e.target.value)}
        />
        <button className="secondary" onClick={() => loadManagedCertificates(certificateKeyword)}>Tìm kiếm</button>
        <button className="secondary" onClick={() => { setCertificateKeyword(''); loadManagedCertificates(''); }}>Làm mới</button>
      </div>

      <div className="table-wrap">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã chứng chỉ</th>
              <th>Tên chứng chỉ</th>
              <th>Đơn vị cấp</th>
              <th>Ngày cấp</th>
              <th>Hết hạn</th>
              <th>Số lô đã gắn</th>
              <th>Gắn gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {managedCertificates.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-cell">Không có dữ liệu chứng chỉ.</td>
              </tr>
            )}
            {pagedCertificates.map((row) => (
              <tr key={row.certificateId}>
                <td>{row.certificateCode}</td>
                <td>{row.certificateName}</td>
                <td>{row.issuedBy ?? '-'}</td>
                <td>{row.issuedDate ? formatDate(row.issuedDate) : '-'}</td>
                <td>{row.expiredDate ? formatDate(row.expiredDate) : '-'}</td>
                <td>{row.attachedBatchCount}</td>
                <td>{row.lastAttachedAt ? formatDate(row.lastAttachedAt) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="management-pagination">
        <span className="management-pagination__summary">
          Hiển thị {visibleStart}-{visibleEnd} / {managedCertificates.length}
        </span>
        <div className="management-pagination__controls">
          <button
            className="secondary"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Trang trước
          </button>
          <span>Trang {currentPage}/{totalPages}</span>
          <button
            className="secondary"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Trang sau
          </button>
        </div>
      </div>
    </section>
  );
}
