import { useState } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Send, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../lib/supabase';
import { generateAIJustification } from '../lib/llm';
import type { DeviationRequest } from '../lib/types';

interface NewRequestProps {
  currentUser: { id: string; username: string; role: string } | null;
  onRequestCreated: () => void;
}

const STEPS = ['Request Details', 'AI Justification', 'Review & Submit'];

export default function NewRequest({ currentUser, onRequestCreated }: NewRequestProps) {
  const [step, setStep] = useState(0);
  const [customerId, setCustomerId] = useState('');
  const [deviationType, setDeviationType] = useState<'SLA Waiver' | 'Billing Credit'>('SLA Waiver');
  const [justification, setJustification] = useState('');
  const [createdRequest, setCreatedRequest] = useState<DeviationRequest | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function callLLMAndSave(requestId: string, devType: string, bizJust: string): Promise<{ success: boolean; data?: DeviationRequest }> {
    try {
      const aiText = await generateAIJustification(devType, bizJust);
      const updated = await api.updateAIJustification(requestId, aiText);
      if (updated.error) {
        return { success: false };
      }
      return { success: true, data: updated };
    } catch {
      return { success: false };
    }
  }

  async function handleCreateAndGenerate() {
    if (!currentUser) return;
    setGenerating(true);
    setAiError(null);
    const req = await api.createRequest({
      customer_id: customerId,
      deviation_type: deviationType,
      business_justification: justification,
      created_by: currentUser.id,
    });
    if (!req.error) {
      const result = await callLLMAndSave(req.id, deviationType, justification);
      if (result.success && result.data) {
        setCreatedRequest(result.data);
      } else {
        setAiError('AI Generation Failed. Please try again or manually enter justification.');
        setCreatedRequest(req);
      }
      setStep(1);
    }
    setGenerating(false);
  }

  async function handleRetryGenerate() {
    if (!createdRequest) return;
    setGenerating(true);
    setAiError(null);
    const result = await callLLMAndSave(createdRequest.id, createdRequest.deviation_type, createdRequest.business_justification);
    if (result.success && result.data) {
      setCreatedRequest(result.data);
    } else {
      setAiError('AI Generation Failed. Please try again or manually enter justification.');
    }
    setGenerating(false);
  }

  async function handleSubmit() {
    if (!currentUser || !createdRequest) return;
    setSubmitting(true);
    await api.submitRequest(createdRequest.id, currentUser.id);
    setSubmitted(true);
    setStep(2);
    setSubmitting(false);
    onRequestCreated();
  }

  function handleReset() {
    setStep(0);
    setCustomerId('');
    setDeviationType('SLA Waiver');
    setJustification('');
    setCreatedRequest(null);
    setSubmitted(false);
  }

  const canProceedStep0 = customerId.trim() && justification.trim();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Deviation Request</h1>
        <p className="text-sm text-slate-500 mt-1">Submit a new service deviation for AI review and approval</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {step === 0 && (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer ID</label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="e.g. CUST-10042"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Deviation Type</label>
              <div className="flex gap-3">
                {(['SLA Waiver', 'Billing Credit'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDeviationType(type)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      deviationType === type
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Justification</label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Provide a detailed business justification for this deviation..."
                rows={5}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleCreateAndGenerate}
                disabled={!canProceedStep0 || generating}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating AI Justification...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate AI Justification
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 1 && createdRequest && (
          <div className="p-6 space-y-5">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Customer ID</span>
                <span className="text-sm font-semibold text-slate-900">{createdRequest.customer_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Deviation Type</span>
                <span className="text-sm font-semibold text-slate-900">{createdRequest.deviation_type}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Business Justification</span>
                <p className="text-sm text-slate-700 mt-1">{createdRequest.business_justification}</p>
              </div>
            </div>

            {aiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900 mb-1">AI Generation Failed</h3>
                    <p className="text-sm text-red-700">{aiError}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleRetryGenerate}
                        disabled={generating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-red-200">
                  <label className="block text-xs font-medium text-red-800 mb-1.5">Manually enter justification</label>
                  <textarea
                    value={createdRequest.ai_justification || ''}
                    onChange={(e) => setCreatedRequest({ ...createdRequest, ai_justification: e.target.value })}
                    placeholder="Enter justification manually..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
                  />
                </div>
              </div>
            )}

            {!aiError && createdRequest.ai_justification && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">AI-Generated Justification</h3>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{createdRequest.ai_justification}</p>
              </div>
            )}

            <div className="pt-2 flex justify-between">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-100 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!createdRequest.ai_justification?.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review & Submit
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-5">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Request Submitted</h3>
                <p className="text-sm text-slate-500 mb-6">Your deviation request has been submitted for approval.</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Another Request
                </button>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Review Before Submitting</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Customer ID</p>
                      <p className="text-sm font-medium text-slate-900">{createdRequest?.customer_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Deviation Type</p>
                      <p className="text-sm font-medium text-slate-900">{createdRequest?.deviation_type}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Business Justification</p>
                    <p className="text-sm text-slate-700">{createdRequest?.business_justification}</p>
                  </div>
                  {createdRequest?.ai_justification && (
                    <div>
                      <p className="text-xs text-slate-500">AI Justification</p>
                      <p className="text-sm text-blue-700 whitespace-pre-line">{createdRequest.ai_justification}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-100 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit for Approval
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
