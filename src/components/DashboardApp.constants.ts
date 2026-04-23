

export type MainTab = 'overview' | 'workflow' | 'batch-management' | 'certificate-management';

export type WorkflowStep = 'create' | 'trace' | 'certificate' | 'confirm';

export interface ChartPoint {
  label: string;
  value: number;
}

export const MAIN_TABS: { id: MainTab; title: string }[] = [
  { id: 'overview', title: 'Tổng quan' },
  { id: 'workflow', title: 'Tạo mới lô hàng' },
  { id: 'batch-management', title: 'Quản lý lô hàng' },
  { id: 'certificate-management', title: 'Quản lý chứng chỉ' }
];

export const MAIN_TAB_PATHS: Record<MainTab, string> = {
  overview: '/dashboard/overview',
  workflow: '/dashboard/workflow',
  'batch-management': '/dashboard/batches',
  'certificate-management': '/dashboard/certificates'
};

export const WORKFLOW_STEPS: { id: WorkflowStep; title: string; description: string }[] = [
  { id: 'create', title: 'Tạo lô', description: 'Tạo batch & QR code' },
  { id: 'trace', title: 'Truy xuất', description: 'Cập nhật lộ trình' },
  { id: 'certificate', title: 'Chứng chỉ', description: 'Gắn chứng chỉ' },
  { id: 'confirm', title: 'Xác nhận', description: 'Hoàn tất quy trình' }
];

export const defaultActor = 'Admin';

export function getMainTabFromPath(path: string): MainTab {
  if (path.includes('/dashboard/overview')) return 'overview';
  if (path.includes('/dashboard/workflow')) return 'workflow';
  if (path.includes('/dashboard/batches')) return 'batch-management';
  if (path.includes('/dashboard/certificates')) return 'certificate-management';
  return 'overview';
}
