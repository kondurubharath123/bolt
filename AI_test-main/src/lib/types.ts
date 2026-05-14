export type UserRole = 'REQUESTOR' | 'APPROVER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export type DeviationType = 'SLA Waiver' | 'Billing Credit';
export type RequestStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';

export interface DeviationRequest {
  id: string;
  customer_id: string;
  deviation_type: DeviationType;
  business_justification: string;
  ai_justification: string | null;
  status: RequestStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  users?: { username: string; role: string };
  logs?: ApprovalLog[];
}

export interface ApprovalLog {
  id: string;
  request_id: string;
  actor: string;
  action: string;
  previous_state: string;
  new_state: string;
  comments: string | null;
  created_at: string;
  users?: { username: string };
  deviation_requests?: { customer_id: string; deviation_type: string };
}
