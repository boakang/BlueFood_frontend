import type {
  BatchCreateRequest,
  BatchCreateResult,
  BatchTraceItem,
  CertificateCreateRequest,
  CertificateRow
} from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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

export function getQrCodeImageUrl(qrToken: string) {
  return `${baseUrl}/api/trace/${encodeURIComponent(qrToken)}/qrcode`;
}
