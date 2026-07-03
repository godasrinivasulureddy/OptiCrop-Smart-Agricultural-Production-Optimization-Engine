import React, { useState, useEffect, useRef } from 'react';
import { Camera, UploadCloud, AlertTriangle, CheckCircle2, ChevronRight, Activity, DownloadCloud, Loader2, Volume2, Square, Leaf } from 'lucide-react';
import { getAuthHeaders, API_URL } from '../services/api';

export const LeafDiagnosisPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [language, setLanguage] = useState<string>('english');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceSource, setVoiceSource] = useState<'omnidimension' | 'browser' | null>(null);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchHistory();
    return () => stopAudio();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/vision/history`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  const handleDownloadPdf = async (diagnosisId: number) => {
    setDownloading(prev => ({ ...prev, [diagnosisId]: true }));
    try {
      const response = await fetch(`${API_URL}/vision/history/${diagnosisId}/pdf`, {
        headers: getAuthHeaders() as HeadersInit
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OptiCrop_Leaf_Diagnosis_${diagnosisId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF.');
    } finally {
      setDownloading(prev => ({ ...prev, [diagnosisId]: false }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError('');
      stopAudio();
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null); // Clear previous result and badge
    stopAudio();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    try {
      const headers = getAuthHeaders();
      delete (headers as any)['Content-Type'];

      const res = await fetch(`${API_URL}/vision/analyze`, {
        method: 'POST',
        headers: headers as HeadersInit,
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to analyze image');
      }

      const data = await res.json();
      console.log("VISION RESPONSE:", data);
      
      try {
        const safeParse = (val: any) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try { return JSON.parse(val); } catch { return []; }
        };
        
        data.symptoms = safeParse(data.symptoms_json || data.visible_symptoms);
        data.advice = safeParse(data.advice_json || data.advice);
        data.natural_remedies = safeParse(data.natural_remedies_json || data.natural_remedies);
        data.organic_fertilizer_suggestions = safeParse(data.organic_fertilizer_suggestions_json || data.organic_fertilizer_suggestions);
        data.preventive_care = safeParse(data.preventive_care_json || data.preventive_care);
        data.confidence = data.confidence || 0.0;
      } catch (e) {
        console.error('Failed to parse json arrays', e);
      }
      
      setResult(data);
      fetchHistory();
      
      if (data.disease_name === 'Fallback Mode — Gemini quota exceeded') {
        setCooldown(45);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    if (!result) return;
    stopAudio();
    
    const summaryText = result?.farmer_summary || '';
    const fallbackMatch = summaryText.match(/^\[Fallback: (.*?)\] (.*)/);
    const displaySummary = fallbackMatch ? fallbackMatch[2] : summaryText;

    const textToRead = `
      ${displaySummary}.
      ${result.natural_remedies && result.natural_remedies.length > 0 ? "Remedies include: " + result.natural_remedies.join(". ") : ""}
      ${result.preventive_care && result.preventive_care.length > 0 ? "Preventive care includes: " + result.preventive_care.join(". ") : ""}
    `;

    const targetLang = result.language || language;
    setIsVoiceLoading(true);
    setVoiceSource(null);

    try {
      const res = await fetch(`${API_URL}/tts/speak`, {
        method: 'POST',
        headers: getAuthHeaders() as HeadersInit,
        body: JSON.stringify({
          text: textToRead,
          language: targetLang
        })
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.fallback) {
          if (data.reason) {
            console.warn(data.reason);
            // We could show a toast or small text if needed, but for now we set the source to browser with a tooltip
          }
          playBrowserTTS(textToRead, targetLang, data.reason || "Server TTS provider unavailable");
        }
      } else if (res.ok) {
        // We received audio stream
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
        
        await audio.play();
        setVoiceSource('omnidimension'); // Represents "Server TTS"
        setIsPlaying(true);
      } else {
        playBrowserTTS(textToRead, targetLang, "Server TTS provider unavailable");
      }
    } catch (e) {
      console.error("TTS API failed, falling back to browser", e);
      playBrowserTTS(textToRead, targetLang, "Server TTS provider unavailable");
    } finally {
      setIsVoiceLoading(false);
    }
  };

  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  const playBrowserTTS = (text: string, lang: string, reason?: string) => {
    if (reason) setFallbackReason(reason);
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    if (lang === 'telugu') {
      const teVoice = voices.find(v => v.lang.toLowerCase().includes('te'));
      if (teVoice) utterance.voice = teVoice;
      utterance.lang = 'te-IN';
    } else {
      const enVoice = voices.find(v => v.lang.toLowerCase().includes('en'));
      if (enVoice) utterance.voice = enVoice;
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setVoiceSource('browser');
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Ensure voices are loaded
  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto animate-[fade-in_0.4s_ease-out] pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Camera className="text-emerald-400" size={32} />
          Leaf Disease Analysis
        </h1>
        <p className="text-slate-400">Upload a photo of a crop leaf to detect possible diseases, pests, or stress symptoms.</p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={18} />
        <div className="text-sm">
          <strong>Scientific Notice:</strong> Image diagnosis is advisory and detects visible symptoms only. It is scientifically impossible to predict exact soil N, P, K, pH, or humidity from a standard photo.
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
          <p>{error}</p>
          {error.includes('unavailable') && (
            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="mt-3 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? "Retrying..." : "Retry live analysis"}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Upload Section */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Upload Image</h2>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="glass-input bg-black/40 text-sm py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer text-slate-200"
            >
              <option value="english" className="bg-slate-900">English</option>
              <option value="telugu" className="bg-slate-900">Telugu (తెలుగు)</option>
            </select>
          </div>
          
          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 transition-colors cursor-pointer relative overflow-hidden group min-h-[250px] max-h-[400px]">
            {preview ? (
              <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2 opacity-80 group-hover:opacity-40 transition-opacity" />
            ) : null}
            
            <div className="flex flex-col items-center z-10 p-6 text-center">
              <div className="p-4 bg-emerald-500/20 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="text-emerald-400" size={32} />
              </div>
              <span className="text-lg font-medium text-slate-200 mb-2">
                {preview ? 'Change Image' : 'Select an Image'}
              </span>
              <span className="text-sm text-slate-400">JPEG, PNG, WEBP allowed</span>
            </div>
            
            <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
          </label>

          <button 
            onClick={handleAnalyze} 
            disabled={!file || loading || cooldown > 0}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing via Gemini AI...</>
            ) : cooldown > 0 ? (
              <><Activity size={20} /> Quota limit reached. Retry in {cooldown}s.</>
            ) : (
              <><Activity size={20} /> Analyze Leaf</>
            )}
          </button>
        </div>

        {/* Result Section */}
        <div className="glass-panel p-6 rounded-2xl h-full flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-white">Diagnosis Result</h2>
            {result && (() => {
              const summaryText = result?.farmer_summary || '';
              const fallbackMatch = summaryText.match(/^\[Fallback: (.*?)\]/);
              const fallbackModelName = fallbackMatch ? fallbackMatch[1] : null;

              if (result.is_demo_result) {
                return (
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    {result.disease_name === 'Fallback Mode — Gemini quota exceeded' ? 'Fallback Mode — Gemini quota exceeded' : 'Demo Mode — API key missing'}
                  </span>
                );
              } else if (fallbackModelName === 'huggingface') {
                return (
                  <span className="text-xs font-bold text-fuchsia-300 bg-fuchsia-500/20 border border-fuchsia-500/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.3)] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-pulse" /> HuggingFace Vision
                  </span>
                );
              } else if (fallbackModelName) {
                return (
                  <span className="text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" /> Gemini fallback model used: {fallbackModelName}
                  </span>
                );
              } else {
                return (
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Gemini Live Analysis
                  </span>
                );
              }
            })()}
          </div>
          
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-rose-400 border-2 border-dashed border-rose-900/50 rounded-xl bg-rose-950/20 p-8 text-center">
              <AlertTriangle size={48} className="mb-4 opacity-80" />
              <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
              <p className="text-sm opacity-80 mb-6">{error}</p>
              <button 
                onClick={handleAnalyze} 
                className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Activity size={18} /> Retry Analysis
              </button>
            </div>
          ) : !result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-black/20 p-8 text-center">
              {loading ? (
                <>
                  <Loader2 size={48} className="mb-4 text-emerald-500 animate-spin" />
                  <p className="text-emerald-400 font-medium animate-pulse">Analyzing leaf with Gemini Vision...</p>
                  <p className="text-xs text-slate-500 mt-2">This may take a few seconds</p>
                </>
              ) : (
                <>
                  <Camera size={48} className="mb-4 opacity-50" />
                  <p>Upload and analyze an image to see Gemini Vision results here.</p>
                </>
              )}
            </div>
          ) : (() => {
            const summaryText = result?.farmer_summary || '';
            const fallbackMatch = summaryText.match(/^\[Fallback: (.*?)\] (.*)/);
            const displaySummary = fallbackMatch ? fallbackMatch[2] : summaryText;

            return (
            <div className="flex-1 flex flex-col animate-[fade-in_0.3s_ease-out] overflow-y-auto custom-scrollbar pr-2 pb-2">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border ${
                  result.health_status?.toLowerCase() === 'healthy' ? 'bg-emerald-500/20 border-emerald-400' : 'bg-rose-500/20 border-rose-400'
                }`}>
                  {result.health_status?.toLowerCase() === 'healthy' ? (
                    <CheckCircle2 className="text-emerald-400" size={28} />
                  ) : (
                    <AlertTriangle className="text-rose-400" size={28} />
                  )}
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                    {result.health_status || "Detected Issue"} 
                  </div>
                  <h3 className="text-2xl font-bold text-slate-100">{result.disease_name}</h3>
                </div>
              </div>

              {result.farmer_summary && (
                <div className="mb-6 bg-slate-900/60 p-4 rounded-xl border border-white/5 relative mt-4">
                  <p className="text-sm text-slate-300 italic">"{displaySummary}"</p>
                  
                  <div className="absolute -top-4 right-2 flex gap-2 items-center">
                    {voiceSource === 'omnidimension' && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Natural {result.language === 'telugu' || language === 'telugu' ? 'Telugu' : 'English'} Voice
                      </span>
                    )}
                    {voiceSource === 'browser' && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30" title="Browser Voice Fallback">
                        {fallbackReason || "Browser Voice Fallback"}
                      </span>
                    )}
                    
                    {!isPlaying ? (
                      <button onClick={playAudio} disabled={isVoiceLoading} className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white px-3 py-1.5 rounded-full shadow-lg transition-transform hover:scale-105 text-xs flex items-center gap-1.5">
                        {isVoiceLoading ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                        {isVoiceLoading ? "Loading..." : (result.language === 'telugu' || language === 'telugu' ? "Read in Telugu" : "Read in English")}
                      </button>
                    ) : (
                      <button onClick={stopAudio} className="bg-rose-500 hover:bg-rose-400 text-white px-3 py-1.5 rounded-full shadow-lg transition-transform hover:scale-105 text-xs flex items-center gap-1.5">
                        <Square size={12} /> Stop
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Plant Type</div>
                  <div className="font-medium text-slate-200">{result.plant_type}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Confidence</div>
                  <div className="font-medium text-emerald-400">{(result.confidence * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
            );
          })()}
        </div>
      </div>

      {/* Detailed Recommendations Section (Full Width) */}
      {result && !error && (
        <div className="glass-panel p-8 rounded-2xl mb-12 animate-[fade-in_0.4s_ease-out]">
          <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Detailed Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column */}
            <div>
              <div className="mb-6">
                <h4 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" /> Visible Symptoms
                </h4>
                {result.symptoms && result.symptoms.length > 0 ? (
                  <ul className="space-y-2">
                    {result.symptoms.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <ChevronRight size={16} className="text-slate-600 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No specific items returned.</p>
                )}
              </div>

              <div className="mb-6 md:mb-0">
                <h4 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-blue-400" /> Preventive Care
                </h4>
                {result.preventive_care && result.preventive_care.length > 0 ? (
                  <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
                    <ul className="space-y-2">
                      {result.preventive_care.map((p: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-200/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No specific items returned.</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-6">
                <h4 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
                  <Leaf size={16} className="text-emerald-400" /> Natural Remedies
                </h4>
                {((result.natural_remedies && result.natural_remedies.length > 0) || (result.advice && result.advice.length > 0)) ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                    <ul className="space-y-2">
                      {(result.natural_remedies?.length ? result.natural_remedies : result.advice).map((a: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-emerald-200/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1.5 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No specific items returned.</p>
                )}
              </div>

              <div>
                <h4 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
                  <Leaf size={16} className="text-amber-400" /> Organic Fertilizer Suggestions
                </h4>
                {result.organic_fertilizer_suggestions && result.organic_fertilizer_suggestions.length > 0 ? (
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                    <ul className="space-y-2">
                      {result.organic_fertilizer_suggestions.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-200/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No specific items returned.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Scans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {history.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</span>
                    <button 
                      onClick={() => handleDownloadPdf(item.id)}
                      disabled={downloading[item.id]}
                      className="text-xs flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                      title="Download PDF Report"
                    >
                      {downloading[item.id] ? <Loader2 size={12} className="animate-spin" /> : <DownloadCloud size={12} />}
                      PDF Report
                    </button>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <h4 className="font-medium text-slate-200 text-sm truncate mb-1">{item.disease_name}</h4>
                <p className="text-xs text-slate-400 truncate">{item.plant_type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

