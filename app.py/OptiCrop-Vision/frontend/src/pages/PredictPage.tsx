import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi, getAuthHeaders, API_URL } from '../services/api';
import { FlaskConical, Droplets, ThermometerSun, CloudRain, Sun, Wind, CheckCircle2, ArrowRight, MapPin, CloudLightning, AlertTriangle, Search, X } from 'lucide-react';

export const PredictPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'predict' | 'suitability'>('predict');
  
  const [location, setLocation] = useState('');
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<any>(null);
  const [weatherError, setWeatherError] = useState('');

  const [formData, setFormData] = useState({ 
    target_crop: '',
    N: '', P: '', K: '', 
    temperature: '', humidity: '', ph: '', rainfall: '', 
    season: 'Kharif' 
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suitabilityResult, setSuitabilityResult] = useState<any>(null);
  
  const navigate = useNavigate();

  const handleFetchWeather = async () => {
    if (!location) {
      setWeatherError('Please enter a location first.');
      return;
    }
    setIsFetchingWeather(true);
    setWeatherError('');
    setWeatherInfo(null);

    try {
      const res = await fetch(`${API_URL}/weather/fetch`, {
        method: 'POST',
        headers: getAuthHeaders() as HeadersInit,
        body: JSON.stringify({ location })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch weather data.');
      }

      const data = await res.json();
      setWeatherInfo(data);
      
      // Auto-fill the form fields
      setFormData(prev => ({
        ...prev,
        temperature: data.temperature.toString(),
        humidity: data.humidity.toString(),
        rainfall: data.estimated_rainfall_mm.toString()
      }));
    } catch (err: any) {
      setWeatherError(err.message);
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const handlePredictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetchApi('/predict', {
        method: 'POST',
        body: JSON.stringify({
          N: Number(formData.N), P: Number(formData.P), K: Number(formData.K),
          temperature: Number(formData.temperature), humidity: Number(formData.humidity),
          ph: Number(formData.ph), rainfall: Number(formData.rainfall), season: formData.season
        })
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuitabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.target_crop) {
      setError('Please enter a target crop.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuitabilityResult(null);
    try {
      const res = await fetchApi('/predict/suitability', {
        method: 'POST',
        body: JSON.stringify({
          target_crop: formData.target_crop,
          N: Number(formData.N), P: Number(formData.P), K: Number(formData.K),
          temperature: Number(formData.temperature), humidity: Number(formData.humidity),
          ph: Number(formData.ph), rainfall: Number(formData.rainfall)
        })
      });
      setSuitabilityResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputs = [
    { name: 'N', label: 'Nitrogen (N)', icon: <FlaskConical size={18} />, placeholder: 'e.g., 90' },
    { name: 'P', label: 'Phosphorus (P)', icon: <FlaskConical size={18} />, placeholder: 'e.g., 42' },
    { name: 'K', label: 'Potassium (K)', icon: <FlaskConical size={18} />, placeholder: 'e.g., 43' },
    { name: 'ph', label: 'Soil pH', icon: <Wind size={18} />, placeholder: 'e.g., 6.5' },
    { name: 'temperature', label: 'Temperature (°C)', icon: <ThermometerSun size={18} />, placeholder: 'e.g., 20.8' },
    { name: 'humidity', label: 'Humidity (%)', icon: <Droplets size={18} />, placeholder: 'e.g., 82.0' },
    { name: 'rainfall', label: 'Rainfall (mm)', icon: <CloudRain size={18} />, placeholder: 'e.g., 202.9' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-[fade-in_0.4s_ease-out]">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Crop Prediction AI</h1>
          <p className="text-slate-400">Enter your soil and environmental metrics for optimal agricultural decisions.</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => { setActiveTab('predict'); setResult(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'predict' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
          >
            Predict Best Crop
          </button>
          <button
            onClick={() => { setActiveTab('suitability'); setSuitabilityResult(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'suitability' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
          >
            Check Suitability
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
          {error}
        </div>
      )}

      {/* Render Predict Crop Results */}
      {activeTab === 'predict' && result && (
        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden animate-[slide-up_0.5s_ease-out] mb-8">
          <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="text-emerald-400" size={40} />
            </div>
            
            <h2 className="text-2xl text-slate-300 mb-2">Recommended Crop</h2>
            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100 mb-6 capitalize">
              {result.predicted_crop}
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-white/5 mb-8">
              <span className="text-slate-400">Confidence Score:</span>
              <span className="text-emerald-400 font-bold">{(result.confidence * 100).toFixed(1)}%</span>
            </div>

            <div className="flex gap-4 mb-8">
              <button onClick={() => setResult(null)} className="btn-secondary">New Prediction</button>
              <button onClick={() => navigate('/history')} className="btn-primary flex items-center gap-2">
                View Full History <ArrowRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-left">
              {/* Top 3 Crops List */}
              {result.top_3_crops && result.top_3_crops.length > 1 && (
                <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-4">Top Alternatives</h3>
                  <div className="space-y-3">
                    {result.top_3_crops.map((c: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                        <span className="text-slate-300 capitalize">{c.crop}</span>
                        <span className="text-emerald-400 font-medium">{(c.probability * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimization Suggestions */}
              {result.optimization_suggestions && result.optimization_suggestions.length > 0 && (
                <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-4">Resource Optimization</h3>
                  <ul className="space-y-2">
                    {result.optimization_suggestions.map((sug: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                        <ArrowRight size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {result.explanation && result.explanation.top_features && result.explanation.top_features.length > 0 && (
              <div className="mt-8 w-full text-left bg-slate-900/40 p-6 rounded-2xl border border-white/5 relative">
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-3">
                  {result.explanation.explanation_source === 'shap' ? (
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      SHAP AI Explanation
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-full">
                      Fallback Explanation
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-4">Why this crop?</h3>
                <p className="text-sm text-slate-300 mb-6 italic border-l-2 border-emerald-500/50 pl-3">
                  "{result.explanation.summary}"
                </p>
                
                <div className="space-y-4">
                  {result.explanation.top_features.map((feature: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                        <span>{feature.feature}</span>
                        <span>{(feature.impact * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                          style={{ width: `${Math.min(100, feature.impact * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render Suitability Results */}
      {activeTab === 'suitability' && suitabilityResult && (
        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden animate-[slide-up_0.5s_ease-out] mb-8">
           <div className="flex flex-col items-center text-center py-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${suitabilityResult.status === 'Suitable' ? 'bg-emerald-500/20 border-2 border-emerald-400' : suitabilityResult.status === 'Partially Suitable' ? 'bg-amber-500/20 border-2 border-amber-400' : 'bg-rose-500/20 border-2 border-rose-400'}`}>
              {suitabilityResult.status === 'Suitable' && <CheckCircle2 className="text-emerald-400" size={40} />}
              {suitabilityResult.status === 'Partially Suitable' && <AlertTriangle className="text-amber-400" size={40} />}
              {suitabilityResult.status === 'Not Suitable' && <X className="text-rose-400" size={40} />}
            </div>
            
            <h2 className="text-2xl text-slate-300 mb-2">Suitability for <span className="capitalize">{formData.target_crop}</span></h2>
            <div className={`text-4xl font-extrabold mb-6 capitalize ${suitabilityResult.status === 'Suitable' ? 'text-emerald-400' : suitabilityResult.status === 'Partially Suitable' ? 'text-amber-400' : 'text-rose-400'}`}>
              {suitabilityResult.status}
            </div>

            <p className="text-slate-300 mb-8 max-w-xl">
              {suitabilityResult.reason}
            </p>

            {suitabilityResult.limiting_factors && suitabilityResult.limiting_factors.length > 0 && (
              <div className="w-full max-w-2xl text-left bg-slate-900/40 p-6 rounded-2xl border border-rose-500/20">
                <h3 className="text-lg font-bold text-white mb-4 text-rose-400">Limiting Factors</h3>
                <ul className="space-y-3">
                  {suitabilityResult.limiting_factors.map((factor: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                      <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8">
              <button onClick={() => setSuitabilityResult(null)} className="btn-secondary">Check Another Crop</button>
            </div>
          </div>
        </div>
      )}

      {/* Input Form Area - Hide only if a result is showing */}
      {((activeTab === 'predict' && !result) || (activeTab === 'suitability' && !suitabilityResult)) && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CloudLightning className="text-blue-400" size={20} /> Weather Intelligence Integration
            </h2>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 flex items-center gap-3 glass-input px-4 focus-within:border-emerald-500/50">
                <MapPin size={18} className="text-slate-500 shrink-0" />
                <input 
                  type="text" 
                  className="w-full bg-transparent outline-none text-white placeholder:text-slate-500" 
                  placeholder="Enter city or village (e.g., Guntur)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <button 
                type="button" 
                onClick={handleFetchWeather}
                disabled={isFetchingWeather}
                className="btn-secondary whitespace-nowrap flex items-center justify-center gap-2 px-6"
              >
                {isFetchingWeather ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Fetching...</>
                ) : (
                  <>Auto-Fetch Weather</>
                )}
              </button>
            </div>

            {weatherError && (
              <div className="text-sm text-rose-400 mb-4">{weatherError}</div>
            )}

            {weatherInfo && (
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl animate-[fade-in_0.3s_ease-out]">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-blue-300">
                    Data Fetched Successfully
                  </div>
                  {weatherInfo.is_demo_result ? (
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded font-bold border border-amber-500/30">
                      Demo Mode
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-bold border border-emerald-500/30">
                      Source: OpenWeather Live
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3 text-sm text-slate-300">
                  <div><span className="text-slate-500">Temp:</span> {weatherInfo.temperature}°C</div>
                  <div><span className="text-slate-500">Humidity:</span> {weatherInfo.humidity}%</div>
                  <div><span className="text-slate-500">Condition:</span> {weatherInfo.weather_condition}</div>
                </div>
                <div className="flex items-start gap-2 text-amber-300/80 bg-amber-500/5 p-3 rounded-lg text-sm border border-amber-500/10">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>Scientific Notice:</strong> {weatherInfo.warning} You may manually override the auto-filled numbers below if you have accurate agricultural sensors.
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={activeTab === 'predict' ? handlePredictSubmit : handleSuitabilitySubmit} className="glass-panel p-8 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-6">
              {activeTab === 'predict' ? 'Crop Prediction Parameters' : 'Soil & Climate Conditions'}
            </h2>
            
            {activeTab === 'suitability' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <span className="text-amber-400"><Search size={18} /></span>
                  Target Crop to Check
                </label>
                <input 
                  type="text" 
                  className="glass-input w-full border-amber-500/30 focus:border-amber-400"
                  placeholder="e.g., Rice, Cotton, Coffee"
                  value={formData.target_crop} 
                  onChange={e => setFormData({...formData, target_crop: e.target.value})} 
                  required={activeTab === 'suitability'}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inputs.map((input) => (
                <div key={input.name}>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <span className={['temperature', 'humidity', 'rainfall'].includes(input.name) && weatherInfo ? "text-blue-400" : "text-emerald-400"}>
                      {input.icon}
                    </span>
                    {input.label}
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    min={['N', 'P', 'K', 'humidity', 'rainfall'].includes(input.name) ? "0" : input.name === 'ph' ? "0" : "-50"}
                    max={input.name === 'humidity' ? "100" : input.name === 'ph' ? "14" : "1000"}
                    className={`glass-input w-full ${['temperature', 'humidity', 'rainfall'].includes(input.name) && weatherInfo ? 'border-blue-500/30 bg-blue-900/10' : ''}`}
                    placeholder={input.placeholder}
                    value={(formData as any)[input.name]} 
                    onChange={e => setFormData({...formData, [input.name]: e.target.value})} 
                    required 
                  />
                </div>
              ))}
              
              {activeTab === 'predict' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <span className="text-emerald-400"><Sun size={18} /></span>
                    Season
                  </label>
                  <select 
                    className="glass-input w-full appearance-none bg-black/40"
                    value={formData.season} 
                    onChange={e => setFormData({...formData, season: e.target.value})}
                  >
                    <option value="Kharif" className="bg-slate-900">Kharif (June/July – October/November)</option>
                    <option value="Rabi" className="bg-slate-900">Rabi (October/November – March/April)</option>
                    <option value="Zaid" className="bg-slate-900">Zaid (March/April – June)</option>
                    <option value="Whole Year" className="bg-slate-900">Whole Year (January – December)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <button 
                type="submit" 
                disabled={isLoading}
                className={`btn-primary flex items-center gap-2 px-8 py-3 text-lg disabled:opacity-50 ${activeTab === 'suitability' ? 'from-amber-500 to-orange-600 hover:shadow-amber-500/25 border-amber-400/20' : ''}`}
              >
                {isLoading ? 'Analyzing Data...' : activeTab === 'predict' ? 'Generate Prediction' : 'Check Suitability'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
