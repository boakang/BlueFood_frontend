import React, { Fragment } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BatchManagementRow } from '../types';
import { formatDate } from '../utils/formatDate';

interface BatchManagementTabProps {
  managedBatches: BatchManagementRow[];
  batchKeyword: string;
  setBatchKeyword: (v: string) => void;
  loadManagedBatches: (keyword?: string) => void;
  batchDetailsById: Record<string, any>;
  expandedBatchId: string | null;
  handleToggleBatchDetails: (row: BatchManagementRow) => void;
  expandedBatchLoadingId: string | null;
}

export function BatchManagementTab({
  managedBatches,
  batchKeyword,
  setBatchKeyword,
  loadManagedBatches,
  batchDetailsById,
  expandedBatchId,
  handleToggleBatchDetails,
  expandedBatchLoadingId
}: BatchManagementTabProps) {
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
        <button className="secondary" onClick={() => { setBatchKeyword(''); loadManagedBatches(''); }}>Làm mới</button>
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
                        {!isLoadingDetail && detail && (() => {
                          // Use traceUrl from API which contains the real LAN IP (e.g. 192.168.x.x:5085)
                          // so QR code works when scanned from phone on same WiFi
                          const backendTraceUrl = (detail.traceUrl && detail.traceUrl.startsWith('http'))
                            ? detail.traceUrl
                            : detail.qrToken
                              ? `http://${window.location.hostname}:5085/t/${encodeURIComponent(detail.qrToken)}`
                              : null;
                          return (
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
                              {backendTraceUrl && (
                                <div className="batch-detail-qr">
                                  <span>QR Code truy xuất của lô</span>
                                  <div className="qr-image">
                                    <QRCodeSVG value={backendTraceUrl} size={160} marginSize={2} includeMargin />
                                  </div>
                                  <small style={{ wordBreak: 'break-all' }}>{backendTraceUrl}</small>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
