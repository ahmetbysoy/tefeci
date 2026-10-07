import React, { useState } from 'react';
import { Position, TraderProfile } from '../types';
import { ArrowUpRight, ArrowDownRight, Target, Zap, ExternalLink, LineChart } from 'lucide-react';
import { CHARACTER_DATA } from '../services/dialogues';
import { TradingViewModal } from './TradingViewModal';

interface PositionsTabProps {
  positions: Position[];
  traders: Record<string, TraderProfile>;
}

export const PositionsTab: React.FC<PositionsTabProps> = ({
  positions,
  traders,
}) => {
  const [selectedChartSymbol, setSelectedChartSymbol] = useState<string | null>(null);

  if (positions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-purple-100 text-center shadow-xs">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl text-purple-600">
          ⚡
        </div>
        <h3 className="font-display font-bold text-slate-800 text-base mb-1">
          Şu An Açık Pozisyon Yok
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Traderlar Binance Futures tahtalarını tarıyor. Uygun sinyal oluştuğunda masaya oturup scalp pozisyonlarını açacaklar!
        </p>
      </div>
    );
  }

  // Calculate total unrealized PnL
  const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);

  return (
    <div className="space-y-3.5">
      {/* Live PnL Header */}
      <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-500 font-medium">Toplam Canlı PnL</span>
          <div
            className={`font-mono font-bold text-xl tabular-nums ${
              totalUnrealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)} USDT
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl font-medium">
          <Zap className="w-3.5 h-3.5" />
          <span>{positions.length} Aktif Pozisyon</span>
        </div>
      </div>

      {/* Position Cards */}
      <div className="space-y-3">
        {positions.map((pos) => {
          const char = CHARACTER_DATA[pos.traderId];
          const isProfitable = pos.unrealizedPnl >= 0;
          const tvUrl = `https://www.tradingview.com/chart/?symbol=BINANCE:${encodeURIComponent(pos.symbol)}.P`;

          return (
            <div
              key={pos.id}
              className="bg-white rounded-3xl p-4 border border-purple-100 shadow-xs hover:border-purple-200 transition-all"
            >
              {/* Top Row: Symbol, Side, Leverage, TradingView Button, PnL */}
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${char.avatarBg} flex items-center justify-center text-lg text-white shadow-xs shrink-0`}
                  >
                    {char.badgeIcon}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-display font-black text-slate-900 text-sm tracking-tight">
                        {pos.symbol}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          pos.side === 'LONG'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {pos.side} {pos.leverage}x
                      </span>

                      {/* Prominent TradingView Button (opens in new page) */}
                      <a
                        href={tvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${pos.symbol} TradingView grafiğini yeni sekmede aç`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-[11px] font-extrabold shadow-xs shadow-blue-500/20 active:scale-[0.97] transition-all"
                      >
                        <LineChart className="w-3.5 h-3.5" />
                        <span>TradingView</span>
                        <ExternalLink className="w-3 h-3 opacity-90" />
                      </a>

                      {/* Modal Preview Button */}
                      <button
                        onClick={() => setSelectedChartSymbol(pos.symbol)}
                        title="Uygulama İçi Grafik Aç"
                        className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <span className="text-[10px] font-semibold underline text-purple-700">Önizle</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {char.name} ({char.nickname}) · {char.title}
                    </div>
                  </div>
                </div>

                {/* Unrealized PnL badge */}
                <div className="text-right ml-auto">
                  <div
                    className={`font-mono font-bold text-base tabular-nums flex items-center justify-end gap-0.5 ${
                      isProfitable ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isProfitable ? (
                      <ArrowUpRight className="w-4 h-4 inline" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 inline" />
                    )}
                    <span>
                      {isProfitable ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] font-bold font-mono tabular-nums ${
                      isProfitable ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isProfitable ? '+' : ''}%{pos.roePercent.toFixed(1)} ROE
                  </div>
                </div>
              </div>

              {/* Price Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 text-xs mb-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Giriş Fiyatı</span>
                  <span className="font-mono font-semibold text-slate-800 tabular-nums">
                    ${pos.entryPrice.toFixed(pos.entryPrice < 1 ? 6 : 2)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Güncel Fiyat</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    ${pos.currentPrice.toFixed(pos.currentPrice < 1 ? 6 : 2)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-rose-500 block font-medium">Likidasyon</span>
                  <span className="font-mono font-semibold text-rose-600 tabular-nums">
                    ${pos.liquidationPrice.toFixed(pos.liquidationPrice < 1 ? 6 : 2)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-purple-600 block font-medium">İzole Marjin</span>
                  <span className="font-mono font-semibold text-purple-900 tabular-nums">
                    ${pos.margin.toFixed(1)} USDT
                  </span>
                </div>
              </div>

              {/* Strategy Reason */}
              <div className="text-[11px] text-slate-600 bg-purple-50/40 p-2 rounded-xl border border-purple-100/50 flex items-start gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{pos.strategyReason}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-App Interactive TradingView Modal */}
      {selectedChartSymbol && (
        <TradingViewModal
          symbol={selectedChartSymbol}
          onClose={() => setSelectedChartSymbol(null)}
        />
      )}
    </div>
  );
};
