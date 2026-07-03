import React, { useEffect, useState } from 'react';
import { Leaf, Activity, Camera, Layers, TrendingUp, History, Sprout } from 'lucide-react';
import { getAuthHeaders, API_URL } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/summary`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        Error loading dashboard: {error}
      </div>
    );
  }

  const hasData = data && (data.total_predictions > 0 || data.total_leaf_scans > 0);

  if (!hasData) {
    return (
      <div className="max-w-5xl mx-auto animate-[fade-in_0.4s_ease-out]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to OptiCrop</h1>
          <p className="text-slate-400">Your intelligent farming assistant.</p>
        </div>
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center">
          <Sprout size={64} className="text-emerald-500/50 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">No analytics yet.</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            Start by making a crop prediction using soil data, or scanning a leaf for potential diseases.
          </p>
          <div className="flex gap-4">
            <Link to="/predict" className="btn-primary flex items-center gap-2">
              <Leaf size={18} /> Predict Crop
            </Link>
            <Link to="/leaf-diagnosis" className="glass-panel px-6 py-2.5 rounded-lg text-emerald-400 font-medium hover:bg-emerald-400/10 transition-colors flex items-center gap-2">
              <Camera size={18} /> Scan Leaf
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#ec4899', '#f97316', '#64748b'];

  let processedDiseaseData = data?.disease_count_by_name || [];
  if (processedDiseaseData.length > 9) {
    const sorted = [...processedDiseaseData].sort((a: any, b: any) => b.value - a.value);
    const topData = sorted.slice(0, 8);
    const othersValue = sorted.slice(8).reduce((sum: number, item: any) => sum + item.value, 0);
    processedDiseaseData = [...topData, { name: "Others", value: othersValue }];
  }

  return (
    <div className="max-w-7xl mx-auto animate-[fade-in_0.4s_ease-out] pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Analytics</h1>
          <p className="text-slate-400">Overview of your AI predictions and scans.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardSummary} 
            className="btn-secondary flex items-center gap-2 text-sm px-4"
          >
            Refresh
          </button>
          <button 
            onClick={() => setData({ ...data, recent_activity: [] })}
            className="glass-panel px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
          >
            Clear Activity View
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} />
          </div>
          <div className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <Leaf size={16} className="text-emerald-400" /> Total Predictions
          </div>
          <div className="text-4xl font-bold text-white">{data.total_predictions}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Camera size={64} />
          </div>
          <div className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <Camera size={16} className="text-blue-400" /> Leaf Scans
          </div>
          <div className="text-4xl font-bold text-white">{data.total_leaf_scans}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers size={64} />
          </div>
          <div className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <Sprout size={16} className="text-amber-400" /> Top Crop
          </div>
          <div className="text-xl font-bold text-white truncate mt-2" title={data.most_recommended_crop}>{data.most_recommended_crop || 'N/A'}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} />
          </div>
          <div className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <Activity size={16} className="text-rose-400" /> Top Issue
          </div>
          <div className="text-xl font-bold text-white truncate mt-2" title={data.most_detected_disease}>{data.most_detected_disease || 'N/A'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-8">
          {data.prediction_count_by_crop.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-6">Crop Recommendation Distribution</h3>
              <div className="h-64 overflow-x-auto custom-scrollbar">
                <div className="min-w-[500px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.prediction_count_by_crop}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {processedDiseaseData.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-6">Leaf Disease Detection</h3>
              <div className="flex flex-col md:flex-row h-auto md:h-64 gap-6">
                <div className="flex-1 h-64 md:h-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedDiseaseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {processedDiseaseData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-64 flex-shrink-0 flex flex-col space-y-2 overflow-y-auto overflow-x-auto custom-scrollbar pr-2 max-h-64 md:justify-center">
                  {processedDiseaseData.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 text-sm text-slate-300 min-w-max">
                      <div className="w-3 h-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="flex-1" title={entry.name}>{entry.name}</span>
                      <span className="font-bold shrink-0">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-full max-h-[800px]">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <History size={20} className="text-emerald-400" /> Recent Activity
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {data.recent_activity.map((item: any, idx: number) => (
              <div key={idx} className="relative pl-6 pb-4 border-l-2 border-slate-800 last:border-0 last:pb-0">
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-950 ${
                  item.type === 'prediction' ? 'bg-emerald-500' : 'bg-blue-500'
                }`} />
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl -mt-1.5">
                  <div className="text-xs text-slate-500 mb-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                  <h4 className="font-semibold text-slate-200 text-sm mb-1">{item.title}</h4>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-400">{item.subtitle}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                      {item.metadata.confidence ? `${(item.metadata.confidence * 100).toFixed(0)}% conf` : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {data.recent_activity.length === 0 && (
              <p className="text-slate-500 text-center py-4">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
