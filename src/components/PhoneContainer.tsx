import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Monitor, Download } from 'lucide-react';

interface PhoneContainerProps {
  children: React.ReactNode;
  activeTab: string;
}

export function PhoneContainer({ children, activeTab }: PhoneContainerProps) {
  const [time, setTime] = useState('');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-0 sm:py-6 selection:bg-indigo-500 selection:text-white">
      {/* Top Floating Control Bar to switch between Phone Mockup and Full-Width View */}
      <header className="w-full max-w-md px-4 py-2 flex items-center justify-between text-xs text-slate-400 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">TeamEngine Kirana</span>
          <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-medium border border-indigo-500/30">
            Mobile v2.0
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href="/download/team_engine.zip"
            download="team_engine.zip"
            className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition shadow-sm font-medium"
            title="Download complete source code as a ZIP archive"
          >
            <Download size={13} className="text-emerald-400" />
            <span>Download ZIP</span>
          </a>

          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition shadow-sm"
            title={isPhoneFrame ? "Switch to Full-Width Responsive View" : "Switch to Smartphone Device Frame"}
          >
            {isPhoneFrame ? (
              <>
                <Monitor size={13} className="text-indigo-400" />
                <span>Full View</span>
              </>
            ) : (
              <>
                <Smartphone size={13} className="text-emerald-400" />
                <span>Phone View</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[430px] my-0 sm:my-2 rounded-none sm:rounded-[44px] shadow-2xl border-0 sm:border-[8px] border-slate-800 ring-1 ring-slate-700/50 bg-slate-900 overflow-hidden flex flex-col h-screen sm:h-[880px]'
            : 'max-w-4xl mx-auto rounded-none sm:rounded-2xl border-0 sm:border border-slate-800 bg-slate-900 min-h-screen sm:min-h-[90vh] flex flex-col'
        }`}
      >
        {/* Smartphone Status Bar (Dynamic Island style) */}
        {isPhoneFrame && (
          <div className="flex-none bg-slate-900 text-slate-300 px-6 pt-3 pb-1 flex items-center justify-between select-none border-b border-slate-800/40">
            <span className="text-xs font-semibold tracking-tight">{time || '09:41'}</span>

            {/* Dynamic Island Pill */}
            <div className="h-5 px-3 bg-black/80 rounded-full flex items-center justify-center gap-2 border border-slate-800 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-medium text-slate-300 capitalize">{activeTab}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[10px] font-bold">5G</span>
              <Wifi size={13} />
              <Battery size={15} className="text-slate-200" />
            </div>
          </div>
        )}

        {/* Inner Phone Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}
