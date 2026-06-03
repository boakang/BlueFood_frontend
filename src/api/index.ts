import type {
  BatchManagementRow,
  CertificateAttachedBatchRow,
  BatchCreateRequest,
  BatchCreateResult,
  BatchTraceItem,
  CertificateManagementRow,
  CertificateCreateRequest,
  CertificateRow,
  DashboardOverview,
  PartnerRow
} from '../types';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-BlueFood-UserId': token } : {}),
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function createBatch(payload: BatchCreateRequest) {
  return request<BatchCreateResult>('/api/batches', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function addBatchEvent(batchCode: string, payload: { eventType: string; fromPartnerId?: number | null; toPartnerId?: number | null; locationText?: string; noteText?: string; actor: string; }) {
  return request<void>(`/api/batches/${encodeURIComponent(batchCode)}/events`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getBatchTrace(batchCode: string) {
  return request<BatchTraceItem[]>(`/api/batches/${encodeURIComponent(batchCode)}/trace`);
}

export function getTraceByQr(qrToken: string) {
  return request<BatchTraceItem[]>(`/api/trace/${encodeURIComponent(qrToken)}`);
}

export function createCertificate(payload: CertificateCreateRequest) {
  return request<{ certificateId: number }>('/api/certificates', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function attachCertificate(batchCode: string, certificateId: number, actor: string) {
  return request<void>(`/api/batches/${encodeURIComponent(batchCode)}/certificates`, {
    method: 'POST',
    body: JSON.stringify({ certificateId, actor })
  });
}

export function getBatchCertificates(batchCode: string) {
  return request<CertificateRow[]>(`/api/batches/${encodeURIComponent(batchCode)}/certificates`);
}

export function getPartners(partnerType?: number, onlyActive = true) {
  const params = new URLSearchParams();
  if (typeof partnerType === 'number') {
    params.set('partnerType', String(partnerType));
  }

  params.set('onlyActive', String(onlyActive));
  return request<PartnerRow[]>(`/api/partners?${params.toString()}`);
}

export function getDashboardOverview() {
  return request<DashboardOverview>('/api/dashboard/overview');
}

export function logout() {
  return request<{ message: string }>('/api/auth/logout', {
    method: 'POST'
  });
}

export function getManagedBatches(keyword?: string, take = 100) {
  const params = new URLSearchParams();
  if (keyword?.trim()) {
    params.set('keyword', keyword.trim());
  }

  params.set('take', String(take));
  return request<BatchManagementRow[]>(`/api/management/batches?${params.toString()}`);
}

export function getManagedCertificates(keyword?: string, take = 100) {
  const params = new URLSearchParams();
  if (keyword?.trim()) {
    params.set('keyword', keyword.trim());
  }

  params.set('take', String(take));
  return request<CertificateManagementRow[]>(`/api/management/certificates?${params.toString()}`);
}

export function getBatchesByCertificateId(certificateId: number) {
  return request<CertificateAttachedBatchRow[]>(`/api/management/certificates/${certificateId}/batches`);
}

export function getQrCodeImageUrl(qrToken: string) {
  return `${baseUrl}/api/trace/${encodeURIComponent(qrToken)}/qrcode`;
}

export function getPendingUsers() {
  return request<Array<{ userId: number; username: string; email?: string | null; role?: string | null; status: string; createdAt: string }>>('/api/admin/users/pending');
}

export function approveUser(username: string) {
  return request<{ message: string }>(`/api/admin/users/${encodeURIComponent(username)}/approve`, {
    method: 'POST'
  });
}
