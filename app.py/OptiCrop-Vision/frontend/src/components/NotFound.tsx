import { Compass, Home } from "lucide-react";

interface NotFoundProps {
  onBackToHome?: () => void;
}

export default function NotFound({ onBackToHome }: NotFoundProps) {
  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-slate-950 border border-slate-800 rounded-3xl shadow-xl space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
        <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: "12s" }} />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-display text-white">Cultivation Route Not Found</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          The agricultural catalog coordinates or view path you requested does not exist or has been relocated by an administrator.
        </p>
      </div>

      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      )}
    </div>
  );
}
