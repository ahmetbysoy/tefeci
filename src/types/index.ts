export type TraderId = 'mehmet' | 'kemal' | 'nuri' | 'selo' | 'sevil';
export type CharacterId = TraderId | 'cirak';

export interface TraderProfile {
  id: TraderId;
  name: string;
  nickname: string;
  title: string;
  strategyDescription: string;
  avatarBg: string;
  accentColor: string;
  badgeIcon: string;
  preferredCoins: string[];
  maxLeverage: number;
  baseWinRate: number;
  balance: number;
  initialBalance: number;
  totalPnl: number;
  winCount: number;
  lossCount: number;
  activeLoanId: string | null;
  fearLevel: number; // 0 to 100, affects risk taking
  isAggressive: boolean;
  statusText: string;
  // TTS profile
  voicePitch: number;
  voiceRate: number;
}

export type OrderSide = 'LONG' | 'SHORT';

export interface IndicatorSnapshot {
  timestamp: number;
  symbol: string;
  currentPrice: number;
  rsi14: number;
  ema20: number;
  ema50: number;
  bbUpper: number;
  bbLower: number;
  bbMiddle: number;
  orderbookImbalance: number; // bidVol / (bidVol + askVol)
  fundingRate: number;
  spikeShadowRatio: number; // (high - close) or (close - low) vs body
  volumeSurgeRatio: number; // current 1m vol / 20 period avg vol
}

export interface Position {
  id: string;
  traderId: TraderId;
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  currentPrice: number;
  markPrice: number;
  size: number; // in coin units
  notional: number; // size * entryPrice
  margin: number; // notional / leverage
  leverage: number;
  liquidationPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  unrealizedPnl: number;
  roePercent: number;
  openTime: number;
  closeTime?: number;
  closePrice?: number;
  realizedPnl?: number;
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
  strategyReason: string;
  entryIndicators: IndicatorSnapshot;
  liquidationDistancePercent: number;
}

export interface Loan {
  id: string;
  traderId: TraderId;
  principal: number; // Anapara USDT
  interestRate: number; // % e.g. 15 for 15%
  termMinutes: number; // Vade (dakika)
  createdAt: number;
  dueAt: number;
  remainingSeconds: number;
  accruedInterest: number;
  totalDue: number; // principal + accruedInterest
  status: 'PROPOSAL' | 'ACTIVE' | 'OVERDUE' | 'PAID' | 'DEFAULTED';
  negotiationRounds: number;
  lastCounterOffer?: {
    principal: number;
    interestRate: number;
    termMinutes: number;
    speech: string;
  };
  actionsTaken: ('THREATENED' | 'INTEREST_DOUBLED' | 'TERM_EXTENDED')[];
}

export interface DecisionLog {
  id: string;
  timestamp: number;
  traderId: TraderId;
  traderName: string;
  symbol: string;
  side: OrderSide;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  margin: number;
  realizedPnl: number;
  roePercent: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'LIQUIDATED' | 'MARGIN_CUT';
  strategyName: string;
  entryIndicators: IndicatorSnapshot;
  whyOpened: string;
  whyFailedOrWon: string;
  aiImprovementNote: string;
}

export interface NewsEvent {
  id: string;
  timestamp: number;
  type: 'LIQUIDATION' | 'LOAN_REQUEST' | 'LOAN_OVERDUE' | 'THREAT' | 'MASSIVE_PROFIT' | 'WHALE_ALERT' | 'LOAN_PAID';
  speaker: CharacterId;
  speakerName: string;
  message: string;
  badge: string;
  urgent?: boolean;
}

export interface MarketTicker {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  fundingRate: number;
  markPrice: number;
  bestBid: number;
  bestAsk: number;
  bidDepthVolume: number;
  askDepthVolume: number;
  orderbookRatio: number; // bid / (bid + ask)
  updatedAt: number;
}

export interface AppState {
  cashBalance: number; // Tefecinin kendi kasası
  startingBalance: number;
  totalDistributedLoans: number;
  totalCollectedInterest: number;
  selectedSymbols: string[];
  soundEnabled: boolean;
  ttsEnabled: boolean;
  jargonLevel: 'orta' | 'sert';
}
