import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, Camera, Bot, ArrowRight, ShieldCheck, Zap, Leaf } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center animate-[fade-in_0.5s_ease-out] w-full pt-10 pb-20">
      
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 mb-8 backdrop-blur-sm">
          <Sprout size={18} />
          <span className="text-sm font-medium tracking-wide">Smart Agricultural Production</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 mb-6 leading-tight">
          Empowering Farmers with AI
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          OptiCrop is your ultimate AI-powered farming companion. Predict the best crops for your soil, diagnose leaf diseases instantly, and get expert agricultural advice.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link to="/login" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group">
            Get Started
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="px-8 py-4 rounded-xl text-lg font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-full sm:w-auto text-center">
            Learn More
          </a>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6 relative z-10 w-full mt-10">
        
        {/* Feature 1 */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all group">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
            <Leaf className="text-emerald-400" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Crop Prediction</h3>
          <p className="text-slate-400 leading-relaxed">
            Enter your soil's NPK values, pH, and environmental factors to get highly accurate AI recommendations for what to plant.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-teal-500/30 hover:bg-white/[0.04] transition-all group">
          <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20 mb-6 group-hover:scale-110 transition-transform">
            <Camera className="text-teal-400" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Leaf Diagnosis</h3>
          <p className="text-slate-400 leading-relaxed">
            Snap a picture of a sick plant leaf. Our vision AI will instantly identify the disease and provide organic remedies.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all group">
          <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 mb-6 group-hover:scale-110 transition-transform">
            <Bot className="text-cyan-400" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">AI Assistant</h3>
          <p className="text-slate-400 leading-relaxed">
            Chat with a knowledgeable agricultural AI assistant directly tailored to help you optimize yield and answer farming queries.
          </p>
        </div>

      </div>

      {/* Trust Badges */}
      <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 text-sm font-medium text-slate-400 relative z-10 px-4">
        <div className="flex items-center gap-2"><ShieldCheck size={20} /> Secure Platform</div>
        <div className="flex items-center gap-2"><Zap size={20} /> Real-time Analysis</div>
        <div className="flex items-center gap-2"><Sprout size={20} /> Sustainable Growth</div>
      </div>
    </div>
  );
};
