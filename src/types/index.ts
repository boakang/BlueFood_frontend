export type BatchCreateRequest = {
  batchCode: string;
  productName: string;
  farmPartnerId?: number | null;
  productionDate?: string;
  expiryDate?: string;
  actor: string;
  traceBaseUrl?: string;
};

export type BatchCreateResult = {
  batchId: string;
  batchCode: string;
  qrToken: string;
  traceUrl: string;
};

export type BatchTraceItem = {
  batchCode: string;
  productName: string;
  currentStatus: string;
  qrToken: string;
  traceUrl: string;
  eventNo: number;
  eventType: string;
  eventTime: string;
  fromPartnerName?: string | null;
  toPartnerName?: string | null;
  locationText?: string | null;
  noteText?: string | null;
};

export type CertificateCreateRequest = {
  certificateCode: string;
  certificateName: string;
  issuedBy?: string;
  issuedDate?: string;
  expiredDate?: string;
  fileUrl?: string;
  actor: string;
};

export type CertificateRow = {
  certificateId: number;
  certificateCode: string;
  certificateName: string;
  issuedBy?: string | null;
  issuedDate?: string | null;
  expiredDate?: string | null;
  fileUrl?: string | null;
  attachedAt: string;
  attachedBy: string;
};

export type PartnerRow = {
  partnerId: number;
  partnerType: number;
  partnerCode: string;
  partnerName: string;
  isActive: boolean;
};

export type DashboardChartItem = {
  label: string;
  value: number;
};

export type DashboardOverview = {
  totalBatches: number;
  totalTraceEvents: number;
  totalCertificatesAttached: number;
  eventTypeDistribution: DashboardChartItem[];
  timelineSeries: DashboardChartItem[];
};

export type BatchManagementRow = {
  batchId: string;
  batchCode: string;
  productName: string;
  currentStatus: string;
  createdBy: string;
  createdAt: string;
  farmPartnerName?: string | null;
  eventCount: number;
  lastEventTime?: string | null;
  certificateCount: number;
  certificateName?: string | null;
};

export type CertificateManagementRow = {
  certificateId: number;
  certificateCode: string;
  certificateName: string;
  issuedBy?: string | null;
  issuedDate?: string | null;
  expiredDate?: string | null;
  fileUrl?: string | null;
  createdAt: string;
  attachedBatchCount: number;
  lastAttachedAt?: string | null;
};

export type CertificateAttachedBatchRow = {
  batchId: string;
  batchCode: string;
  productName: string;
  currentStatus: string;
  attachedAt: string;
  attachedBy: string;
};
