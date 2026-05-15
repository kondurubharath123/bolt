import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FUNCTION_URL = `${supabaseUrl}/functions/v1/deviation-api`;

const headers = {
  'Authorization': `Bearer ${supabaseAnonKey}`,
  'Content-Type': 'application/json',
};

export const api = {
  async getUsers() {
    const res = await fetch(`${FUNCTION_URL}/users`, { headers });
    return res.json();
  },

  async getRequests(status?: string) {
    const url = status ? `${FUNCTION_URL}/requests?status=${encodeURIComponent(status)}` : `${FUNCTION_URL}/requests`;
    const res = await fetch(url, { headers });
    return res.json();
  },

  async getRequest(id: string) {
    const res = await fetch(`${FUNCTION_URL}/requests/${id}`, { headers });
    return res.json();
  },

  async createRequest(data: { customer_id: string; deviation_type: string; business_justification: string; created_by: string }) {
    const res = await fetch(`${FUNCTION_URL}/requests`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async generateAIJustification(id: string) {
    const res = await fetch(`${FUNCTION_URL}/requests/${id}/generate-ai`, {
      method: 'POST',
      headers,
    });
    return res.json();
  },

  async updateAIJustification(id: string, aiJustification: string) {
    const res = await fetch(`${FUNCTION_URL}/requests/${id}/update-ai`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ai_justification: aiJustification }),
    });
    return res.json();
  },

  async submitRequest(id: string, actor: string) {
    const res = await fetch(`${FUNCTION_URL}/requests/${id}/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ actor }),
    });
    return res.json();
  },

  async approveRequest(id: string, actor: string, comments?: string) {
    const res = await fetch(`${FUNCTION_URL}/requests/${id}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ actor, comments }),
    });
    return res.json();
  },

  async rejectRequest(id: string, actor: string, comments: string) {
    const res = await fetch(`${FUNCTION_URL}/requests/${id}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ actor, comments }),
    });
    return res.json();
  },

  async getLogs() {
    const res = await fetch(`${FUNCTION_URL}/logs`, { headers });
    return res.json();
  },
};
