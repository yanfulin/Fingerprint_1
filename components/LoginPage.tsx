import React from 'react';
import { Fingerprint, ArrowRight } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8 group ring-1 ring-white/5">
                        <Fingerprint className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
                        System Access
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Access the Kernel Telemetry Visualizer Dashboard
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl ring-1 ring-white/5">
                    <div className="space-y-6">
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                        >
                            <span>Enter System</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>

                <p className="text-center text-slate-600 text-xs mt-8">
                    Restricted Area • Authorized Personnel Only
                </p>
            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
        </div>
    );
};
