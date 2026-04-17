import { useEffect, useState } from 'react';
import { getBatchCertificates, getTraceByQr } from '../api';
import type { BatchTraceItem, CertificateRow } from '../types';
import { formatDate } from '../utils/formatDate';

export function PublicTracePage({ qrToken }: { qrToken: string }) {
  const [rows, setRows] = useState<BatchTraceItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [status, setStatus] = useState('Đang tải thông tin lô hàng...');

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const result = await getTraceByQr(qrToken);
        if (!isMounted) {
          return;
        }

        setRows(result);
        if (result.length > 0) {
          const certResult = await getBatchCertificates(result[0].batchCode);
          if (!isMounted) {
            return;
          }

          setCertificates(certResult);
        } else {
          setCertificates([]);
        }

        setStatus(result.length > 0 ? 'Đã tải thông tin lô hàng' : 'Không tìm thấy thông tin lô hàng');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus(`Lỗi tải thông tin: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [qrToken]);

  const firstRow = rows[0];

  return (
    <div className="public-shell">
      <div className="public-card">
        <span className="eyebrow">BlueFood Traceability</span>
        <h1 className="public-title">Thông tin lô hàng</h1>
        <p className="public-subtitle">Trang hiển thị công khai cho mã QR truy xuất.</p>

        <div className="public-summary">
          <strong>{status}</strong>
        </div>

        {firstRow ? (
          <>
            <div className="public-grid">
              <div className="result-box">
                <div>
                  <span>Mã lô</span>
                  <strong>{firstRow.batchCode}</strong>
                </div>
                <div>
                  <span>Tên sản phẩm</span>
                  <strong>{firstRow.productName}</strong>
                </div>
              </div>
              <div className="result-box">
                <div>
                  <span>Trạng thái hiện tại</span>
                  <strong>{firstRow.currentStatus}</strong>
                </div>
                <div>
                  <span>QR token</span>
                  <strong>{firstRow.qrToken}</strong>
                </div>
              </div>
            </div>

            <div className="list">
              {rows.map((row) => (
                <article key={`${row.batchCode}-${row.eventNo}`} className="timeline-item">
                  <div>
                    <span className="pill">{row.eventType}</span>
                    <strong>#{row.eventNo}</strong>
                  </div>
                  <p>{row.productName} - {formatDate(row.eventTime)}</p>
                  <small>{row.fromPartnerName ?? '-'} → {row.toPartnerName ?? '-'}</small>
                  {row.locationText && <small>Vị trí: {row.locationText}</small>}
                  {row.noteText && <small>Ghi chú: {row.noteText}</small>}
                </article>
              ))}
            </div>

            <section className="public-cert-section">
              <h2>Chứng chỉ đính kèm</h2>
              {certificates.length === 0 ? (
                <p className="public-empty">Chưa có chứng chỉ nào được gắn cho lô hàng này.</p>
              ) : (
                <div className="list certificate-list public-certificate-list">
                  {certificates.map((row) => (
                    <article key={row.certificateId} className="cert-card">
                      <strong>{row.certificateName}</strong>
                      <span>{row.certificateCode}</span>
                      <small>Cấp bởi: {row.issuedBy ?? '-'}</small>
                      <small>Hiệu lực: {row.issuedDate ? formatDate(row.issuedDate) : '-'} - {row.expiredDate ? formatDate(row.expiredDate) : '-'}</small>
                      <small>Gắn lúc {formatDate(row.attachedAt)} bởi {row.attachedBy}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <p className="public-empty">Không có dữ liệu để hiển thị.</p>
        )}
      </div>
    </div>
  );
}
