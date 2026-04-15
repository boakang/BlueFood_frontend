import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  addBatchEvent,
  attachCertificate,
  createBatch,
  createCertificate,
  getBatchCertificates,
  getBatchTrace,
  getTraceByQr
} from './api';
import type { BatchCreateResult, BatchTraceItem, CertificateRow } from './types';

const defaultActor = 'BAKHANG\\Administrator';

function formatDate(value: string) {
  if (!value) {
    return '-';
  }

  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  const normalizedValue = hasTimezone ? value : `${value.replace(' ', 'T')}+07:00`;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false
  });
}

function PublicTracePage({ qrToken }: { qrToken: string }) {
  const [rows, setRows] = useState<BatchTraceItem[]>([]);
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
          </>
        ) : (
          <p className="public-empty">Không có dữ liệu để hiển thị.</p>
        )}
      </div>
    </div>
  );
}

function DashboardApp() {
  const [status, setStatus] = useState('Sẵn sàng');
  const [batchCode, setBatchCode] = useState(`BF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`);
  const [productName, setProductName] = useState('Xoai Cat Chu');
  const [actor, setActor] = useState(defaultActor);
  const [traceToken, setTraceToken] = useState('');
  const [traceRows, setTraceRows] = useState<BatchTraceItem[]>([]);
  const [createdBatch, setCreatedBatch] = useState<BatchCreateResult | null>(null);
  const [certCode, setCertCode] = useState(`CERT-${String(Date.now()).slice(-8)}`);
  const [certName, setCertName] = useState('VietGAP');
  const [certificateId, setCertificateId] = useState<number | null>(null);
  const [certRows, setCertRows] = useState<CertificateRow[]>([]);
  const [traceBatchInput, setTraceBatchInput] = useState(batchCode);
  const [traceQrInput, setTraceQrInput] = useState('');

  const latestEvent = useMemo(() => traceRows[traceRows.length - 1], [traceRows]);

  async function handleCreateBatch() {
    setStatus('Đang tạo lô hàng...');
    try {
      const result = await createBatch({
        batchCode,
        productName,
        actor,
        productionDate: '2026-04-01',
        expiryDate: '2026-04-20'
      });
      setCreatedBatch(result);
      setTraceToken(result.qrToken);
      setTraceQrInput(result.qrToken);
      setTraceBatchInput(result.batchCode);
      setStatus(`Đã tạo lô ${result.batchCode}`);
    } catch (error) {
      setStatus(`Lỗi tạo lô: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleAddEvent() {
    setStatus('Đang thêm trạng thái...');
    try {
      await addBatchEvent(batchCode, {
        eventType: 'SHIPPED',
        fromPartnerId: 1,
        toPartnerId: 2,
        locationText: 'Dong Thap',
        noteText: 'Khoi hanh',
        actor
      });
      setStatus(`Đã ghi nhận event cho ${batchCode}`);
    } catch (error) {
      setStatus(`Lỗi thêm event: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleLoadTrace() {
    setStatus('Đang tải trace...');
    try {
      const rows = await getBatchTrace(traceBatchInput);
      setTraceRows(rows);
      setStatus(`Đã tải trace của ${traceBatchInput}`);
    } catch (error) {
      setStatus(`Lỗi tải trace: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleLoadTraceByQr() {
    setStatus('Đang tải trace theo QR...');
    try {
      const rows = await getTraceByQr(traceQrInput);
      setTraceRows(rows);
      setStatus(`Đã tải trace theo QR ${traceQrInput}`);
    } catch (error) {
      setStatus(`Lỗi QR trace: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleCreateCertificate() {
    setStatus('Đang tạo chứng chỉ...');
    try {
      const result = await createCertificate({
        certificateCode: certCode,
        certificateName: certName,
        issuedBy: 'Bo NNPTNT',
        issuedDate: '2026-03-10',
        expiredDate: '2027-03-10',
        fileUrl: 'https://files.local/cert/vietgap.pdf',
        actor
      });
      setCertificateId(result.certificateId);
      setStatus(`Đã tạo chứng chỉ ID=${result.certificateId}`);
    } catch (error) {
      setStatus(`Lỗi tạo chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleAttachCertificate() {
    if (!certificateId) {
      setStatus('Chưa có certificateId để gắn');
      return;
    }

    setStatus('Đang gắn chứng chỉ vào lô...');
    try {
      await attachCertificate(batchCode, certificateId, actor);
      const rows = await getBatchCertificates(batchCode);
      setCertRows(rows);
      setStatus(`Đã gắn chứng chỉ ${certificateId} vào ${batchCode}`);
    } catch (error) {
      setStatus(`Lỗi gắn chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleLoadCertificates() {
    setStatus('Đang tải danh sách chứng chỉ...');
    try {
      const rows = await getBatchCertificates(batchCode);
      setCertRows(rows);
      setStatus(`Đã tải chứng chỉ của ${batchCode}`);
    } catch (error) {
      setStatus(`Lỗi tải chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className="shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <header className="hero">
        <div>
          <span className="eyebrow">BlueFood Traceability</span>
          <h1>Dashboard truy xuất <br /> <span className="text-gradient">chuỗi cung ứng sạch</span></h1>
          <p>
            Web hybrid tối giản, hiện đại, tập trung vào lô hàng, QR trace, chứng chỉ và audit.
          </p>
        </div>
        <div className="hero-card">
          <div>
            <span className="label">Trạng thái hệ thống</span>
            <strong>{status}</strong>
          </div>
          <div className="hero-metrics">
            <div>
              <span>Lô đang chọn</span>
              <strong>{batchCode}</strong>
            </div>
            <div>
              <span>QR token</span>
              <strong>{traceToken || '-'}</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="grid">
        <section className="panel">
          <h2>Tạo lô hàng</h2>
          <div className="form-grid">
            <label>
              Mã lô
              <input value={batchCode} onChange={(e) => setBatchCode(e.target.value)} />
            </label>
            <label>
              Tên sản phẩm
              <input value={productName} onChange={(e) => setProductName(e.target.value)} />
            </label>
            <label>
              Người thao tác
              <input value={actor} onChange={(e) => setActor(e.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button onClick={handleCreateBatch}>Tạo batch + QR</button>
            <button className="secondary" onClick={handleAddEvent}>Ghi nhận SHIPPED</button>
          </div>
          {createdBatch && (
            <div className="result-box">
              <div>
                <span>BatchId</span>
                <strong>{createdBatch.batchId}</strong>
              </div>
              <div>
                <span>Trace URL</span>
                <strong>{createdBatch.traceUrl}</strong>
              </div>
              {traceToken && (
                <div className="qr-block">
                  <span>QR Code truy xuất</span>
                  <div className="qr-image">
                    <QRCodeSVG value={createdBatch.traceUrl} size={180} marginSize={2} includeMargin />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Tra cứu trace</h2>
          <div className="form-grid">
            <label>
              Batch code
              <input value={traceBatchInput} onChange={(e) => setTraceBatchInput(e.target.value)} />
            </label>
            <label>
              QR token
              <input value={traceQrInput} onChange={(e) => setTraceQrInput(e.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button onClick={handleLoadTrace}>Tải theo batch</button>
            <button className="secondary" onClick={handleLoadTraceByQr}>Tải theo QR</button>
          </div>
          <div className="list">
            {traceRows.map((row) => (
              <article key={`${row.batchCode}-${row.eventNo}`} className="timeline-item">
                <div>
                  <span className="pill">{row.eventType}</span>
                  <strong>#{row.eventNo}</strong>
                </div>
                <p>{row.productName} - {formatDate(row.eventTime)}</p>
                <small>{row.fromPartnerName ?? '-'} → {row.toPartnerName ?? '-'}</small>
              </article>
            ))}
          </div>
          {latestEvent && <p className="hint">Sự kiện mới nhất: {latestEvent.eventType} lúc {formatDate(latestEvent.eventTime)}</p>}
        </section>

        <section className="panel panel-wide">
          <h2>Chứng chỉ chất lượng</h2>
          <div className="form-grid certificate-grid">
            <label>
              Mã chứng chỉ
              <input value={certCode} onChange={(e) => setCertCode(e.target.value)} />
            </label>
            <label>
              Tên chứng chỉ
              <input value={certName} onChange={(e) => setCertName(e.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button onClick={handleCreateCertificate}>Tạo chứng chỉ</button>
            <button className="secondary" onClick={handleAttachCertificate}>Gắn vào batch hiện tại</button>
            <button className="secondary" onClick={handleLoadCertificates}>Xem danh sách</button>
          </div>
          <div className="list certificate-list">
            {certRows.map((row) => (
              <article key={row.certificateId} className="cert-card">
                <strong>{row.certificateName}</strong>
                <span>{row.certificateCode}</span>
                <small>Gắn lúc {formatDate(row.attachedAt)} bởi {row.attachedBy}</small>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const qrTokenFromPath = useMemo(() => {
    const match = window.location.pathname.match(/^\/trace\/([^/]+)$/);
    return match?.[1] ?? null;
  }, []);

  if (qrTokenFromPath) {
    return <PublicTracePage qrToken={qrTokenFromPath} />;
  }

  return <DashboardApp />;
}
