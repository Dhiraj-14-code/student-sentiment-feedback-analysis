import React, { useEffect, useState } from 'react';
import {
  getAnalyticsOverview, getAnalyticsSentiment, getAnalyticsTopics,
  getEmergingIssues, getAspectHealth, getIssues,
  updateIssueStatus, recordIntervention, getIssueFeedbacks
} from '../api';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import {
  MessageSquare, ThumbsUp, ThumbsDown, Star, AlertTriangle,
  TrendingUp, Layers, ShieldAlert, CheckCircle, XCircle,
  ChevronRight, X, ClipboardList, Zap
} from 'lucide-react';

const PRIORITY_COLORS = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  LOW: 'bg-green-100 text-green-700 border-green-300',
};

const STATUS_FLOW = ["Detected", "Under Review", "Action Planned", "Action Implemented", "Monitoring", "Resolved"];

const EVIDENCE_COLORS = {
  Strong: 'text-red-600 bg-red-50 border-red-200',
  Moderate: 'text-orange-600 bg-orange-50 border-orange-200',
  Weak: 'text-gray-600 bg-gray-50 border-gray-200',
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [sentiment, setSentiment] = useState([]);
  const [topics, setTopics] = useState([]);
  const [emerging, setEmerging] = useState(null);
  const [aspectHealth, setAspectHealth] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueFeedbacks, setIssueFeedbacks] = useState(null);
  const [interventionForm, setInterventionForm] = useState({ show: false, action_taken: '', notes: '' });
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [ovRes, senRes, topRes, emRes, aspRes, issRes] = await Promise.all([
        getAnalyticsOverview(), getAnalyticsSentiment(), getAnalyticsTopics(),
        getEmergingIssues(), getAspectHealth(), getIssues()
      ]);
      setOverview(ovRes.data);
      setSentiment(senRes.data);
      setTopics(topRes.data);
      setEmerging(emRes.data);
      setAspectHealth(aspRes.data);
      setIssues(issRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openIssue = async (issue) => {
    setSelectedIssue(issue);
    try {
      const res = await getIssueFeedbacks(issue.id);
      setIssueFeedbacks(res.data);
    } catch (e) {}
  };

  const handleStatusUpdate = async (id, status) => {
    await updateIssueStatus(id, status, '');
    fetchAll();
    if (selectedIssue?.id === id) {
      setSelectedIssue(prev => ({ ...prev, status }));
    }
  };

  const handleIntervention = async (issueId) => {
    await recordIntervention(issueId, {
      action_taken: interventionForm.action_taken,
      notes: interventionForm.notes
    });
    setInterventionForm({ show: false, action_taken: '', notes: '' });
    fetchAll();
  };

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <Zap className="text-indigo-600" size={28} /> EduPulse AI
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Evidence-Based Student Experience Intelligence Dashboard</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['overview', 'issues', 'aspects', 'charts'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards always visible */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Feedback', value: overview.total_feedback, icon: <MessageSquare size={22} />, color: 'blue' },
            { label: 'Positive %', value: `${overview.positive_pct}%`, icon: <ThumbsUp size={22} />, color: 'emerald' },
            { label: 'Negative %', value: `${overview.negative_pct}%`, icon: <ThumbsDown size={22} />, color: 'rose' },
            { label: 'Avg Rating', value: `${overview.avg_rating}/5`, icon: <Star size={22} />, color: 'amber' },
            { label: 'Detailed Feedback', value: `${overview.detailed_pct}%`, icon: <ClipboardList size={22} />, color: 'purple' },
            { label: 'Active Issues', value: overview.active_issues, icon: <Layers size={22} />, color: 'indigo' },
            { label: 'High/Critical', value: overview.high_critical_issues, icon: <ShieldAlert size={22} />, color: 'red' },
            { label: 'Neutral %', value: `${overview.neutral_pct}%`, icon: <CheckCircle size={22} />, color: 'gray' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl bg-${kpi.color}-100 text-${kpi.color}-600 flex items-center justify-center flex-shrink-0`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">{kpi.label}</p>
                <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Emerging Issues */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-red-500" size={22} />
              <h2 className="text-lg font-bold text-gray-900">Emerging Issues</h2>
            </div>
            {!emerging || emerging.status === 'insufficient_data' ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl text-gray-400">
                <AlertTriangle className="mx-auto mb-2 opacity-40" size={32} />
                <p className="font-medium">Insufficient historical data</p>
                <p className="text-xs mt-1">More feedback across time periods needed to detect trends.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emerging.emerging_issues?.length === 0 && (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-2xl">
                    <CheckCircle className="mx-auto mb-1 opacity-40" size={28} />
                    <p>No emerging issues detected.</p>
                  </div>
                )}
                {emerging.emerging_issues?.map((iss, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                    <div>
                      <p className="font-bold text-gray-900">{iss.topic}</p>
                      <p className="text-sm text-gray-500">{iss.current_count} responses · {iss.neg_pct}% negative</p>
                      <p className="text-xs text-gray-400">Previous period: {iss.previous_count}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-red-600 font-extrabold text-xl">+{iss.pct_change}%</span>
                      <p className="text-xs text-gray-500 mt-1">{iss.dominant_sentiment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Issues List */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="text-orange-500" size={22} />
              <h2 className="text-lg font-bold text-gray-900">Detected Issues</h2>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {issues.length === 0 && (
                <p className="text-center text-gray-400 py-8">No issues detected yet. Submit more feedback to enable grouping.</p>
              )}
              {issues.map(iss => (
                <button key={iss.id} onClick={() => { openIssue(iss); setTab('issues'); }}
                  className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 text-sm">{iss.name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[iss.priority] || 'bg-gray-100 text-gray-500'}`}>
                      {iss.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{iss.related_feedback_count} responses</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${EVIDENCE_COLORS[iss.evidence_strength] || ''}`}>{iss.evidence_strength} Evidence</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Issues Detail */}
      {tab === 'issues' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issues List */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-2 max-h-[600px] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">All Issues</h2>
            {issues.length === 0 && <p className="text-center text-gray-400 py-8">No issues detected yet.</p>}
            {issues.map(iss => (
              <button key={iss.id} onClick={() => openIssue(iss)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedIssue?.id === iss.id ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 hover:bg-indigo-50 border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 text-sm">{iss.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[iss.priority] || ''}`}>{iss.priority}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{iss.related_feedback_count} responses · {iss.status}</p>
              </button>
            ))}
          </div>

          {/* Issue Detail */}
          {selectedIssue ? (
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5 overflow-y-auto max-h-[600px]">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">{selectedIssue.name}</h2>
                  <p className="text-gray-500 text-sm mt-1">{selectedIssue.aspect} · {selectedIssue.status}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`font-bold px-3 py-1 rounded-full border text-sm ${PRIORITY_COLORS[selectedIssue.priority] || ''}`}>{selectedIssue.priority}</span>
                  <span className={`font-bold px-3 py-1 rounded-full border text-sm ${EVIDENCE_COLORS[selectedIssue.evidence_strength] || ''}`}>{selectedIssue.evidence_strength} Evidence</span>
                </div>
              </div>

              {/* WHY FLAGGED */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1"><Zap size={16} /> WHY WAS THIS FLAGGED?</p>
                <ul className="text-sm text-amber-900 space-y-1">
                  <li>• {selectedIssue.related_feedback_count} related responses detected</li>
                  <li>• {selectedIssue.neg_pct}% negative sentiment</li>
                  <li>• Average rating: {selectedIssue.avg_rating}/5</li>
                  {selectedIssue.pct_change > 0 && <li>• +{selectedIssue.pct_change}% increase from previous period</li>}
                  <li>• Persistence: {selectedIssue.persistence_periods} period(s) · Trend: {selectedIssue.trend}</li>
                </ul>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Responses', value: selectedIssue.related_feedback_count },
                  { label: 'Neg %', value: `${selectedIssue.neg_pct}%` },
                  { label: 'Avg Rating', value: `${selectedIssue.avg_rating}/5` },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Contributing Factors */}
              {selectedIssue.contributing_factors?.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Possible Contributing Factors</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIssue.contributing_factors.map((f, i) => (
                      <span key={i} className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium px-3 py-1 rounded-full">{f}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">These are possible contributing factors, not proven causes.</p>
                </div>
              )}

              {/* Recommendation */}
              {selectedIssue.recommendation && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">System-Generated Recommendation</p>
                  <p className="text-sm text-blue-900">{selectedIssue.recommendation}</p>
                </div>
              )}

              {/* Conflicting Feedback */}
              {issueFeedbacks?.has_contradiction && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                  <p className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-1"><AlertTriangle size={15} /> Conflicting Feedback Detected</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-emerald-600 font-bold mb-1">Positive Views</p>
                      {issueFeedbacks.positive_samples.map((s, i) => (
                        <p key={i} className="text-xs text-gray-700 italic">"{s.text.slice(0, 80)}..."</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-red-600 font-bold mb-1">Negative Views</p>
                      {issueFeedbacks.negative_samples.map((s, i) => (
                        <p key={i} className="text-xs text-gray-700 italic">"{s.text.slice(0, 80)}..."</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Feedback */}
              {issueFeedbacks?.samples?.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Supporting Feedback Samples</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {issueFeedbacks.samples.slice(0, 5).map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.sentiment === 'Positive' ? 'bg-green-100 text-green-700' : s.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {s.sentiment}
                          </span>
                          <span className="text-xs text-gray-400">{s.department} · {s.semester} · ⭐{s.rating}</span>
                        </div>
                        <p className="text-xs text-gray-700">"{s.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifecycle Status */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Issue Lifecycle</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_FLOW.map(s => (
                    <button key={s} onClick={() => handleStatusUpdate(selectedIssue.id, s)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${selectedIssue.status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Record Intervention */}
              {!interventionForm.show ? (
                <button onClick={() => setInterventionForm(f => ({ ...f, show: true }))}
                  className="w-full py-2 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-all">
                  + Record Intervention
                </button>
              ) : (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-bold text-indigo-700">Record Intervention</p>
                  <textarea
                    className="w-full border border-indigo-200 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    rows={2} placeholder="What action was taken?"
                    value={interventionForm.action_taken}
                    onChange={e => setInterventionForm(f => ({ ...f, action_taken: e.target.value }))}
                  />
                  <input
                    className="w-full border border-indigo-200 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="Notes (optional)"
                    value={interventionForm.notes}
                    onChange={e => setInterventionForm(f => ({ ...f, notes: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleIntervention(selectedIssue.id)}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700">
                      Save Intervention
                    </button>
                    <button onClick={() => setInterventionForm({ show: false, action_taken: '', notes: '' })}
                      className="px-4 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Intervention history */}
              {selectedIssue.interventions?.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Intervention History</p>
                  {selectedIssue.interventions.map((iv, i) => (
                    <div key={i} className="bg-green-50 border border-green-200 rounded-xl p-3 mb-2">
                      <p className="text-xs text-gray-500">{new Date(iv.action_date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-800 font-medium mt-1">{iv.action_taken}</p>
                      {iv.before_neg_pct && (
                        <p className="text-xs text-green-700 mt-1">
                          Before: {iv.before_neg_pct}% neg, Rating {iv.before_avg_rating}/5
                          {iv.after_neg_pct && ` → After: ${iv.after_neg_pct}% neg, Rating ${iv.after_avg_rating}/5`}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 italic">Note: Correlation observed, causality not implied.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Layers size={40} className="mx-auto mb-3 opacity-30" />
                <p>Select an issue to view details</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Aspect Health */}
      {tab === 'aspects' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Aspect Health Monitor</h2>
          {aspectHealth.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No aspect data available yet.</p>
          ) : (
            <div className="space-y-4">
              {aspectHealth.map((a, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-semibold text-gray-700 text-right">{a.aspect}</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${a.health_score >= 60 ? 'bg-emerald-500' : a.health_score >= 40 ? 'bg-yellow-400' : 'bg-red-500'}`}
                      style={{ width: `${a.health_score}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm font-bold text-right text-gray-700">{a.health_score}%</div>
                  <div className="w-20 text-xs text-gray-400">{a.total} responses</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Charts */}
      {tab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Sentiment Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentiment} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label>
                    {sentiment.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Topic Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={40}>
                    {topics.map((_, index) => <Cell key={index} fill={`hsl(249, 89%, ${65 - (index * 5)}%)`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
