import React, { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Activity } from 'lucide-react';
import { binanceFeed } from '../services/binanceFeed';

interface HeaderBarProps {
  cashBalance: number;
  totalDistributedLoans: number;
  totalCollectedInterest: number;
  openPositionsCount: number;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  cashBalance,
  totalDistributedLoans,
  totalCollectedInterest,
  openPositionsCount,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
}) => {
  const [dataHealth, setDataHealth] = useState(() => binanceFeed.getDataHealth());

  useEffect(() => {
    const timer = setInterval(() => {
      setDataHealth(binanceFeed.getDataHealth());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const isConnected = dataHealth.status === 'CONNECTED';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-xs px-3 sm:px-4 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-xs">
            ₺
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                TEFECİ
              </span>
              {/* Data Health Live Pulse */}
              <div
                title={`Binance Futures Public WSS (${dataHealth.activeStreamsCount} Akış: Ticker, BookTicker, MarkPrice, Kline, AggTrade, ForceOrder, OI)`}
                className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>WSS {dataHealth.latencyMs}ms</span>
              </div>
            </div>
            <div className="text-[10px] text-purple-700 font-semibold tracking-wider uppercase">
              Kripto Mıntıkası
            </div>
          </div>
        </div>

        {/* Zone 2: Kasa & Finansal Özet (Tabular Numerals) */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-medium">Kasa Bakiyesi</span>
            <span className="text-sm sm:text-base font-bold font-mono text-purple-900 tabular-nums">
              ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="hidden xs:flex flex-col items-end border-l border-purple-100 pl-2 sm:pl-3">
            <span className="text-[10px] text-slate-500 font-medium">Dağıtılan Borç</span>
            <span className="text-xs sm:text-sm font-semibold font-mono text-pink-700 tabular-nums">
              ${totalDistributedLoans.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-end border-l border-purple-100 pl-2 sm:pl-3">
            <span className="text-[10px] text-slate-500 font-medium">Faiz Geliri</span>
            <span className="text-xs sm:text-sm font-semibold font-mono text-emerald-700 tabular-nums">
              +${totalCollectedInterest.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Zone 3: Actions (Sound & Settings) */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={onOpenSettings}
            aria-label="Ayarlar"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </header>
  );
};
