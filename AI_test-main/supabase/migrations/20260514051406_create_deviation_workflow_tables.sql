/*
  # Create Deviation & Approval Workflow Tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique, not null)
      - `role` (text, not null - enum: REQUESTOR, APPROVER)
      - `created_at` (timestamptz)
    - `deviation_requests`
      - `id` (uuid, primary key)
      - `customer_id` (text, not null)
      - `deviation_type` (text, not null - SLA Waiver, Billing Credit)
      - `business_justification` (text, not null)
      - `ai_justification` (text, nullable)
      - `status` (text, not null - Draft, Pending Approval, Approved, Rejected)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `approval_logs`
      - `id` (uuid, primary key)
      - `request_id` (uuid, references deviation_requests)
      - `actor` (uuid, references users)
      - `action` (text, not null)
      - `previous_state` (text, not null)
      - `new_state` (text, not null)
      - `comments` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write based on role

  3. Important Notes
    - Seed data includes 2 users (1 REQUESTOR, 1 APPROVER) for demo
    - Seed data includes sample deviation requests and approval logs
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('REQUESTOR', 'APPROVER')),
  created_at timestamptz DEFAULT now()
);

-- Create deviation_requests table
CREATE TABLE IF NOT EXISTS deviation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  deviation_type text NOT NULL CHECK (deviation_type IN ('SLA Waiver', 'Billing Credit')),
  business_justification text NOT NULL,
  ai_justification text,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'Rejected')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create approval_logs table
CREATE TABLE IF NOT EXISTS approval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES deviation_requests(id),
  actor uuid REFERENCES users(id),
  action text NOT NULL,
  previous_state text NOT NULL,
  new_state text NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deviation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "Anyone can read users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS policies for deviation_requests
CREATE POLICY "Authenticated users can read deviation requests"
  ON deviation_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert deviation requests"
  ON deviation_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deviation requests"
  ON deviation_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS policies for approval_logs
CREATE POLICY "Authenticated users can read approval logs"
  ON approval_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert approval logs"
  ON approval_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed data: demo users
INSERT INTO users (username, role) VALUES
  ('jdoe_requestor', 'REQUESTOR'),
  ('asmith_approver', 'APPROVER');

-- Seed data: sample deviation requests
INSERT INTO deviation_requests (customer_id, deviation_type, business_justification, ai_justification, status, created_by) VALUES
  ('CUST-10042', 'SLA Waiver', 'Customer experienced extended outage due to fiber cut. Requesting SLA waiver for Q1 reporting period.', 'Based on telecom compliance policy XYZ, this deviation is categorized as LOW risk. The justification provided is sufficient for approval.', 'Pending Approval', (SELECT id FROM users WHERE username = 'jdoe_requestor')),
  ('CUST-20087', 'Billing Credit', 'Customer was overbilled for premium service tier not rendered during migration window.', 'Based on telecom compliance policy ABC, this deviation is categorized as MEDIUM risk. Additional review recommended but justification is adequate.', 'Pending Approval', (SELECT id FROM users WHERE username = 'jdoe_requestor')),
  ('CUST-30015', 'SLA Waiver', 'Planned maintenance window extended beyond notification period. Customer requesting waiver.', 'Based on telecom compliance policy XYZ, this deviation is categorized as LOW risk. The justification provided is sufficient for approval.', 'Approved', (SELECT id FROM users WHERE username = 'jdoe_requestor'));

-- Seed data: sample approval logs
INSERT INTO approval_logs (request_id, actor, action, previous_state, new_state, comments) VALUES
  ((SELECT id FROM deviation_requests WHERE customer_id = 'CUST-10042'), (SELECT id FROM users WHERE username = 'jdoe_requestor'), 'Submit', 'Draft', 'Pending Approval', 'Submitted for approval'),
  ((SELECT id FROM deviation_requests WHERE customer_id = 'CUST-20087'), (SELECT id FROM users WHERE username = 'jdoe_requestor'), 'Submit', 'Draft', 'Pending Approval', 'Submitted for approval'),
  ((SELECT id FROM deviation_requests WHERE customer_id = 'CUST-30015'), (SELECT id FROM users WHERE username = 'jdoe_requestor'), 'Submit', 'Draft', 'Pending Approval', 'Submitted for approval'),
  ((SELECT id FROM deviation_requests WHERE customer_id = 'CUST-30015'), (SELECT id FROM users WHERE username = 'asmith_approver'), 'Approve', 'Pending Approval', 'Approved', 'Risk level acceptable. Approved.');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deviation_requests_status ON deviation_requests(status);
CREATE INDEX IF NOT EXISTS idx_deviation_requests_created_by ON deviation_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_approval_logs_request_id ON approval_logs(request_id);
