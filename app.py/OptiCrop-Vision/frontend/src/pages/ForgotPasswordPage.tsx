import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import { Sprout, Mail, ArrowRight, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setDevToken(null);
    
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to process request');
      }
      
      setStatus('success');
      setMessage(data.message);
      
      if (data.dev_reset_token) {
        setDevToken(data.dev_reset_token);
      }
      
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-[fade-in_0.5s_ease-out]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Sprout className="text-emerald-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Forgot Password</h1>
          <p className="text-slate-400">We'll send you a link to reset your password.</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          {status === 'error' && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-rose-300">{message}</p>
            </div>
          )}

          {status === 'success' ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-2">
                <CheckCircle2 className="text-emerald-400" size={32} />
              </div>
              <p className="text-slate-300 leading-relaxed px-4">{message}</p>
              
              {/* Dev Mode Only Token Box */}
              {devToken && (
                <div className="mt-6 text-left">
                  <p className="text-xs text-yellow-400/80 mb-2 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                    <Terminal size={14} /> Dev Mode Token
                  </p>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4 relative group">
                    <div className="text-xs text-slate-400 break-all pr-12 font-mono">
                      {window.location.origin}/reset-password?token={devToken}
                    </div>
                    <Link 
                      to={`/reset-password?token=${devToken}`}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 transition-colors"
                    >
                      Go
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <Link to="/login" className="btn-primary inline-flex items-center justify-center gap-2">
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-black/20 border border-white/10 rounded-lg transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <Mail className="text-slate-500 shrink-0" size={18} />
                  <input 
                    type="email" 
                    className="bg-transparent w-full outline-none text-white placeholder-slate-400" 
                    placeholder="you@example.com"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Sending...' : (
                  <>
                    Send Reset Link
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {status !== 'success' && (
            <p className="mt-6 text-center text-sm text-slate-400">
              Remember your password?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
