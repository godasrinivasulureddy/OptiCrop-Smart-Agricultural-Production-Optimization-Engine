import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import { Sprout, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing reset token. Please request a new link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    setStatus('loading');
    setMessage('');
    
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }
      
      setStatus('success');
      setMessage('Your password has been successfully reset. You can now log in.');
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
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
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Reset Password</h1>
          <p className="text-slate-400">Choose a new, secure password.</p>
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
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-2">
                <CheckCircle2 className="text-emerald-400" size={32} />
              </div>
              <p className="text-slate-300 leading-relaxed px-4">{message}</p>
              <p className="text-xs text-slate-500">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-black/20 border border-white/10 rounded-lg transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <Lock className="text-slate-500 shrink-0" size={18} />
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    className="bg-transparent w-full outline-none text-white placeholder-slate-400" 
                    placeholder="••••••••"
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                    disabled={!token || status === 'loading'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                    tabIndex={-1}
                    disabled={!token || status === 'loading'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-black/20 border border-white/10 rounded-lg transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <Lock className="text-slate-500 shrink-0" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="bg-transparent w-full outline-none text-white placeholder-slate-400" 
                    placeholder="••••••••"
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required
                    disabled={!token || status === 'loading'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                    tabIndex={-1}
                    disabled={!token || status === 'loading'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={!token || status === 'loading'}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Updating...' : (
                  <>
                    Update Password
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {!token && status === 'error' && (
            <p className="mt-6 text-center text-sm text-slate-400">
              Need a new link?{' '}
              <Link to="/forgot-password" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Forgot password
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
