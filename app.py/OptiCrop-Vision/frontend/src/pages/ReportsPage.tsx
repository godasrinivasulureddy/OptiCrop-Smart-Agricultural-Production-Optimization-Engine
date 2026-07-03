import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi, getAuthHeaders, API_URL } from '../services/api';
import { FileText, ArrowLeft, Loader2, DownloadCloud, Trash2, Calendar, Droplets, ThermometerSun, FlaskConical, CloudRain, Wind } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { id } = useParams();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState<Record<number, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchReports();
  }, [id]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/reports');
      if (id) {
        // If an ID is provided, filter to show just that one (supports legacy /reports/:id links)
        setReports(data.filter((r: any) => r.prediction_id === parseInt(id) || r.id === parseInt(id)));
      } else {
        setReports(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (reportId: number) => {
    setIsDownloading(prev => ({ ...prev, [reportId]: true }));
    try {
      const response = await fetch(`${API_URL}/reports/${reportId}/pdf`, {
        headers: getAuthHeaders() as HeadersInit
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OptiCrop_Report_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF.');
    } finally {
      setIsDownloading(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!window.confirm("Are you sure you want to delete this report? The underlying prediction history will remain safe.")) return;
    
    setIsDeleting(prev => ({ ...prev, [reportId]: true }));
    try {
      const res = await fetch(`${API_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as HeadersInit
      });
      if (!res.ok) throw new Error('Failed to delete report');
      
      // Refresh list after successful delete
      fetchReports();
    } catch (err) {
      console.error(err);
      alert('Failed to delete report.');
    } finally {
      setIsDeleting(prev => ({ ...prev, [reportId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-emerald-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-slate-400 font-medium">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-[fade-in_0.4s_ease-out] pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Export & Reports Center</h1>
          <p className="text-slate-400">Manage, view, and export your crop prediction reports.</p>
        </div>
        {id && (
          <Link to="/reports" className="btn-secondary flex items-center gap-2 text-sm px-4">
            <ArrowLeft size={16} /> View All Reports
          </Link>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center">
          <FileText size={64} className="text-emerald-500/50 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">No reports available.</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            You haven't generated any crop prediction reports yet, or they have all been deleted.
          </p>
          <Link to="/predict" className="btn-primary flex items-center gap-2">
             Go to Crop Prediction
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <div key={report.id} className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                    <FileText className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {report.prediction?.predicted_crop ? (
                        <span className="capitalize">{report.prediction.predicted_crop}</span>
                      ) : (
                        "Crop Prediction"
                      )}
                      <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        {(report.prediction?.confidence * 100).toFixed(1)}% Match
                      </span>
                    </h3>
                    <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                      <Calendar size={14} /> 
                      {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => handleDownloadPdf(report.id)}
                    disabled={isDownloading[report.id]}
                    className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 text-sm px-4 py-2"
                  >
                    {isDownloading[report.id] ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                    PDF
                  </button>
                  <button 
                    onClick={() => handleDelete(report.id)}
                    disabled={isDeleting[report.id]}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                    title="Delete Report"
                  >
                    {isDeleting[report.id] ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                
                {/* Soil & Env Details */}
                {report.prediction?.soil_data && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Soil & Environmental Data</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-400">Nitrogen</span>
                          <FlaskConical size={14} className="text-emerald-400" />
                        </div>
                        <div className="font-bold text-white">{report.prediction.soil_data.N}</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-400">Phosphorus</span>
                          <FlaskConical size={14} className="text-emerald-400" />
                        </div>
                        <div className="font-bold text-white">{report.prediction.soil_data.P}</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-400">Potassium</span>
                          <FlaskConical size={14} className="text-emerald-400" />
                        </div>
                        <div className="font-bold text-white">{report.prediction.soil_data.K}</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-400">pH Level</span>
                          <FlaskConical size={14} className="text-emerald-400" />
                        </div>
                        <div className="font-bold text-white">{report.prediction.soil_data.ph}</div>
                      </div>
                      
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-400">Temp</span>
                          <ThermometerSun size={14} className="text-amber-400" />
                        </div>
                        <div className="font-bold text-white">{report.prediction.soil_data.temperature}°C</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-400">Humidity</span>
                          <Droplets size={14} className="text-blue-400" />
                        </div>
                        <div className="font-bold text-white">{report.prediction.soil_data.humidity}%</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-400">Rainfall</span>
                          <CloudRain size={14} className="text-blue-400" />
                        </div>
                        <div className="font-bold text-white">{report.prediction.soil_data.rainfall}mm</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-400">Season</span>
                          <Wind size={14} className="text-indigo-400" />
                        </div>
                        <div className="font-bold text-white text-xs sm:text-sm">
                          {(() => {
                            const map: Record<string, string> = {
                              'Kharif': 'Kharif (June/July – October/November)',
                              'Rabi': 'Rabi (October/November – March/April)',
                              'Zaid': 'Zaid (March/April – June)',
                              'Whole Year': 'Whole Year (January – December)'
                            };
                            return map[report.prediction.soil_data.season] || report.prediction.soil_data.season;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Suggestions Block */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                     Optimization Suggestions
                  </h4>
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-[164px] overflow-y-auto custom-scrollbar">
                    {report.action_plan ? (
                      <ul className="space-y-3">
                        {report.action_plan.split('\n').filter((l: string) => l.trim().length > 0).map((line: string, i: number) => (
                          <li key={i} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                            <span className="text-emerald-400 mt-1">•</span> {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 italic text-sm">No suggestions provided.</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
