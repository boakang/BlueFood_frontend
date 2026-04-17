import { Fragment, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  addBatchEvent,
  attachCertificate,
  createBatch,
  createCertificate,
  getBatchesByCertificateId,
  getBatchCertificates,
  getBatchTrace,
  getDashboardOverview,
  getManagedBatches,
  getManagedCertificates,
  getPartners,
  getTraceByQr
} from '../api';
import type {
  BatchCreateResult,
  BatchManagementRow,
  BatchTraceItem,
  CertificateAttachedBatchRow,
  CertificateManagementRow,
  CertificateRow,
  DashboardOverview,
  PartnerRow
} from '../types';
import { formatDate } from '../utils/formatDate';

const defaultActor = 'BAKHANG\\Administrator';

type MainTab = 'overview' | 'workflow' | 'batch-management' | 'certificate-management';
type WorkflowStep = 'create' | 'trace' | 'certificate' | 'confirm';

type ChartPoint = {
  label: string;
  value: number;
};

const MAIN_TAB_PATHS: Record<MainTab, string> = {
  overview: '/dashboard/overview',
  workflow: '/dashboard/workflow',
  'batch-management': '/dashboard/batches',
  'certificate-management': '/dashboard/certificates'
};

const WORKFLOW_STEPS: Array<{ id: WorkflowStep; title: string; description: string }> = [
  { id: 'create', title: 'Tạo lô hàng', description: 'Bước 1: tạo batch và QR' },
  { id: 'trace', title: 'Tra cứu trace', description: 'Bước 2: ghi nhận vận chuyển và tải timeline' },
  { id: 'certificate', title: 'Chứng chỉ chất lượng', description: 'Bước 3: tạo và gắn chứng chỉ' },
  { id: 'confirm', title: 'Xác nhận kết quả', description: 'Bước 4: tổng hợp kết quả lô hàng' }
];

const MAIN_TABS: Array<{ id: MainTab; title: string }> = [
  { id: 'overview', title: 'Dashboard tổng quan' },
  { id: 'workflow', title: 'Tạo mới lô hàng' },
  { id: 'batch-management', title: 'Quản lý lô hàng' },
  { id: 'certificate-management', title: 'Quản lý chứng chỉ' }
];

function getMainTabFromPath(pathname: string): MainTab {
  if (pathname.endsWith('/workflow')) {
    return 'workflow';
  }

  if (pathname.endsWith('/batches')) {
    return 'batch-management';
  }

  if (pathname.endsWith('/certificates')) {
    return 'certificate-management';
  }

  return 'overview';
}

function BarChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="chart chart-bar">
      {data.map((item) => {
        const heightPercent = Math.max((item.value / max) * 100, 8);
        return (
          <div key={item.label} className="bar-item">
            <div className="bar-track">
              <div className="bar-fill" style={{ height: `${heightPercent}%` }} />
            </div>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function PieChart({ complete, total }: { complete: number; total: number }) {
  const safeTotal = Math.max(total, 1);
  const percent = Math.max(Math.min(complete / safeTotal, 1), 0);
  const circumference = 2 * Math.PI * 44;
  const filled = circumference * percent;

  return (
    <div className="chart chart-pie">
      <svg viewBox="0 0 120 120" role="img" aria-label="Tiến độ quy trình demo">
        <circle cx="60" cy="60" r="44" className="pie-track" />
        <circle
          cx="60"
          cy="60"
          r="44"
          className="pie-fill"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
      <div className="pie-label">
        <strong>{Math.round(percent * 100)}%</strong>
        <span>Hoàn thành quy trình</span>
      </div>
    </div>
  );
}

function LineChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 10 : 10 + (index / (data.length - 1)) * 80;
      const y = 90 - (item.value / max) * 70;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="chart chart-line">
      <svg viewBox="0 0 100 100" role="img" aria-label="Diễn biến số sự kiện trace">
        <polyline points="10,90 90,90" className="line-axis" />
        <polyline points={points} className="line-path" />
      </svg>
      <div className="line-legend">
        {data.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

export function DashboardApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState('Sẵn sàng');
  const [batchCode, setBatchCode] = useState(`BF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`);
  const [productName, setProductName] = useState('');
  const [actor, setActor] = useState(defaultActor);
  const [traceToken, setTraceToken] = useState('');
  const [traceRows, setTraceRows] = useState<BatchTraceItem[]>([]);
  const [createdBatch, setCreatedBatch] = useState<BatchCreateResult | null>(null);
  const [certCode, setCertCode] = useState(`CERT-${String(Date.now()).slice(-8)}`);
  const [certName, setCertName] = useState('VietGAP');
  const [certIssuedBy, setCertIssuedBy] = useState('');
  const [certificateId, setCertificateId] = useState<number | null>(null);
  const [selectedExistingCertificateId, setSelectedExistingCertificateId] = useState<number | null>(null);
  const [certRows, setCertRows] = useState<CertificateRow[]>([]);
  const [selectedCertificateBatches, setSelectedCertificateBatches] = useState<CertificateAttachedBatchRow[]>([]);
  const [traceBatchInput, setTraceBatchInput] = useState(batchCode);
  const [traceQrInput, setTraceQrInput] = useState('');
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [farmPartnerId, setFarmPartnerId] = useState<number | null>(null);
  const [fromPartnerId, setFromPartnerId] = useState<number | null>(null);
  const [toPartnerId, setToPartnerId] = useState<number | null>(null);
  const [traceStepCompleted, setTraceStepCompleted] = useState(false);
  const [certificateStepCompleted, setCertificateStepCompleted] = useState(false);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('create');

  const [batchKeyword, setBatchKeyword] = useState('');
  const [certificateKeyword, setCertificateKeyword] = useState('');
  const [managedBatches, setManagedBatches] = useState<BatchManagementRow[]>([]);
  const [managedCertificates, setManagedCertificates] = useState<CertificateManagementRow[]>([]);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [expandedBatchLoadingId, setExpandedBatchLoadingId] = useState<string | null>(null);
  const [batchDetailsById, setBatchDetailsById] = useState<Record<string, { status: string; qrToken: string; traceUrl: string; eventTime?: string; fromPartnerName?: string | null; toPartnerName?: string | null }>>({});
  const certificateOptions = useMemo(() => {
    return [...managedCertificates].sort((left, right) => right.certificateId - left.certificateId);
  }, [managedCertificates]);

  const activeMainTab = getMainTabFromPath(location.pathname);
  const latestEvent = useMemo(() => traceRows[traceRows.length - 1], [traceRows]);
  const transportPartners = useMemo(() => partners.filter((partner) => partner.partnerType === 2), [partners]);

  const chartEventTypeData = useMemo<ChartPoint[]>(() => {
    const distribution = dashboardOverview?.eventTypeDistribution ?? [];
    if (distribution.length > 0) {
      return distribution.map((item) => ({ label: item.label, value: item.value }));
    }

    return [
      { label: 'CREATED', value: 0 },
      { label: 'SHIPPED', value: 0 },
      { label: 'CERTIFIED', value: 0 }
    ];
  }, [dashboardOverview]);

  const chartTimelineData = useMemo<ChartPoint[]>(() => {
    const timeline = dashboardOverview?.timelineSeries ?? [];
    if (timeline.length > 0) {
      return [...timeline]
        .sort((left, right) => left.label.localeCompare(right.label))
        .map((item) => ({ label: item.label, value: item.value }));
    }

    return [{ label: 'No data', value: 0 }];
  }, [dashboardOverview]);

  const certificateCoverage = useMemo(() => {
    const totalBatches = dashboardOverview?.totalBatches ?? 0;
    const totalCertificatesAttached = dashboardOverview?.totalCertificatesAttached ?? 0;
    return {
      complete: totalCertificatesAttached,
      total: Math.max(totalBatches, 1)
    };
  }, [dashboardOverview]);

  function toPartnerValue(value: string) {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function canOpenWorkflowStep(step: WorkflowStep) {
    if (step === 'create') {
      return true;
    }

    if (step === 'trace') {
      return createdBatch !== null;
    }

    if (step === 'certificate') {
      return traceStepCompleted;
    }

    return certificateStepCompleted;
  }

  function tryOpenWorkflowStep(step: WorkflowStep) {
    if (!canOpenWorkflowStep(step)) {
      setStatus('Bạn cần hoàn thành bước trước để mở tab này.');
      return;
    }

    setWorkflowStep(step);
  }

  function openMainTab(tab: MainTab) {
    navigate(MAIN_TAB_PATHS[tab]);
  }

  async function loadDashboardOverviewData(setStatusOnError = true) {
    try {
      const result = await getDashboardOverview();
      setDashboardOverview(result);
    } catch (error) {
      if (setStatusOnError) {
        setStatus(`Lỗi tải dashboard: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async function loadManagedBatches(keyword = batchKeyword, setStatusOnError = true) {
    try {
      const rows = await getManagedBatches(keyword, 200);
      setManagedBatches(rows);
    } catch (error) {
      if (setStatusOnError) {
        setStatus(`Lỗi tải quản lý lô: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async function loadManagedCertificates(keyword = certificateKeyword, setStatusOnError = true) {
    try {
      const rows = await getManagedCertificates(keyword, 200);
      setManagedCertificates(rows);
    } catch (error) {
      if (setStatusOnError) {
        setStatus(`Lỗi tải quản lý chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadPartners() {
      try {
        const rows = await getPartners();
        if (!isMounted) {
          return;
        }

        setPartners(rows);

        const defaultFarm = rows.find((partner) => partner.partnerType === 1)?.partnerId ?? null;
        const defaultTransport = rows.find((partner) => partner.partnerType === 2)?.partnerId ?? null;
        const fallback = rows[0]?.partnerId ?? null;

        setFarmPartnerId(defaultFarm ?? fallback);
        setFromPartnerId(defaultFarm ?? fallback);
        setToPartnerId(defaultTransport ?? fallback);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus(`Lỗi tải partner: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    loadDashboardOverviewData();
    loadManagedBatches('', false);
    loadManagedCertificates('', false);
    loadPartners();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeMainTab !== 'workflow') {
      return;
    }

    if (!canOpenWorkflowStep(workflowStep)) {
      setWorkflowStep('create');
    }
  }, [activeMainTab, workflowStep, createdBatch, traceStepCompleted, certificateStepCompleted]);

  useEffect(() => {
    setFromPartnerId(farmPartnerId);
  }, [farmPartnerId]);

  async function handleCreateBatch() {
    if (farmPartnerId === null) {
      setStatus('Vui lòng chọn partner nông trại trước khi tạo lô.');
      return;
    }

    setStatus('Đang tạo lô hàng...');
    try {
      const result = await createBatch({
        batchCode,
        productName,
        farmPartnerId,
        actor,
        productionDate: '2026-04-01',
        expiryDate: '2026-04-20'
      });

      setCreatedBatch(result);
      setTraceToken(result.qrToken);
      setTraceQrInput(result.qrToken);
      setTraceBatchInput(result.batchCode);
      setWorkflowStep('trace');
      await Promise.all([
        loadDashboardOverviewData(false),
        loadManagedBatches(batchKeyword, false)
      ]);
      setStatus(`Đã tạo lô ${result.batchCode}. Chuyển sang bước Tra cứu trace.`);
      navigate(MAIN_TAB_PATHS.workflow);
    } catch (error) {
      setStatus(`Lỗi tạo lô: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleAddEvent() {
    if (fromPartnerId === null || toPartnerId === null) {
      setStatus('Vui lòng chọn partner From/To trước khi ghi nhận SHIPPED.');
      return;
    }

    setStatus('Đang thêm trạng thái...');
    try {
      await addBatchEvent(traceBatchInput, {
        eventType: 'SHIPPED',
        fromPartnerId,
        toPartnerId,
        locationText: 'Dong Thap',
        noteText: 'Khoi hanh',
        actor
      });

      await Promise.all([
        loadDashboardOverviewData(false),
        loadManagedBatches(batchKeyword, false)
      ]);
      setStatus(`Đã ghi nhận event cho ${traceBatchInput}`);
    } catch (error) {
      setStatus(`Lỗi thêm event: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleLoadTrace() {
    setStatus('Đang tải trace...');
    try {
      const rows = await getBatchTrace(traceBatchInput);
      setTraceRows(rows);
      if (rows.length > 0) {
        setTraceStepCompleted(true);
      }
      setStatus(`Đã tải trace của ${traceBatchInput}.`);
    } catch (error) {
      setStatus(`Lỗi tải trace: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleLoadTraceByQr() {
    setStatus('Đang tải trace theo QR...');
    try {
      const rows = await getTraceByQr(traceQrInput);
      setTraceRows(rows);
      if (rows.length > 0) {
        setTraceStepCompleted(true);
      }
      setStatus(`Đã tải trace theo QR ${traceQrInput}.`);
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
        issuedBy: certIssuedBy.trim() || undefined,
        issuedDate: '2026-03-10',
        expiredDate: '2027-03-10',
        fileUrl: 'https://files.local/cert/vietgap.pdf',
        actor
      });
      setCertificateId(result.certificateId);
      setSelectedExistingCertificateId(result.certificateId);
      await Promise.all([
        loadDashboardOverviewData(false),
        loadManagedCertificates(certificateKeyword, false)
      ]);
      setStatus(`Đã tạo chứng chỉ ID=${result.certificateId}.`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('đã tồn tại')) {
        const existing = managedCertificates.find(
          (item) => item.certificateCode.trim().toLowerCase() === certCode.trim().toLowerCase()
        );
        if (existing) {
          setSelectedExistingCertificateId(existing.certificateId);
          setCertificateId(existing.certificateId);
          setStatus(`Mã chứng chỉ đã tồn tại. Đã chọn chứng chỉ ID=${existing.certificateId} để bạn gắn vào lô.`);
          return;
        }
      }

      setStatus(`Lỗi tạo chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleAttachCertificate() {
    const targetCertificateId = selectedExistingCertificateId ?? certificateId;

    if (!targetCertificateId) {
      setStatus('Vui lòng tạo mới hoặc chọn chứng chỉ có sẵn trước khi gắn.');
      return;
    }

    setStatus('Đang gắn chứng chỉ vào lô...');
    try {
      await attachCertificate(traceBatchInput, targetCertificateId, actor);
      const rows = await getBatchCertificates(traceBatchInput);
      setCertRows(rows);
      setCertificateStepCompleted(rows.length > 0);
      setWorkflowStep('confirm');
      await Promise.all([
        handleLoadBatchesBySelectedCertificate(targetCertificateId, false),
        loadDashboardOverviewData(false),
        loadManagedBatches(batchKeyword, false),
        loadManagedCertificates(certificateKeyword, false)
      ]);
      setStatus(`Đã gắn (hoặc đổi) chứng chỉ ${targetCertificateId} cho ${traceBatchInput}. Chuyển sang bước xác nhận.`);
    } catch (error) {
      setStatus(`Lỗi gắn chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleLoadBatchesBySelectedCertificate(certificateIdOverride?: number, setStatusOnError = true) {
    const targetCertificateId = certificateIdOverride ?? selectedExistingCertificateId;

    if (!targetCertificateId) {
      setStatus('Vui lòng chọn chứng chỉ trước khi xem danh sách lô đã gắn.');
      return;
    }

    try {
      const rows = await getBatchesByCertificateId(targetCertificateId);
      setSelectedCertificateBatches(rows);
      if (rows.length === 0) {
        setStatus('Chứng chỉ này chưa được gắn cho lô hàng nào.');
      } else {
        setStatus(`Đã tải ${rows.length} lô hàng đang gắn chứng chỉ đã chọn.`);
      }
    } catch (error) {
      if (setStatusOnError) {
        setStatus(`Lỗi tải danh sách lô theo chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async function handleLoadCertificates() {
    setStatus('Đang tải danh sách chứng chỉ...');
    try {
      const rows = await getBatchCertificates(traceBatchInput);
      setCertRows(rows);
      if (rows.length > 0) {
        setCertificateStepCompleted(true);
      }
      setStatus(`Đã tải chứng chỉ của ${traceBatchInput}.`);
    } catch (error) {
      setStatus(`Lỗi tải chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleToggleBatchDetails(row: BatchManagementRow) {
    if (expandedBatchId === row.batchId) {
      setExpandedBatchId(null);
      return;
    }

    setExpandedBatchId(row.batchId);
    setExpandedBatchLoadingId(row.batchId);

    try {
      const traceRows = await getBatchTrace(row.batchCode);
      const latestRow = traceRows[traceRows.length - 1];
      const firstRow = traceRows[0];

      setBatchDetailsById((previous) => ({
        ...previous,
        [row.batchId]: {
          status: latestRow?.currentStatus ?? row.currentStatus,
          qrToken: firstRow?.qrToken ?? '',
          traceUrl: firstRow?.traceUrl ?? '',
          eventTime: latestRow?.eventTime,
          fromPartnerName: latestRow?.fromPartnerName,
          toPartnerName: latestRow?.toPartnerName
        }
      }));
    } catch (error) {
      setStatus(`Lỗi tải chi tiết lô ${row.batchCode}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setExpandedBatchLoadingId((current) => (current === row.batchId ? null : current));
    }
  }

  function renderOverview() {
    return (
      <section className="panel panel-overview">
        <h2>Dashboard truy xuất tổng quan</h2>
        <p className="overview-subtitle">Theo dõi tiến độ demo theo thời gian thực: từ tạo lô đến xác nhận cuối cùng.</p>
        <div className="overview-stats">
          <article className="result-box">
            <span>Tổng số lô hàng</span>
            <strong>{dashboardOverview?.totalBatches ?? 0}</strong>
          </article>
          <article className="result-box">
            <span>Tổng sự kiện trace</span>
            <strong>{dashboardOverview?.totalTraceEvents ?? 0}</strong>
          </article>
          <article className="result-box">
            <span>Tổng chứng chỉ đã gắn</span>
            <strong>{dashboardOverview?.totalCertificatesAttached ?? 0}</strong>
          </article>
        </div>
        <div className="overview-charts">
          <article className="chart-card">
            <h3>Bar chart: Số lượng sự kiện theo loại</h3>
            <BarChart data={chartEventTypeData} />
          </article>
          <article className="chart-card">
            <h3>Pie chart: Tỷ lệ lô có chứng chỉ gắn</h3>
            <PieChart complete={certificateCoverage.complete} total={certificateCoverage.total} />
          </article>
          <article className="chart-card">
            <h3>Line chart: Diễn tiến sự kiện theo ngày</h3>
            <LineChart data={chartTimelineData} />
          </article>
        </div>
      </section>
    );
  }

  function renderCreateStep() {
    return (
      <section className="panel">
        <h2>Bước 1: Tạo lô hàng</h2>
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
            Partner
            <select value={farmPartnerId ?? ''} onChange={(e) => setFarmPartnerId(toPartnerValue(e.target.value))}>
              <option value="">Chọn partner</option>
              {partners.map((partner) => (
                <option key={partner.partnerId} value={partner.partnerId}>
                  {partner.partnerCode} - {partner.partnerName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Người thao tác
            <input value={actor} onChange={(e) => setActor(e.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button onClick={handleCreateBatch}>Tạo batch + QR</button>
          <button className="secondary" disabled={!createdBatch} onClick={() => tryOpenWorkflowStep('trace')}>Sang bước Tra cứu trace</button>
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
            <div className="qr-block">
              <span>QR Code truy xuất</span>
              <div className="qr-image">
                <QRCodeSVG value={createdBatch.traceUrl} size={180} marginSize={2} includeMargin />
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  function renderTraceStep() {
    return (
      <section className="panel">
        <h2>Bước 2: Tra cứu trace</h2>
        <div className="form-grid">
          <label>
            Batch code
            <input value={traceBatchInput} onChange={(e) => setTraceBatchInput(e.target.value)} />
          </label>
          <label>
            QR token
            <input value={traceQrInput} onChange={(e) => setTraceQrInput(e.target.value)} />
          </label>
          <label>
            From partner
            <select value={fromPartnerId ?? ''} disabled>
              <option value="">Chọn partner</option>
              {partners.map((partner) => (
                <option key={partner.partnerId} value={partner.partnerId}>
                  {partner.partnerCode} - {partner.partnerName}
                </option>
              ))}
            </select>
          </label>
          <label>
            To partner
            <select value={toPartnerId ?? ''} onChange={(e) => setToPartnerId(toPartnerValue(e.target.value))}>
              <option value="">Chọn partner</option>
              {(transportPartners.length > 0 ? transportPartners : partners).map((partner) => (
                <option key={partner.partnerId} value={partner.partnerId}>
                  {partner.partnerCode} - {partner.partnerName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="actions">
          <button onClick={handleAddEvent}>Ghi nhận SHIPPED</button>
          <button className="secondary" onClick={handleLoadTrace}>Tải theo batch</button>
          <button className="secondary" onClick={handleLoadTraceByQr}>Tải theo QR</button>
          <button className="secondary" disabled={!traceStepCompleted} onClick={() => tryOpenWorkflowStep('certificate')}>Sang bước Chứng chỉ</button>
        </div>
        <div className="list">
          {traceRows.map((row) => (
            <article key={`${row.batchCode}-${row.eventNo}`} className="timeline-item">
              <div>
                <span className="pill">{row.eventType}</span>
                <strong>#{row.eventNo}</strong>
              </div>
              <p>{row.productName} - {formatDate(row.eventTime)}</p>
              <small>{row.fromPartnerName ?? '-'} {'->'} {row.toPartnerName ?? '-'}</small>
            </article>
          ))}
        </div>
        {latestEvent && <p className="hint">Sự kiện mới nhất: {latestEvent.eventType} lúc {formatDate(latestEvent.eventTime)}</p>}
      </section>
    );
  }

  function renderCertificateStep() {
    return (
      <section className="panel">
        <h2>Bước 3: Chứng chỉ chất lượng</h2>
        <div className="form-grid">
          <label>
            Chọn chứng chỉ có sẵn
            <select
              value={selectedExistingCertificateId ?? ''}
              onChange={(e) => setSelectedExistingCertificateId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Chưa chọn</option>
              {certificateOptions.map((item) => (
                <option key={item.certificateId} value={item.certificateId}>
                  {item.certificateCode} - {item.certificateName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="actions">
          <button className="secondary" onClick={handleAttachCertificate} disabled={!selectedExistingCertificateId}>Gắn vào batch hiện tại</button>
          <button className="secondary" onClick={() => handleLoadBatchesBySelectedCertificate()} disabled={!selectedExistingCertificateId}>Xem danh sách</button>
          <button className="secondary" disabled={!certificateStepCompleted} onClick={() => tryOpenWorkflowStep('confirm')}>Sang bước Xác nhận</button>
        </div>
        <div className="list certificate-list">
          {selectedCertificateBatches.map((row) => (
            <article key={row.batchId} className="cert-card">
              <strong>{row.batchCode} - {row.productName}</strong>
              <span>Trạng thái: {row.currentStatus}</span>
              <small>Gắn lúc {formatDate(row.attachedAt)} bởi {row.attachedBy}</small>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderConfirmStep() {
    const firstTraceRow = traceRows[0];

    return (
      <section className="panel">
        <h2>Bước 4: Xác nhận kết quả cuối cùng</h2>
        <p className="overview-subtitle">Màn hình chốt kết quả cho lô hàng đã hoàn thành đầy đủ luồng demo.</p>
        <div className="confirm-grid">
          <article className="result-box">
            <span>Mã lô</span>
            <strong>{createdBatch?.batchCode ?? traceBatchInput}</strong>
            <span>QR token</span>
            <strong>{traceToken || '-'}</strong>
            <span>Trạng thái hiện tại</span>
            <strong>{firstTraceRow?.currentStatus ?? latestEvent?.eventType ?? 'N/A'}</strong>
          </article>
          <article className="result-box">
            <span>Kiểm tra tiêu chí</span>
            <strong>{createdBatch ? 'QR đã được sinh' : 'Chưa đạt'}</strong>
            <strong>{traceStepCompleted ? 'Trace đã truy xuất được' : 'Chưa đạt'}</strong>
            <strong>{certificateStepCompleted ? 'Chứng chỉ đã gắn thành công' : 'Chưa đạt'}</strong>
          </article>
        </div>
      </section>
    );
  }

  function renderWorkflow() {
    return (
      <section className="panel panel-workflow">
        <h2>Tạo mới lô hàng</h2>
        <p className="overview-subtitle">Tab này bao gồm đầy đủ các bước tạo batch, trace, chứng chỉ và xác nhận.</p>

        <div className="workflow-subtabs" role="tablist" aria-label="Workflow steps">
          {WORKFLOW_STEPS.map((step, index) => {
            const active = workflowStep === step.id;
            const unlocked = canOpenWorkflowStep(step.id);
            return (
              <button
                key={step.id}
                role="tab"
                aria-selected={active}
                className={`workflow-subtab ${active ? 'is-active' : ''}`}
                disabled={!unlocked}
                onClick={() => tryOpenWorkflowStep(step.id)}
              >
                <span className="step-index">{index + 1}</span>
                <span className="step-text">
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="workflow-content">
          {workflowStep === 'create' && renderCreateStep()}
          {workflowStep === 'trace' && renderTraceStep()}
          {workflowStep === 'certificate' && renderCertificateStep()}
          {workflowStep === 'confirm' && renderConfirmStep()}
        </div>
      </section>
    );
  }

  function renderBatchManagement() {
    return (
      <section className="panel">
        <h2>Quản lý lô hàng</h2>
        <div className="management-toolbar">
          <input
            placeholder="Tìm theo mã lô, tên sản phẩm, trạng thái"
            value={batchKeyword}
            onChange={(e) => setBatchKeyword(e.target.value)}
          />
          <button className="secondary" onClick={() => loadManagedBatches(batchKeyword)}>Tìm kiếm</button>
          <button className="secondary" onClick={() => loadManagedBatches('', false).then(() => setBatchKeyword(''))}>Làm mới</button>
        </div>

        <div className="table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Sản phẩm</th>
                <th>Trạng thái</th>
                <th>Nông trại</th>
                <th>Chứng chỉ</th>
                <th>Tạo lúc</th>
                <th>Người tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {managedBatches.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-cell">Không có dữ liệu lô hàng.</td>
                </tr>
              )}
              {managedBatches.map((row) => {
                const detail = batchDetailsById[row.batchId];
                const isExpanded = expandedBatchId === row.batchId;
                const isLoadingDetail = expandedBatchLoadingId === row.batchId;

                return (
                  <Fragment key={row.batchId}>
                    <tr>
                      <td>{row.batchCode}</td>
                      <td>{row.productName}</td>
                      <td>{row.currentStatus}</td>
                      <td>{row.farmPartnerName ?? '-'}</td>
                      <td>{row.certificateName ?? '-'}</td>
                      <td>{formatDate(row.createdAt)}</td>
                      <td>{row.createdBy}</td>
                      <td>
                        <button
                          className={`row-expand-button ${isExpanded ? 'is-expanded' : ''}`}
                          onClick={() => handleToggleBatchDetails(row)}
                          aria-label={`Mở chi tiết lô ${row.batchCode}`}
                        >
                          {'>'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="batch-detail-cell">
                          {isLoadingDetail && <span>Đang tải chi tiết lô hàng...</span>}
                          {!isLoadingDetail && !detail && <span>Không có dữ liệu chi tiết cho lô hàng này.</span>}
                          {!isLoadingDetail && detail && (
                            <div className="batch-detail-panel">
                              <div className="batch-detail-grid">
                                <div>
                                  <span>Trạng thái hiện tại</span>
                                  <strong>{detail.status}</strong>
                                </div>
                                <div>
                                  <span>QR token</span>
                                  <strong>{detail.qrToken || '-'}</strong>
                                </div>
                                <div>
                                  <span>Lần cập nhật trạng thái gần nhất</span>
                                  <strong>{detail.eventTime ? formatDate(detail.eventTime) : '-'}</strong>
                                </div>
                                <div>
                                  <span>Tuyến gần nhất</span>
                                  <strong>{detail.fromPartnerName ?? '-'} {'->'} {detail.toPartnerName ?? '-'}</strong>
                                </div>
                              </div>
                              {detail.traceUrl && (
                                <div className="batch-detail-qr">
                                  <span>QR Code truy xuất của lô</span>
                                  <div className="qr-image">
                                    <QRCodeSVG value={detail.traceUrl} size={160} marginSize={2} includeMargin />
                                  </div>
                                  <small>{detail.traceUrl}</small>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderCertificateManagement() {
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
          <button className="secondary" onClick={() => loadManagedCertificates('', false).then(() => setCertificateKeyword(''))}>Làm mới</button>
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
              {managedCertificates.map((row) => (
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
      </section>
    );
  }

  return (
    <div className="dashboard-frame">
      <aside className="left-sidebar" aria-label="Main navigation tabs">
        <div className="sidebar-brand">BlueFood Traceability</div>
        <div className="sidebar-menu" role="tablist" aria-orientation="vertical">
          {MAIN_TABS.map((tab) => {
            const active = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`sidebar-item ${active ? 'is-active' : ''}`}
                onClick={() => openMainTab(tab.id)}
                role="tab"
                aria-selected={active}
              >
                <span className="step-text">
                  <strong>{tab.title}</strong>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="shell">
        <div className="ambient ambient-a" />
        <div className="ambient ambient-b" />

        {activeMainTab === 'overview' && (
          <header className="hero">
            <div>
              <span className="eyebrow">BlueFood Traceability</span>
              <h1>Dashboard truy xuất chuỗi cung ứng sạch</h1>
            </div>
          </header>
        )}

        <main className="workflow-main" role="tabpanel">
          {activeMainTab === 'overview' && renderOverview()}
          {activeMainTab === 'workflow' && renderWorkflow()}
          {activeMainTab === 'batch-management' && renderBatchManagement()}
          {activeMainTab === 'certificate-management' && renderCertificateManagement()}
        </main>
      </div>
    </div>
  );
}
