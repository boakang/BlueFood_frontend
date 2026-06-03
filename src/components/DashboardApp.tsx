import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
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
  getTraceByQr,
  logout
} from '../api';

import {
  MainTab,
  WorkflowStep,
  ChartPoint,
  MAIN_TABS,
  MAIN_TAB_PATHS,
  WORKFLOW_STEPS,
  defaultActor,
  getMainTabFromPath
} from './DashboardApp.constants';

import { OverviewTab } from './OverviewTab';
import { WorkflowTab } from './WorkflowTab';
import { BatchManagementTab } from './BatchManagementTab';
import { CertificateManagementTab } from './CertificateManagementTab';
import { AdminUsersPage } from './AdminUsersPage';

import {
  BatchCreateResult,
  BatchManagementRow,
  BatchTraceItem,
  CertificateAttachedBatchRow,
  CertificateManagementRow,
  CertificateRow,
  DashboardOverview,
  PartnerRow
} from '../types';

export function DashboardApp() {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy username từ localStorage (sau khi đăng nhập thành công)
  const username = localStorage.getItem('username') || defaultActor;
  const currentRole = localStorage.getItem('role') || 'User';

  const [status, setStatus] = useState('Sẵn sàng');
  const [batchCode, setBatchCode] = useState(`BF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`);
  const [productName, setProductName] = useState('');
  const [actor] = useState(username);
  const [traceToken, setTraceToken] = useState('');
  const [traceRows, setTraceRows] = useState<BatchTraceItem[]>([]);
  const [createdBatch, setCreatedBatch] = useState<BatchCreateResult | null>(null);
  const [certCode, setCertCode] = useState(`CERT-${String(Date.now()).slice(-8)}`);
  const [certName, setCertName] = useState('VietGAP');
  const [certIssuedBy, setCertIssuedBy] = useState('');
  const [certificateId, setCertificateId] = useState<number | null>(null);
  const [selectedExistingCertificateId, setSelectedExistingCertificateId] = useState<number | null>(null);
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

  const [timelineGranularity, setTimelineGranularity] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  const activeMainTab = useMemo(() => getMainTabFromPath(location.pathname), [location.pathname]);
  const visibleTabs = useMemo(() => MAIN_TABS.filter((tab) => tab.id !== 'admin-users' || currentRole === 'Admin'), [currentRole]);

  const openMainTab = useCallback((tabId: MainTab) => {
    navigate(MAIN_TAB_PATHS[tabId]);
  }, [navigate, location.pathname]);

  const loadDashboardOverviewData = useCallback(async (setStatusOnError = true) => {
    try {
      const data = await getDashboardOverview();
      setDashboardOverview(data);
    } catch (error) {
      if (setStatusOnError) setStatus(`Lỗi tải dashboard: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const canOpenWorkflowStep = useCallback((step: WorkflowStep): boolean => {
    if (step === 'create') return true;
    if (step === 'trace') return createdBatch !== null;
    if (step === 'certificate') return traceStepCompleted;
    if (step === 'confirm') return certificateStepCompleted;
    return false;
  }, [createdBatch, traceStepCompleted, certificateStepCompleted]);

  const tryOpenWorkflowStep = useCallback((step: WorkflowStep) => {
    if (canOpenWorkflowStep(step)) setWorkflowStep(step);
  }, [canOpenWorkflowStep]);

  const handleConfirmAndResetWorkflow = useCallback(() => {
    const nextBatchCode = `BF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    setBatchCode(nextBatchCode);
    setProductName('');
    setCreatedBatch(null);
    setTraceToken('');
    setTraceRows([]);
    setTraceBatchInput(nextBatchCode);
    setTraceQrInput('');
    setSelectedExistingCertificateId(null);
    setSelectedCertificateBatches([]);
    setTraceStepCompleted(false);
    setCertificateStepCompleted(false);
    setWorkflowStep('create');
    setStatus('Sẵn sàng');
  }, []);

  const chartEventTypeData = useMemo<ChartPoint[]>(() => 
    (dashboardOverview?.eventTypeDistribution || []).map(item => ({
      label: item.label,
      value: item.value
    })),
    [dashboardOverview]
  );

  const chartTimelineData = useMemo<ChartPoint[]>(() => {
    return (dashboardOverview?.timelineSeries || []).map(item => ({
      label: item.label,
      value: item.value
    }));
  }, [dashboardOverview]);

  const certificateCoverage = useMemo(() => ({
    complete: dashboardOverview?.totalCertificatesAttached ?? 0,
    total: dashboardOverview?.totalBatches ?? 0
  }), [dashboardOverview]);

  const transportPartners = useMemo(() => partners.filter(p => p.partnerType === 2), [partners]);

  const latestEvent = useMemo(() => traceRows[traceRows.length - 1], [traceRows]);

  const certificateOptions = useMemo(() => managedCertificates.map(c => ({
    certificateId: c.certificateId,
    certificateCode: c.certificateCode,
    certificateName: c.certificateName
  })), [managedCertificates]);


  // useCallback cho loadManagedBatches và loadManagedCertificates
  const loadManagedBatches = useCallback(async (keyword = batchKeyword, setStatusOnError = true) => {
    try {
      const rows = await getManagedBatches(keyword, 200);
      setManagedBatches(rows);
    } catch (error) {
      if (setStatusOnError) setStatus(`Lỗi tải quản lý lô: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [batchKeyword]);

  const loadManagedCertificates = useCallback(async (keyword = certificateKeyword, setStatusOnError = true) => {
    try {
      const rows = await getManagedCertificates(keyword, 200);
      setManagedCertificates(rows);
    } catch (error) {
      if (setStatusOnError) setStatus(`Lỗi tải quản lý chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [certificateKeyword]);

  useEffect(() => {
    let isMounted = true;
    async function loadPartnersData() {
      try {
        const rows = await getPartners();
        if (!isMounted) return;
        setPartners(rows);
        const defaultFarm = rows.find((partner) => partner.partnerType === 1)?.partnerId ?? null;
        const defaultTransport = rows.find((partner) => partner.partnerType === 2)?.partnerId ?? null;
        const fallback = rows[0]?.partnerId ?? null;
        setFarmPartnerId(defaultFarm ?? fallback);
        setFromPartnerId(defaultFarm ?? fallback);
        setToPartnerId(defaultTransport ?? fallback);
      } catch (error) {
        if (!isMounted) return;
        setStatus(`Lỗi tải partner: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    loadDashboardOverviewData();
    loadManagedBatches('', false);
    loadManagedCertificates('', false);
    loadPartnersData();
    return () => { isMounted = false; };
  }, [loadDashboardOverviewData, loadManagedBatches, loadManagedCertificates]);

  useEffect(() => {
    if (activeMainTab !== 'workflow') return;
    if (!canOpenWorkflowStep(workflowStep)) setWorkflowStep('create');
  }, [activeMainTab, workflowStep, createdBatch, traceStepCompleted, certificateStepCompleted]);

  useEffect(() => {
    if (activeMainTab === 'admin-users' && currentRole !== 'Admin') {
      navigate(MAIN_TAB_PATHS.overview, { replace: true });
    }
  }, [activeMainTab, currentRole, navigate]);

  useEffect(() => { setFromPartnerId(farmPartnerId); }, [farmPartnerId]);

  async function handleCreateBatchAction() {
    if (farmPartnerId === null) {
      setStatus('Vui lòng chọn partner nông trại trước khi tạo lô.');
      return;
    }
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
      await Promise.all([loadDashboardOverviewData(false), loadManagedBatches(batchKeyword, false)]);
      setStatus('Sẵn sàng');
      navigate(MAIN_TAB_PATHS.workflow);
    } catch (error) {
      setStatus(`Lỗi tạo lô: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleAddEventAction() {
    if (fromPartnerId === null || toPartnerId === null) {
      setStatus('Vui lòng chọn partner From/To trước khi ghi nhận SHIPPED.');
      return;
    }
    try {
      await addBatchEvent(traceBatchInput, {
        eventType: 'SHIPPED',
        fromPartnerId,
        toPartnerId,
        locationText: 'Dong Thap',
        noteText: 'Khoi hanh',
        actor
      });
      await Promise.all([loadDashboardOverviewData(false), loadManagedBatches(batchKeyword, false)]);
      setStatus('Sẵn sàng');
    } catch (error) {
      setStatus(`Lỗi thêm event: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleLoadTraceAction() {
    try {
      const rows = await getBatchTrace(traceBatchInput);
      setTraceRows(rows);
      if (rows.length > 0) setTraceStepCompleted(true);
      setStatus('Sẵn sàng');
    } catch (error) {
      setStatus(`Lỗi tải trace: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleLoadTraceByQrAction() {
    try {
      const rows = await getTraceByQr(traceQrInput);
      setTraceRows(rows);
      if (rows.length > 0) setTraceStepCompleted(true);
      setStatus('Sẵn sàng');
    } catch (error) {
      setStatus(`Lỗi QR trace: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleCreateCertificateAction() {
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
      await Promise.all([loadDashboardOverviewData(false), loadManagedCertificates(certificateKeyword, false)]);
      setStatus('Sẵn sàng');
    } catch (error) {
      if (error instanceof Error && error.message.includes('đã tồn tại')) {
        const existing = managedCertificates.find(item => item.certificateCode.trim().toLowerCase() === certCode.trim().toLowerCase());
        if (existing) {
          setSelectedExistingCertificateId(existing.certificateId);
          setCertificateId(existing.certificateId);
          setStatus('Sẵn sàng');
          return;
        }
      }
      setStatus(`Lỗi tạo chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleAttachCertificateAction() {
    const targetCertificateId = selectedExistingCertificateId ?? certificateId;
    if (!targetCertificateId) return setStatus('Vui lòng chọn chứng chỉ.');
    try {
      await attachCertificate(traceBatchInput, targetCertificateId, actor);
      const rows = await getBatchCertificates(traceBatchInput);
      setCertificateStepCompleted(rows.length > 0);
      await Promise.all([
        handleLoadBatchesBySelectedCertificateAction(targetCertificateId, false),
        loadDashboardOverviewData(false),
        loadManagedBatches(batchKeyword, false),
        loadManagedCertificates(certificateKeyword, false)
      ]);
      setStatus('Sẵn sàng');
    } catch (error) {
      setStatus(`Lỗi gắn chứng chỉ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleLoadBatchesBySelectedCertificateAction(certificateIdOverride?: number, setStatusOnError = true) {
    const targetCertificateId = certificateIdOverride ?? selectedExistingCertificateId;
    if (!targetCertificateId) return;
    try {
      const rows = await getBatchesByCertificateId(targetCertificateId);
      setSelectedCertificateBatches(rows);
      setStatus('Sẵn sàng');
    } catch (error) {
      if (setStatusOnError) setStatus(`Lỗi: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleToggleBatchDetailsAction(row: BatchManagementRow) {
    if (expandedBatchId === row.batchId) return setExpandedBatchId(null);
    setExpandedBatchId(row.batchId);
    setExpandedBatchLoadingId(row.batchId);
    try {
      const traceRowsData = await getBatchTrace(row.batchCode);
      const latestRow = traceRowsData[traceRowsData.length - 1];
      const firstRow = traceRowsData[0];
      setBatchDetailsById(prev => ({
        ...prev,
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
      setStatus(`Lỗi chi tiết lô: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setExpandedBatchLoadingId(curr => curr === row.batchId ? null : curr);
    }
  }

  async function handleLogoutAction() {
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
    try {
      await logout();
    } catch {
      // Ignored: Logout failure shouldn't block local cleanup
    }
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId'); // Assuming userId is stored too
    localStorage.removeItem('role');
    localStorage.removeItem('status');
    navigate('/login');
  }

  return (
    <div className="dashboard-frame">
      <aside className="left-sidebar" aria-label="Main navigation tabs">
        <div className="sidebar-brand">BlueFood Traceability</div>
        <div className="sidebar-menu" role="tablist" aria-orientation="vertical">
          {visibleTabs.map((tab) => {
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

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogoutAction}>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="shell">
        <div className="ambient ambient-a" />
        <div className="ambient ambient-b" />

        {activeMainTab === 'overview' && (
          <header className="hero">
            <div>
              <span className="eyebrow">BlueFood Traceability</span>
              <h1 className="one-line-title">Dashboard truy xuất chuỗi cung ứng sạch</h1>
            </div>
          </header>
        )}

        <main className="workflow-main" role="tabpanel">
          {activeMainTab === 'overview' && (
            <OverviewTab
              chartEventTypeData={chartEventTypeData}
              certificateCoverage={certificateCoverage}
              totalBatches={dashboardOverview?.totalBatches ?? 0}
              totalTraceEvents={dashboardOverview?.totalTraceEvents ?? 0}
              totalCertificatesAttached={dashboardOverview?.totalCertificatesAttached ?? 0}
            />
          )}
          {activeMainTab === 'workflow' && (
            <WorkflowTab
              workflowStep={workflowStep}
              canOpenWorkflowStep={canOpenWorkflowStep}
              tryOpenWorkflowStep={tryOpenWorkflowStep}
              batchCode={batchCode} setBatchCode={setBatchCode}
              productName={productName} setProductName={setProductName}
              farmPartnerId={farmPartnerId} setFarmPartnerId={setFarmPartnerId}
              partners={partners}
              actor={actor}
              handleCreateBatch={handleCreateBatchAction}
              createdBatch={createdBatch}
              traceBatchInput={traceBatchInput} setTraceBatchInput={setTraceBatchInput}
              traceQrInput={traceQrInput} setTraceQrInput={setTraceQrInput}
              fromPartnerId={fromPartnerId}
              toPartnerId={toPartnerId} setToPartnerId={setToPartnerId}
              transportPartners={transportPartners}
              handleAddEvent={handleAddEventAction}
              handleLoadTrace={handleLoadTraceAction}
              handleLoadTraceByQr={handleLoadTraceByQrAction}
              traceStepCompleted={traceStepCompleted}
              traceRows={traceRows}
              latestEvent={latestEvent}
              selectedExistingCertificateId={selectedExistingCertificateId}
              setSelectedExistingCertificateId={setSelectedExistingCertificateId}
              certificateOptions={certificateOptions}
              handleAttachCertificate={handleAttachCertificateAction}
              handleLoadBatchesBySelectedCertificate={() => handleLoadBatchesBySelectedCertificateAction()}
              certificateStepCompleted={certificateStepCompleted}
              selectedCertificateBatches={selectedCertificateBatches}
              traceToken={traceToken}
              handleConfirmAndResetWorkflow={handleConfirmAndResetWorkflow}
            />
          )}
          {activeMainTab === 'batch-management' && (
            <BatchManagementTab
              managedBatches={managedBatches}
              batchKeyword={batchKeyword}
              setBatchKeyword={setBatchKeyword}
              loadManagedBatches={loadManagedBatches}
              batchDetailsById={batchDetailsById}
              expandedBatchId={expandedBatchId}
              handleToggleBatchDetails={handleToggleBatchDetailsAction}
              expandedBatchLoadingId={expandedBatchLoadingId}
            />
          )}
          {activeMainTab === 'certificate-management' && (
            <CertificateManagementTab
              certCode={certCode} setCertCode={setCertCode}
              certName={certName} setCertName={setCertName}
              certIssuedBy={certIssuedBy} setCertIssuedBy={setCertIssuedBy}
              handleCreateCertificate={handleCreateCertificateAction}
              certificateKeyword={certificateKeyword} setCertificateKeyword={setCertificateKeyword}
              loadManagedCertificates={loadManagedCertificates}
              managedCertificates={managedCertificates}
            />
          )}
          {activeMainTab === 'admin-users' && <AdminUsersPage />}
        </main>
        
        {status !== 'Sẵn sàng' && (
          <div className="status-toast" onClick={() => setStatus('Sẵn sàng')}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
