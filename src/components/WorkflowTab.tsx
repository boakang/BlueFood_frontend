import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { WorkflowStep, WORKFLOW_STEPS } from './DashboardApp.constants';
import { BatchCreateResult, PartnerRow, BatchTraceItem, CertificateRow, CertificateAttachedBatchRow } from '../types';
import { formatDate } from '../utils/formatDate';

interface WorkflowTabProps {
  workflowStep: WorkflowStep;
  canOpenWorkflowStep: (step: WorkflowStep) => boolean;
  tryOpenWorkflowStep: (step: WorkflowStep) => void;
  // Step 1: Create
  batchCode: string;
  setBatchCode: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  farmPartnerId: number | null;
  setFarmPartnerId: (v: number | null) => void;
  partners: PartnerRow[];
  actor: string;
  handleCreateBatch: () => void;
  createdBatch: BatchCreateResult | null;
  // Step 2: Trace
  traceBatchInput: string;
  setTraceBatchInput: (v: string) => void;
  traceQrInput: string;
  setTraceQrInput: (v: string) => void;
  fromPartnerId: number | null;
  toPartnerId: number | null;
  setToPartnerId: (v: number | null) => void;
  transportPartners: PartnerRow[];
  handleAddEvent: () => void;
  handleLoadTrace: () => void;
  handleLoadTraceByQr: () => void;
  traceStepCompleted: boolean;
  traceRows: BatchTraceItem[];
  latestEvent?: BatchTraceItem;
  // Step 3: Certificate
  selectedExistingCertificateId: number | null;
  setSelectedExistingCertificateId: (v: number | null) => void;
  certificateOptions: Array<{
    certificateId: number;
    certificateCode: string;
    certificateName: string;
  }>;
  handleAttachCertificate: () => void;
  handleLoadBatchesBySelectedCertificate: () => void;
  certificateStepCompleted: boolean;
  selectedCertificateBatches: CertificateAttachedBatchRow[];
  // Step 4: Confirm
  traceToken: string;
  handleConfirmAndResetWorkflow: () => void;
}

export function WorkflowTab(props: WorkflowTabProps) {
  const {
    workflowStep,
    canOpenWorkflowStep,
    tryOpenWorkflowStep,
    batchCode, setBatchCode,
    productName, setProductName,
    farmPartnerId, setFarmPartnerId,
    partners,
    actor,
    handleCreateBatch,
    createdBatch,
    traceBatchInput, setTraceBatchInput,
    traceQrInput, setTraceQrInput,
    fromPartnerId,
    toPartnerId, setToPartnerId,
    transportPartners,
    handleAddEvent,
    handleLoadTrace,
    handleLoadTraceByQr,
    traceStepCompleted,
    traceRows,
    latestEvent,
    selectedExistingCertificateId, setSelectedExistingCertificateId,
    certificateOptions,
    handleAttachCertificate,
    handleLoadBatchesBySelectedCertificate,
    certificateStepCompleted,
    selectedCertificateBatches,
    traceToken,
    handleConfirmAndResetWorkflow
  } = props;

  const toPartnerValue = (value: string) => {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

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
            <input value={actor} readOnly className="input-readonly" />
          </label>
        </div>
        <div className="actions">
          <button onClick={handleCreateBatch}>Tạo batch + QR</button>
          <button className="secondary" disabled={!createdBatch} onClick={() => tryOpenWorkflowStep('trace')}>Sang bước Tra cứu trace</button>
        </div>

        {createdBatch && (
          <div className="result-box">
            <div>
              <span>Batch code</span>
              <strong>{createdBatch.batchCode}</strong>
            </div>
            <div>
              <span>BatchId</span>
              <strong>{createdBatch.batchId}</strong>
            </div>
            <div>
              <span>Trace URL (quét QR)</span>
              <strong style={{ wordBreak: 'break-all' }}>{createdBatch.traceUrl}</strong>
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
              <strong style={{ color: '#ffffff' }}>{row.batchCode} - {row.productName}</strong>
              <span style={{ color: '#ffffff' }}>Trạng thái: {row.currentStatus}</span>
              <small style={{ color: '#ffffff' }}>Gắn lúc {formatDate(row.attachedAt)} bởi {row.attachedBy}</small>
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
        <div className="actions">
          <button onClick={handleConfirmAndResetWorkflow}>Xác nhận</button>
        </div>
      </section>
    );
  }

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
