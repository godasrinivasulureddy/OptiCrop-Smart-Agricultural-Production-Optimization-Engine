import React, { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';
import { ShieldAlert, Users, Target, Activity, ServerCrash, Scan, FileText, CloudRain, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi('/admin/analytics')
      .then(setStats)
      .catch((err) => setError(err.message));
      
    fetchApi('/admin/models')
      .then(setModelMetrics)
      .catch(console.error);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-rose-400">
        <ServerCrash size={48} className="mb-4 opacity-80" />
        <h2 className="text-xl font-bold mb-2">Access Denied / Error</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Users',
      value: stats.total_users,
      icon: <Users size={24} className="text-blue-400" />,
      color: 'from-blue-500/20 to-blue-900/5',
      borderColor: 'border-blue-500/30',
    },
    {
      label: 'Active Users (7d)',
      value: stats.active_users_last_7_days,
      icon: <Activity size={24} className="text-indigo-400" />,
      color: 'from-indigo-500/20 to-indigo-900/5',
      borderColor: 'border-indigo-500/30',
    },
    {
      label: 'Predictions Made',
      value: stats.total_predictions,
      icon: <Target size={24} className="text-purple-400" />,
      color: 'from-purple-500/20 to-purple-900/5',
      borderColor: 'border-purple-500/30',
    },
    {
      label: 'Leaf Scans',
      value: stats.total_leaf_scans,
      icon: <Scan size={24} className="text-emerald-400" />,
      color: 'from-emerald-500/20 to-emerald-900/5',
      borderColor: 'border-emerald-500/30',
    },
    {
      label: 'Reports Generated',
      value: stats.total_reports_generated,
      icon: <FileText size={24} className="text-amber-400" />,
      color: 'from-amber-500/20 to-amber-900/5',
      borderColor: 'border-amber-500/30',
    },
    {
      label: 'Weather Fetches',
      value: stats.total_weather_fetches,
      icon: <CloudRain size={24} className="text-cyan-400" />,
      color: 'from-cyan-500/20 to-cyan-900/5',
      borderColor: 'border-cyan-500/30',
    }
  ];

  const pieColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="animate-[fade-in_0.4s_ease-out] max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/10">
        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
          <ShieldAlert className="text-red-400" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Intelligence Panel</h1>
          <p className="text-slate-400">Platform-wide analytics, usage metrics, and system health.</p>
        </div>
      </div>

      {/* System Health */}
      <div className={`mb-8 p-6 rounded-2xl border ${stats.system_health_status === 'Healthy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} flex items-center gap-4`}>
        {stats.system_health_status === 'Healthy' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
        <div>
          <h3 className="text-lg font-bold">System Status: {stats.system_health_status}</h3>
          <p className="text-sm opacity-80">
            {stats.system_health_status === 'Healthy' 
              ? 'All services are operational with no recent backend errors.'
              : 'Backend errors detected in the last 24 hours. Review logs below.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border ${kpi.borderColor} bg-gradient-to-br ${kpi.color} glass-panel relative overflow-hidden group`}>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="p-2 bg-black/20 rounded-lg shadow-inner w-max mb-3">
              {kpi.icon}
            </div>
            <p className="text-xs text-slate-400 font-medium mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-white">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Crops */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-6">Top Global Crops</h3>
          {stats.top_global_crops?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.top_global_crops} margin={{ left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-10">No crop data available yet.</p>
          )}
        </div>

        {/* Top Diseases */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-6">Top Global Diseases</h3>
          {stats.top_global_diseases?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.top_global_diseases} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {stats.top_global_diseases.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-10">No disease scan data available yet.</p>
          )}
        </div>
      </div>

      {/* Model Evaluation Metrics */}
      {modelMetrics && modelMetrics.models && (
        <div className="glass-panel p-6 rounded-2xl mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target size={20} className="text-indigo-400" /> Model Evaluation Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-2">Best Performing Model:</p>
              <div className="text-xl font-bold text-emerald-400 mb-4">{modelMetrics.best_model}</div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Training Timestamp</span>
                  <span className="text-slate-200 text-sm">{modelMetrics.timestamp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Total Records</span>
                  <span className="text-slate-200 text-sm">{modelMetrics.total_records}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-slate-400 mb-2">Algorithm Comparison (Accuracy)</p>
              {Object.entries(modelMetrics.models).map(([name, metrics]: [string, any]) => (
                <div key={name} className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-slate-300 font-medium">{name}</span>
                    <span className={name === modelMetrics.best_model ? "text-emerald-400 font-bold" : "text-slate-400"}>
                      {(metrics.accuracy * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${name === modelMetrics.best_model ? 'bg-emerald-500' : 'bg-slate-500'}`} 
                      style={{ width: `${metrics.accuracy * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Errors */}
      <div className="glass-panel p-6 rounded-2xl border-rose-500/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ServerCrash size={20} className="text-rose-400" /> Recent Backend Errors
        </h3>
        
        {stats.recent_errors?.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_errors.map((err: any) => (
              <div key={err.id} className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/20 text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded">{err.route || 'Global'}</span>
                  <span className="text-slate-500 text-xs">{new Date(err.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 font-mono text-xs">{err.error_message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/10">
            <CheckCircle2 size={32} className="text-emerald-400/50 mx-auto mb-3" />
            <p className="text-emerald-300/80">No recent errors logged. System is perfectly stable.</p>
          </div>
        )}
      </div>
    </div>
  );
};
