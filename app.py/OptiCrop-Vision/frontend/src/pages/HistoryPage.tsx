import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi, getAuthHeaders, API_URL } from '../services/api';
import { History, ArrowRight, Sprout, Calendar, Wind, DownloadCloud, Loader2, Leaf, Scan, Trash2 } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'crop' | 'leaf'>('crop');
  
  const [cropHistory, setCropHistory] = useState<any[]>([]);
  const [leafHistory, setLeafHistory] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [selectedLeaf, setSelectedLeaf] = useState<any>(null);

  const [selectedCropIds, setSelectedCropIds] = useState<number[]>([]);
  const [selectedLeafIds, setSelectedLeafIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchHistories = async () => {
    setLoading(true);
    try {
      const [cropRes, leafRes] = await Promise.all([
        fetchApi('/predict/history'),
        fetchApi('/vision/history')
      ]);
      setCropHistory(cropRes);
      setLeafHistory(leafRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistories();
  }, []);

  const handleDeleteHistory = async (id: number, type: 'crop' | 'leaf') => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'crop' ? 'prediction' : 'diagnosis'} history log?`)) return;
    
    const key = `${type}-${id}`;
    setDeleting(prev => ({ ...prev, [key]: true }));
    try {
      const endpoint = type === 'crop' ? `/predict/${id}` : `/vision/${id}`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as HeadersInit
      });
      
      if (!response.ok) throw new Error('Failed to delete history');
      
      if (type === 'crop') {
        setSelectedCropIds(prev => prev.filter(selectedId => selectedId !== id));
      } else {
        setSelectedLeafIds(prev => prev.filter(selectedId => selectedId !== id));
      }

      await fetchHistories();
    } catch (err) {
      console.error('Error deleting history:', err);
      alert('Failed to delete history.');
    } finally {
      setDeleting(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleBulkDelete = async (type: 'crop' | 'leaf') => {
    const ids = type === 'crop' ? selectedCropIds : selectedLeafIds;
    if (ids.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${ids.length} selected ${type === 'crop' ? 'prediction' : 'diagnosis'} logs?`)) return;

    setIsBulkDeleting(true);
    try {
      const endpointPrefix = type === 'crop' ? '/predict' : '/vision';
      await Promise.all(ids.map(id => fetch(`${API_URL}${endpointPrefix}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as HeadersInit
      })));
      
      if (type === 'crop') setSelectedCropIds([]);
      else setSelectedLeafIds([]);
      
      await fetchHistories();
    } catch (err) {
      console.error('Error deleting histories:', err);
      alert('Failed to delete some histories.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDownloadPdf = async (id: number, type: 'crop' | 'leaf') => {
    const key = `${type}-${id}`;
    setDownloading(prev => ({ ...prev, [key]: true }));
    try {
      const endpoint = type === 'crop' ? `/reports/${id}/pdf` : `/vision/history/${id}/pdf`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: getAuthHeaders() as HeadersInit
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'crop' ? `OptiCrop_Report_${id}.pdf` : `Leaf_Diagnosis_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF.');
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="animate-[fade-in_0.4s_ease-out] max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <History className="text-blue-400" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">History Logs</h1>
            <p className="text-slate-400">Review your past analyses and AI recommendations.</p>
          </div>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('crop')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'crop' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Sprout size={16} /> Crop Predictions
          </button>
          <button
            onClick={() => setActiveTab('leaf')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'leaf' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Leaf size={16} /> Leaf Diagnosis
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : activeTab === 'crop' ? (
        // Crop History View
        cropHistory.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center">
            <div className="inline-flex p-4 bg-slate-900/50 rounded-full mb-4">
              <Sprout className="text-slate-500" size={32} />
            </div>
            <h3 className="text-xl font-medium text-slate-300 mb-2">No crop history found</h3>
            <p className="text-slate-500 mb-6">You haven't made any crop predictions yet.</p>
            <Link to="/predict" className="btn-primary inline-flex">Make a Prediction</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                  checked={cropHistory.length > 0 && selectedCropIds.length === cropHistory.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCropIds(cropHistory.map(i => i.id));
                    else setSelectedCropIds([]);
                  }}
                />
                <span className="text-sm font-medium text-slate-300">Select All</span>
              </div>
              {selectedCropIds.length > 0 && (
                <button 
                  onClick={() => handleBulkDelete('crop')}
                  disabled={isBulkDeleting}
                  className="btn-secondary py-2 px-4 text-sm text-rose-400 border-rose-500/30 hover:bg-rose-500/10 flex items-center gap-2 disabled:opacity-50"
                >
                  {isBulkDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete Selected ({selectedCropIds.length})
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {cropHistory.map(item => (
                <div key={item.id} className={`glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.07] transition-colors border ${selectedCropIds.includes(item.id) ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}>
                  <div className="flex items-center gap-4 md:gap-6">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500/50 cursor-pointer shrink-0"
                      checked={selectedCropIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCropIds([...selectedCropIds, item.id]);
                        else setSelectedCropIds(selectedCropIds.filter(id => id !== item.id));
                      }}
                    />
                    
                    <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full shrink-0">
                      <span className="text-2xl font-bold text-blue-400">{(item.confidence * 100).toFixed(0)}</span>
                      <span className="text-[10px] text-blue-500/70 uppercase tracking-wider">%</span>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-slate-100 capitalize mb-1">{item.predicted_crop}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md">
                          <Calendar size={14} className="text-blue-400" />
                          {(() => {
                            const map: Record<string, string> = {
                              'Kharif': 'Kharif (June/July – October/November)',
                              'Rabi': 'Rabi (October/November – March/April)',
                              'Zaid': 'Zaid (March/April – June)',
                              'Whole Year': 'Whole Year (January – December)'
                            };
                            return map[item.soil_data.season] || item.soil_data.season;
                          })()}
                        </span>
                        <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md">
                          <Wind size={14} className="text-orange-400" />
                          pH: {item.soil_data.ph}
                        </span>
                        <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md text-xs">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 ml-9 md:ml-0">
                    <button 
                      onClick={() => handleDeleteHistory(item.id, 'crop')}
                      disabled={deleting[`crop-${item.id}`]}
                      className="flex items-center justify-center p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-400 transition-all text-rose-500 disabled:opacity-50"
                      title="Delete History Log"
                    >
                      {deleting[`crop-${item.id}`] ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                    <button 
                      onClick={() => handleDownloadPdf(item.id, 'crop')}
                      disabled={downloading[`crop-${item.id}`]}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-400 transition-all text-slate-300 font-medium disabled:opacity-50"
                      title="Download PDF"
                    >
                      {downloading[`crop-${item.id}`] ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                    </button>
                    <Link 
                      to={`/reports/${item.id}`} 
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-400 transition-all text-slate-300 font-medium"
                    >
                      View Report <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        // Leaf History View
        leafHistory.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center">
            <div className="inline-flex p-4 bg-slate-900/50 rounded-full mb-4">
              <Scan className="text-slate-500" size={32} />
            </div>
            <h3 className="text-xl font-medium text-slate-300 mb-2">No leaf scans found</h3>
            <p className="text-slate-500 mb-6">You haven't scanned any leaves for disease diagnosis yet.</p>
            <Link to="/leaf-diagnosis" className="btn-primary inline-flex from-emerald-500 to-teal-600 shadow-emerald-500/20 border-emerald-400/20">Scan a Leaf</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded border-white/20 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                  checked={leafHistory.length > 0 && selectedLeafIds.length === leafHistory.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedLeafIds(leafHistory.map(i => i.id));
                    else setSelectedLeafIds([]);
                  }}
                />
                <span className="text-sm font-medium text-slate-300">Select All</span>
              </div>
              {selectedLeafIds.length > 0 && (
                <button 
                  onClick={() => handleBulkDelete('leaf')}
                  disabled={isBulkDeleting}
                  className="btn-secondary py-2 px-4 text-sm text-rose-400 border-rose-500/30 hover:bg-rose-500/10 flex items-center gap-2 disabled:opacity-50"
                >
                  {isBulkDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete Selected ({selectedLeafIds.length})
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {leafHistory.map(item => (
                <div key={item.id} className={`glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.07] transition-colors border ${selectedLeafIds.includes(item.id) ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5'}`}>
                  <div className="flex items-center gap-4 md:gap-6">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded border-white/20 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer shrink-0"
                      checked={selectedLeafIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedLeafIds([...selectedLeafIds, item.id]);
                        else setSelectedLeafIds(selectedLeafIds.filter(id => id !== item.id));
                      }}
                    />

                    <div className={`hidden md:flex flex-col items-center justify-center w-20 h-20 rounded-full border shrink-0 ${item.health_status === 'Healthy' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                      <span className={`text-2xl font-bold ${item.health_status === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(item.confidence * 100).toFixed(0)}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider ${item.health_status === 'Healthy' ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>%</span>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-1">{item.plant_type || 'Unknown Plant'}</h3>
                      <div className={`font-medium text-sm mb-2 ${item.health_status === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.disease_name}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md text-xs">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md text-xs uppercase">
                          {item.language}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 ml-9 md:ml-0">
                    <button 
                      onClick={() => handleDeleteHistory(item.id, 'leaf')}
                      disabled={deleting[`leaf-${item.id}`]}
                      className="flex items-center justify-center p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-400 transition-all text-rose-500 disabled:opacity-50"
                      title="Delete History Log"
                    >
                      {deleting[`leaf-${item.id}`] ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                    <button 
                      onClick={() => handleDownloadPdf(item.id, 'leaf')}
                      disabled={downloading[`leaf-${item.id}`]}
                      className="flex items-center justify-center p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-400 transition-all text-slate-300 font-medium disabled:opacity-50"
                      title="Download PDF"
                    >
                      {downloading[`leaf-${item.id}`] ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                    </button>
                    <button 
                      onClick={() => setSelectedLeaf(item)}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-400 transition-all text-slate-300 font-medium"
                    >
                      View Report <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Leaf Diagnosis Modal */}
      {selectedLeaf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
          <div className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <button 
              onClick={() => setSelectedLeaf(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Scan className="text-emerald-400" /> Leaf Diagnosis Report
            </h2>
            <p className="text-slate-400 text-sm mb-6">{new Date(selectedLeaf.created_at).toLocaleString()}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-slate-500 uppercase">Plant Type</p>
                <p className="font-bold text-slate-200">{selectedLeaf.plant_type}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-slate-500 uppercase">Issue Detected</p>
                <p className="font-bold text-rose-400">{selectedLeaf.disease_name}</p>
              </div>
            </div>

            {selectedLeaf.farmer_summary && (
              <div className="mb-6 bg-slate-800/50 p-4 rounded-xl border border-white/5 italic text-slate-300">
                "{selectedLeaf.farmer_summary.replace(/\[Fallback:.*?\]\s*/, '')}"
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="text-slate-300 font-medium mb-2">Visible Symptoms</h4>
                <ul className="list-disc pl-5 text-sm text-slate-400">
                  {(() => {
                    let symptoms = [];
                    try { symptoms = JSON.parse(selectedLeaf.symptoms_json || "[]"); } catch (e) { symptoms = []; }
                    if (!Array.isArray(symptoms)) symptoms = [symptoms].filter(Boolean);
                    if (symptoms.length === 0) return <li>No specific symptoms recorded.</li>;
                    return symptoms.map((s: string, i: number) => <li key={i}>{s}</li>);
                  })()}
                </ul>
              </div>
              <div>
                <h4 className="text-emerald-400 font-medium mb-2">Remedies & Advice</h4>
                <ul className="list-disc pl-5 text-sm text-emerald-200/70">
                  {(() => {
                    let advice = [];
                    try { advice = JSON.parse(selectedLeaf.advice_json || selectedLeaf.natural_remedies_json || "[]"); } catch (e) { advice = []; }
                    if (!Array.isArray(advice)) advice = [advice].filter(Boolean);
                    if (advice.length === 0) return <li>No specific advice recorded.</li>;
                    return advice.map((s: string, i: number) => <li key={i}>{s}</li>);
                  })()}
                </ul>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedLeaf(null)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => { handleDownloadPdf(selectedLeaf.id, 'leaf'); setSelectedLeaf(null); }}
                className="btn-primary flex items-center gap-2 text-sm px-4"
              >
                <DownloadCloud size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

