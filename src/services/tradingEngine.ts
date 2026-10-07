import {
  DecisionLog,
  ExitReason,
  IndicatorSnapshot,
  Loan,
  MarketTicker,
  NewsEvent,
  OrderSide,
  Position,
  TraderId,
  TraderProfile,
} from '../types';
import { binanceFeed } from './binanceFeed';
import { CHARACTER_DATA, CIRAK_DIALOGUES, TRADER_DIALOGUES } from './dialogues';
import { soundService } from './soundAndTts';
import { StrategyBrain } from './strategyBrain';

export const INITIAL_TRADERS: Record<TraderId, TraderProfile> = {
  selo: {
    id: 'selo',
    name: 'Selo Roket',
    nickname: 'Selo',
    title: 'Hacim & Momentum Canavarı',
    strategyDescription: 'Hacim fırladığı an 25x-50x kaldıraçla trende biner. Parasız duramaz, sırada ilk bekleyen o!',
    avatarBg: CHARACTER_DATA.selo.avatarBg,
    accentColor: CHARACTER_DATA.selo.accentColor,
    badgeIcon: CHARACTER_DATA.selo.badgeIcon,
    preferredCoins: ['PEPEUSDT', 'DOGEUSDT', 'SOLUSDT'],
    maxLeverage: 50,
    baseWinRate: 51,
    balance: 0,
    initialBalance: 0,
    totalPnl: 0,
    winCount: 0,
    lossCount: 0,
    activeLoanId: null,
    fearLevel: 5,
    isAggressive: true,
    statusText: 'Kapıda borç sırasında 1. sırada bekliyor...',
    riskMode: 'NORMAL',
    consecutiveLosses: 0,
    lastLossTimestamp: 0,
    symbolCooldowns: {},
    creditRating: 'A',
    expectedCollectionRate: 88,
    voicePitch: CHARACTER_DATA.selo.voicePitch,
    voiceRate: CHARACTER_DATA.selo.voiceRate,
  },
  mehmet: {
    id: 'mehmet',
    name: 'Fitilci Mehmet',
    nickname: 'Fitilci',
    title: 'Stop & Fitil Avcısı',
    strategyDescription: 'Ani likidasyon fitilleri, aşırı iğneler ve stop patlamaları sonrası ters yöne girer.',
    avatarBg: CHARACTER_DATA.mehmet.avatarBg,
    accentColor: CHARACTER_DATA.mehmet.accentColor,
    badgeIcon: CHARACTER_DATA.mehmet.badgeIcon,
    preferredCoins: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    maxLeverage: 25,
    baseWinRate: 58,
    balance: 0,
    initialBalance: 0,
    totalPnl: 0,
    winCount: 0,
    lossCount: 0,
    activeLoanId: null,
    fearLevel: 20,
    isAggressive: false,
    statusText: 'Kapıda borç sırasında 2. sırada bekliyor...',
    riskMode: 'NORMAL',
    consecutiveLosses: 0,
    lastLossTimestamp: 0,
    symbolCooldowns: {},
    creditRating: 'AA',
    expectedCollectionRate: 94,
    voicePitch: CHARACTER_DATA.mehmet.voicePitch,
    voiceRate: CHARACTER_DATA.mehmet.voiceRate,
  },
  kemal: {
    id: 'kemal',
    name: 'Tahta Kemal',
    nickname: 'Kemal',
    title: 'Emir Defteri & Spoof Dedektifi',
    strategyDescription: 'Derinlikteki balina duvarlarını ve sahte emirleri izler. Duvar yönüne scalp atar.',
    avatarBg: CHARACTER_DATA.kemal.avatarBg,
    accentColor: CHARACTER_DATA.kemal.accentColor,
    badgeIcon: CHARACTER_DATA.kemal.badgeIcon,
    preferredCoins: ['BTCUSDT', 'ETHUSDT'],
    maxLeverage: 20,
    baseWinRate: 62,
    balance: 0,
    initialBalance: 0,
    totalPnl: 0,
    winCount: 0,
    lossCount: 0,
    activeLoanId: null,
    fearLevel: 10,
    isAggressive: false,
    statusText: 'Kapıda borç sırasında 3. sırada bekliyor...',
    riskMode: 'NORMAL',
    consecutiveLosses: 0,
    lastLossTimestamp: 0,
    symbolCooldowns: {},
    creditRating: 'AA',
    expectedCollectionRate: 94,
    voicePitch: CHARACTER_DATA.kemal.voicePitch,
    voiceRate: CHARACTER_DATA.kemal.voiceRate,
  },
  nuri: {
    id: 'nuri',
    name: 'Fonlama Nuri',
    nickname: 'Nuri',
    title: 'Funding & OI Kurdu',
    strategyDescription: 'Aşırı pozitif/negatif fonlama oranlarına ters oynar, kalabalığı ezen balinayı takip eder.',
    avatarBg: CHARACTER_DATA.nuri.avatarBg,
    accentColor: CHARACTER_DATA.nuri.accentColor,
    badgeIcon: CHARACTER_DATA.nuri.badgeIcon,
    preferredCoins: ['SOLUSDT', 'DOGEUSDT', 'PEPEUSDT'],
    maxLeverage: 18,
    baseWinRate: 64,
    balance: 0,
    initialBalance: 0,
    totalPnl: 0,
    winCount: 0,
    lossCount: 0,
    activeLoanId: null,
    fearLevel: 15,
    isAggressive: false,
    statusText: 'Kapıda borç sırasında 4. sırada bekliyor...',
    riskMode: 'NORMAL',
    consecutiveLosses: 0,
    lastLossTimestamp: 0,
    symbolCooldowns: {},
    creditRating: 'AAA',
    expectedCollectionRate: 98,
    voicePitch: CHARACTER_DATA.nuri.voicePitch,
    voiceRate: CHARACTER_DATA.nuri.voiceRate,
  },
  sevil: {
    id: 'sevil',
    name: 'Madam Sevil',
    nickname: 'Madam',
    title: 'Range & Bollinger Kraliçesi',
    strategyDescription: 'Bollinger bantlarının dışına taşan fiyatı yakalayıp merkeze dönüş oynar. Soğukkanlıdır.',
    avatarBg: CHARACTER_DATA.sevil.avatarBg,
    accentColor: CHARACTER_DATA.sevil.accentColor,
    badgeIcon: CHARACTER_DATA.sevil.badgeIcon,
    preferredCoins: ['ETHUSDT', 'BTCUSDT', 'SOLUSDT'],
    maxLeverage: 15,
    baseWinRate: 66,
    balance: 0,
    initialBalance: 0,
    totalPnl: 0,
    winCount: 0,
    lossCount: 0,
    activeLoanId: null,
    fearLevel: 10,
    isAggressive: false,
    statusText: 'Kapıda borç sırasında 5. sırada bekliyor...',
    riskMode: 'NORMAL',
    consecutiveLosses: 0,
    lastLossTimestamp: 0,
    symbolCooldowns: {},
    creditRating: 'AAA',
    expectedCollectionRate: 98,
    voicePitch: CHARACTER_DATA.sevil.voicePitch,
    voiceRate: CHARACTER_DATA.sevil.voiceRate,
  },
};

type StateListener = () => void;

class TradingEngine {
  public cashBalance: number = 50000;
  public startingCash: number = 50000;
  public totalDistributedLoans: number = 0;
  public totalCollectedInterest: number = 0;

  public traders: Record<TraderId, TraderProfile> = JSON.parse(JSON.stringify(INITIAL_TRADERS));
  public openPositions: Position[] = [];
  public loans: Loan[] = [];
  public newsFeed: NewsEvent[] = [];
  public decisionLogs: DecisionLog[] = [];

  private listeners: Set<StateListener> = new Set();
  private loopInterval: number | null = null;
  private lastLoanEvaluationTime: number = Date.now();

  constructor() {
    this.init();
  }

  private init() {
    // Restore past decision logs from localStorage for the "Sicil" ledger
    if (typeof window !== 'undefined') {
      try {
        const savedLogs = localStorage.getItem('tefeci_decision_logs');
        if (savedLogs) {
          this.decisionLogs = JSON.parse(savedLogs);
        }
      } catch {
        // ignore
      }
    }

    // Listen to Binance live ticker
    binanceFeed.onMarketUpdate((ticker) => {
      this.updatePositionsWithPrice(ticker);
    });

    // Listen to Binance real whale liquidations (forceOrder stream)
    binanceFeed.onLiquidation((liq) => {
      const notional = liq.price * liq.qty;
      if (notional > 40000) {
        this.addNewsEvent({
          type: 'LIQUIDATION',
          speaker: 'cirak',
          speakerName: 'Cilet Ferhat',
          message: `Binance Balina Avı! ${liq.symbol} tahtasında az önce ${liq.qty.toFixed(0)} adet ($${notional.toFixed(0)}) ${
            liq.side === 'SELL' ? 'LONG' : 'SHORT'
          } likidasyon fitili patlatıldı!`,
          badge: `💥 BİNANCE LİKİT ($${(notional / 1000).toFixed(0)}k)`,
        });
        this.notify();
      }
    });

    // Main evaluation loop every 1.5 seconds
    if (typeof window !== 'undefined') {
      this.loopInterval = window.setInterval(() => {
        this.tickEngine();
      }, 1500);
    }

    // Populate initial loan queue at the door
    this.initializeLoanQueue();

    // Add initial greeting news
    this.addNewsEvent({
      type: 'LOAN_REQUEST',
      speaker: 'cirak',
      speakerName: 'Cilet Ferhat',
      message: 'Usta! 5 trader da kapıya dizildi, sermayesiz bekliyorlar! İlk borcu kime veriyoruz?',
      badge: 'KAPIDA KUYRUK VAR',
      urgent: true,
    });
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Initialize loan requests for all traders in queue order
  public initializeLoanQueue() {
    const queueOrder: { id: TraderId; principal: number; term: number }[] = [
      { id: 'selo', principal: 2500, term: 8 },
      { id: 'mehmet', principal: 2000, term: 12 },
      { id: 'kemal', principal: 3000, term: 15 },
      { id: 'nuri', principal: 2200, term: 10 },
      { id: 'sevil', principal: 2800, term: 14 },
    ];

    queueOrder.forEach((item, index) => {
      const initialInterestRate = 20; // 20%
      const loan: Loan = {
        id: `loan_init_${item.id}`,
        traderId: item.id,
        principal: item.principal,
        interestRate: initialInterestRate,
        termMinutes: item.term,
        createdAt: Date.now() + index * 100,
        dueAt: Date.now() + item.term * 60 * 1000,
        remainingSeconds: item.term * 60,
        accruedInterest: (item.principal * initialInterestRate) / 100,
        totalDue: item.principal + (item.principal * initialInterestRate) / 100,
        status: 'PROPOSAL',
        negotiationRounds: 0,
        actionsTaken: [],
      };
      this.loans.push(loan);
    });
  }

  public resetGame(newStartingCash: number = 50000) {
    this.startingCash = newStartingCash;
    this.cashBalance = newStartingCash;
    this.totalDistributedLoans = 0;
    this.totalCollectedInterest = 0;
    this.traders = JSON.parse(JSON.stringify(INITIAL_TRADERS));
    this.openPositions = [];
    this.loans = [];
    this.newsFeed = [];
    // Note: keep decisionLogs in history for the Sicil ledger, or user can clear if wanted

    this.initializeLoanQueue();

    this.addNewsEvent({
      type: 'LOAN_REQUEST',
      speaker: 'cirak',
      speakerName: 'Cilet Ferhat',
      message: `Mahalle sıfırlandı usta! Kasa ${newStartingCash.toLocaleString()} USDT ile açıldı. Traderlar yine kapıda sırada!`,
      badge: 'YENİ SEZON',
      urgent: true,
    });
    this.notify();
  }

  // Dynamic Position Management: Breakeven, ATR Trailing, Time Stop, Liquidation, TP
  private updatePositionsWithPrice(ticker: MarketTicker) {
    let stateChanged = false;
    const now = Date.now();

    for (let i = this.openPositions.length - 1; i >= 0; i--) {
      const pos = this.openPositions[i];
      if (pos.symbol !== ticker.symbol) continue;

      const trader = this.traders[pos.traderId];
      pos.currentPrice = ticker.lastPrice;
      pos.markPrice = ticker.markPrice || ticker.lastPrice;

      // PnL calculation
      if (pos.side === 'LONG') {
        pos.unrealizedPnl = (pos.currentPrice - pos.entryPrice) * pos.size;
        pos.liquidationDistancePercent =
          ((pos.currentPrice - pos.liquidationPrice) / pos.currentPrice) * 100;
      } else {
        pos.unrealizedPnl = (pos.entryPrice - pos.currentPrice) * pos.size;
        pos.liquidationDistancePercent =
          ((pos.liquidationPrice - pos.currentPrice) / pos.currentPrice) * 100;
      }

      pos.roePercent = (pos.unrealizedPnl / pos.margin) * 100;

      // Track Max Favorable / Adverse Excursion
      if (pos.unrealizedPnl > pos.maxFavorableExcursion) {
        pos.maxFavorableExcursion = pos.unrealizedPnl;
      }
      if (pos.unrealizedPnl < pos.maxAdverseExcursion) {
        pos.maxAdverseExcursion = pos.unrealizedPnl;
      }

      // Calculate R multiple progress
      const currentR =
        pos.initialRiskAmount > 0 ? pos.unrealizedPnl / pos.initialRiskAmount : 0;

      // 1. BREAKEVEN STOP TRIGGER (+1.0R): move stop to entry price + fee cushion
      if (currentR >= 1.0 && !pos.isBreakevenSet) {
        pos.isBreakevenSet = true;
        const feeCushion = pos.entryPrice * 0.0008;
        pos.stopLossPrice =
          pos.side === 'LONG'
            ? Number((pos.entryPrice + feeCushion).toFixed(pos.entryPrice < 1 ? 6 : 2))
            : Number((pos.entryPrice - feeCushion).toFixed(pos.entryPrice < 1 ? 6 : 2));

        this.addNewsEvent({
          type: 'RISK_ALERT',
          speaker: 'cirak',
          speakerName: 'Cilet Ferhat',
          message: `${trader.name} ${pos.symbol} işleminde +1R kâr gördü! Stopu başa başa çekti, risksiz modda!`,
          badge: '🛡️ BAŞA BAŞ STOP',
        });
      }

      // 2. ATR TRAILING STOP TRIGGER (+1.6R)
      if (currentR >= 1.6) {
        pos.isTrailingActive = true;
        const trailingDist = Math.max(pos.entryIndicators.atr * 1.0, pos.entryPrice * 0.005);
        if (pos.side === 'LONG') {
          const candidateStop = pos.currentPrice - trailingDist;
          if (candidateStop > pos.stopLossPrice) {
            pos.stopLossPrice = Number(candidateStop.toFixed(pos.entryPrice < 1 ? 6 : 2));
          }
        } else {
          const candidateStop = pos.currentPrice + trailingDist;
          if (candidateStop < pos.stopLossPrice) {
            pos.stopLossPrice = Number(candidateStop.toFixed(pos.entryPrice < 1 ? 6 : 2));
          }
        }
      }

      // 3. TIME STOP: Scalp lasting > 8 minutes without positive progress
      const holdingDuration = (now - pos.openTime) / 1000;
      if (holdingDuration >= 480 && pos.unrealizedPnl <= 0) {
        this.closePosition(pos, ticker.lastPrice, 'TIME_STOP');
        stateChanged = true;
        continue;
      }

      // 4. CHECK LIQUIDATION
      const isLiquidated =
        (pos.side === 'LONG' && pos.markPrice <= pos.liquidationPrice) ||
        (pos.side === 'SHORT' && pos.markPrice >= pos.liquidationPrice);

      if (isLiquidated) {
        this.liquidatePosition(pos, ticker.lastPrice);
        stateChanged = true;
        continue;
      }

      // 5. CHECK TAKE PROFIT
      const hitTp =
        (pos.side === 'LONG' && pos.currentPrice >= pos.takeProfitPrice) ||
        (pos.side === 'SHORT' && pos.currentPrice <= pos.takeProfitPrice);

      if (hitTp) {
        this.closePosition(pos, pos.takeProfitPrice, 'TAKE_PROFIT');
        stateChanged = true;
        continue;
      }

      // 6. CHECK STOP LOSS (Breakeven, Trailing, or Initial Stop)
      const hitSl =
        (pos.side === 'LONG' && pos.currentPrice <= pos.stopLossPrice) ||
        (pos.side === 'SHORT' && pos.currentPrice >= pos.stopLossPrice);

      if (hitSl) {
        let exitReason: ExitReason = 'STOP_LOSS';
        if (pos.isTrailingActive) exitReason = 'TRAILING_STOP';
        else if (pos.isBreakevenSet) exitReason = 'BREAKEVEN';

        this.closePosition(pos, pos.stopLossPrice, exitReason);
        stateChanged = true;
        continue;
      }
    }

    if (stateChanged) {
      this.notify();
    }
  }

  // Periodic engine tick: evaluate trader strategies & loans
  private tickEngine() {
    const now = Date.now();

    // 1. Update active loans countdown and interest
    this.updateLoans();

    // 2. Evaluate strategy entries using StrategyBrain
    const symbols = binanceFeed.getSymbols();
    for (const traderId of Object.keys(this.traders) as TraderId[]) {
      const trader = this.traders[traderId];
      const currentPosCount = this.openPositions.filter((p) => p.traderId === traderId).length;
      if (trader.balance >= 100 && currentPosCount < 2) {
        for (const symbol of symbols) {
          const indicators = binanceFeed.getIndicators(symbol);
          const ticker = binanceFeed.getTicker(symbol);
          if (indicators && ticker && ticker.lastPrice > 0) {
            this.evaluateTraderStrategy(trader, symbol, ticker, indicators);
          }
        }
      }

      // 3. Trader ran out of money and has no pending/active loan: Re-enter loan queue!
      if (
        trader.balance < 100 &&
        !trader.activeLoanId &&
        !this.loans.some((l) => l.traderId === trader.id && l.status === 'PROPOSAL') &&
        now - this.lastLoanEvaluationTime > 10000
      ) {
        this.triggerLoanRequest(trader);
        this.lastLoanEvaluationTime = now;
      }
    }

    this.notify();
  }

  // Strategy Execution Engine powered by StrategyBrain
  private evaluateTraderStrategy(
    trader: TraderProfile,
    symbol: string,
    ticker: MarketTicker,
    ind: IndicatorSnapshot
  ) {
    // Avoid double entry on same symbol
    const existing = this.openPositions.find(
      (p) => p.traderId === trader.id && p.symbol === symbol
    );
    if (existing) return;

    // Evaluate trade candidate using StrategyBrain
    const evalResult = StrategyBrain.evaluate(trader, symbol, ticker, ind);
    if (!evalResult.shouldEnter || !evalResult.side) {
      return;
    }

    // Ensure trader has enough balance
    if (trader.balance < evalResult.margin) {
      return;
    }

    // Deduct margin from trader balance
    trader.balance -= evalResult.margin;

    // Calculate isolated liquidation price
    const liqPrice =
      evalResult.side === 'LONG'
        ? evalResult.entryPrice * (1 - (1 / evalResult.recommendedLeverage) * 0.94)
        : evalResult.entryPrice * (1 + (1 / evalResult.recommendedLeverage) * 0.94);

    const newPos: Position = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      traderId: trader.id,
      symbol,
      side: evalResult.side,
      entryPrice: evalResult.entryPrice,
      currentPrice: evalResult.entryPrice,
      markPrice: ticker.markPrice || evalResult.entryPrice,
      size: evalResult.unitSize,
      notional: evalResult.notionalSize,
      margin: evalResult.margin,
      leverage: evalResult.recommendedLeverage,
      liquidationPrice: liqPrice,
      takeProfitPrice: evalResult.takeProfitPrice,
      stopLossPrice: evalResult.stopLossPrice,
      initialStopLossPrice: evalResult.stopLossPrice,
      initialRiskAmount: evalResult.riskAmount,
      rDistance: evalResult.initialStopDistance,
      unrealizedPnl: 0,
      roePercent: 0,
      openTime: Date.now(),
      status: 'OPEN',
      strategyReason: evalResult.reason,
      entryIndicators: { ...ind },
      confidenceScore: evalResult.confidenceScore,
      marketRegime: evalResult.marketRegime,
      isBreakevenSet: false,
      isTrailingActive: false,
      maxFavorableExcursion: 0,
      maxAdverseExcursion: 0,
      liquidationDistancePercent:
        evalResult.side === 'LONG'
          ? ((evalResult.entryPrice - liqPrice) / evalResult.entryPrice) * 100
          : ((liqPrice - evalResult.entryPrice) / evalResult.entryPrice) * 100,
    };

    this.openPositions.unshift(newPos);
    trader.statusText = `${symbol} ${evalResult.side} ${evalResult.recommendedLeverage}x açtı (Puan: ${evalResult.confidenceScore})`;

    // Speech & News
    const entryQuotes = TRADER_DIALOGUES[trader.id].tradeEntry;
    const quote = entryQuotes[Math.floor(Math.random() * entryQuotes.length)];
    soundService.speak(quote, trader.id);

    this.addNewsEvent({
      type: 'WHALE_ALERT',
      speaker: trader.id,
      speakerName: trader.name,
      message: `${symbol} tahtasında ${evalResult.recommendedLeverage}x ${evalResult.side} pozisyon açtı! (Teyit: ${evalResult.confidenceScore}/100, Rejim: ${evalResult.marketRegime}). "${quote}"`,
      badge: `${symbol} ${evalResult.recommendedLeverage}x [${evalResult.confidenceScore}p]`,
    });
  }

  // Close position (TP, SL, Breakeven, Trailing, TimeStop)
  private closePosition(
    pos: Position,
    exitPrice: number,
    exitReason: ExitReason
  ) {
    const trader = this.traders[pos.traderId];
    const pnl =
      pos.side === 'LONG'
        ? (exitPrice - pos.entryPrice) * pos.size
        : (pos.entryPrice - exitPrice) * pos.size;

    // Deduct VIP 0 taker futures fee (0.05% * 2)
    const fee = pos.notional * 0.0005 * 2;
    const finalPnl = pnl - fee;

    trader.balance += pos.margin + finalPnl;
    trader.totalPnl += finalPnl;

    const isWin = finalPnl >= 0;

    if (isWin) {
      trader.winCount++;
      // Reset consecutive losses and restore Normal mode
      trader.consecutiveLosses = 0;
      trader.riskMode = 'NORMAL';

      soundService.playCashSound();
      const winQuotes = TRADER_DIALOGUES[trader.id].bigWinShout;
      const winSpeech = winQuotes[Math.floor(Math.random() * winQuotes.length)];
      soundService.speak(winSpeech, trader.id);

      this.addNewsEvent({
        type: 'MASSIVE_PROFIT',
        speaker: trader.id,
        speakerName: trader.name,
        message: `${pos.symbol} pozisyonunu +${finalPnl.toFixed(1)} USDT (%${pos.roePercent.toFixed(1)}) kârla kapattı [${exitReason}]! "${winSpeech}"`,
        badge: `+${finalPnl.toFixed(0)} USDT [${exitReason}]`,
      });

      this.checkAutoLoanRepayment(trader);
    } else {
      trader.lossCount++;
      // Adaptive Risk Memory
      trader.consecutiveLosses++;
      trader.lastLossTimestamp = Date.now();
      trader.symbolCooldowns[pos.symbol] = Date.now() + 60000; // 60s revenge trade lock!
      trader.riskMode = StrategyBrain.evaluateRiskMode(trader);

      if (trader.consecutiveLosses >= 2) {
        this.addNewsEvent({
          type: 'RISK_ALERT',
          speaker: 'cirak',
          speakerName: 'Cilet Ferhat',
          message: `Usta! ${trader.name} peş peşe ${trader.consecutiveLosses}. kez stop oldu! Risk modu BUZDA olarak kilitlendi, kaldıraç düşürüldü!`,
          badge: '❄️ RİSK KİLİDİ: BUZDA',
          urgent: true,
        });
      } else {
        this.addNewsEvent({
          type: 'LIQUIDATION',
          speaker: trader.id,
          speakerName: trader.name,
          message: `${pos.symbol} stop oldu! Zarar: ${finalPnl.toFixed(1)} USDT [${exitReason}].`,
          badge: `${finalPnl.toFixed(0)} USDT [${exitReason}]`,
        });
      }
    }

    // Dynamically update Trader Credit Rating and Collection Rate
    const credit = StrategyBrain.evaluateCreditRating(trader);
    trader.creditRating = credit.rating;
    trader.expectedCollectionRate = credit.collectionRate;

    // Record Decision Log for the "Sicil" ledger
    this.recordDecisionLog(pos, exitPrice, finalPnl, exitReason, fee);

    // Remove from open positions
    this.openPositions = this.openPositions.filter((p) => p.id !== pos.id);
  }

  // Liquidation Event
  private liquidatePosition(pos: Position, markPrice: number) {
    const trader = this.traders[pos.traderId];
    trader.lossCount++;
    trader.consecutiveLosses++;
    trader.lastLossTimestamp = Date.now();
    trader.symbolCooldowns[pos.symbol] = Date.now() + 60000;
    trader.riskMode = StrategyBrain.evaluateRiskMode(trader);
    trader.totalPnl -= pos.margin;

    const credit = StrategyBrain.evaluateCreditRating(trader);
    trader.creditRating = credit.rating;
    trader.expectedCollectionRate = credit.collectionRate;

    soundService.playLiquidationSound();
    const liqQuotes = TRADER_DIALOGUES[trader.id].liquidationShout;
    const speech = liqQuotes[Math.floor(Math.random() * liqQuotes.length)];
    soundService.speak(speech, trader.id);

    const cirakAlert = CIRAK_DIALOGUES.liquidationAlert(
      trader.name,
      pos.symbol,
      pos.margin
    );

    this.addNewsEvent({
      type: 'LIQUIDATION',
      speaker: 'cirak',
      speakerName: 'Cilet Ferhat',
      message: `${cirakAlert} "${speech}"`,
      badge: `💥 LİKİDASYON -${pos.margin.toFixed(0)} USDT`,
      urgent: true,
    });

    // Record detailed failure analysis
    this.recordDecisionLog(pos, markPrice, -pos.margin, 'LIQUIDATED', pos.notional * 0.001);

    this.openPositions = this.openPositions.filter((p) => p.id !== pos.id);

    // If trader balance is completely blown, prompt loan immediately!
    if (trader.balance < 100 && !trader.activeLoanId) {
      setTimeout(() => this.triggerLoanRequest(trader), 1500);
    }
  }

  // Record trade into Decision Logs (saved to localStorage for Sicil)
  private recordDecisionLog(
    pos: Position,
    exitPrice: number,
    realizedPnl: number,
    exitReason: ExitReason,
    feePaid: number
  ) {
    const trader = this.traders[pos.traderId];
    const ind = pos.entryIndicators;
    const holdingDuration = Math.round((Date.now() - pos.openTime) / 1000);
    const rMultiple = pos.initialRiskAmount > 0 ? realizedPnl / pos.initialRiskAmount : 0;

    let whyFailed = '';
    let improvementNote = '';

    if (realizedPnl < 0) {
      if (exitReason === 'LIQUIDATED') {
        whyFailed = `Aşırı yüksek kaldıraç (${pos.leverage}x) ve ani iğne nedeniyle mark price ${pos.liquidationPrice.toFixed(2)} seviyesini deldi. Giriş RSI: ${ind.rsi14}, Teyit Puanı: ${pos.confidenceScore}.`;
        improvementNote = `Kaldıraç ${Math.max(5, Math.floor(pos.leverage * 0.6))}x seviyesine çekilmeli, ATR tamponu genişletilmelidir.`;
      } else {
        whyFailed = `Piyasa dalgalanması stop seviyesini (${pos.stopLossPrice.toFixed(2)}) tetikledi. Rejim: ${pos.marketRegime}.`;
        improvementNote = `Fitil gürültüsüne karşı stop mesafesi 1.5x ATR genişletilmeli ve karşıt yönlü hacim barları filtrelenmelidir.`;
      }
    } else {
      whyFailed = `Pozisyon hedefe ulaştı. Kapanış nedeni: ${exitReason}.`;
      improvementNote = `Strateji beklendiği gibi çalıştı (+${rMultiple.toFixed(2)}R getiri).`;
    }

    const log: DecisionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      traderId: trader.id,
      traderName: trader.name,
      symbol: pos.symbol,
      side: pos.side,
      leverage: pos.leverage,
      entryPrice: pos.entryPrice,
      exitPrice,
      margin: pos.margin,
      realizedPnl,
      roePercent: (realizedPnl / pos.margin) * 100,
      exitReason,
      strategyName: trader.title,
      entryIndicators: ind,
      whyOpened: pos.strategyReason,
      whyFailedOrWon: whyFailed,
      aiImprovementNote: improvementNote,
      confidenceScore: pos.confidenceScore || 70,
      marketRegime: pos.marketRegime || 'RANGE',
      holdingDurationSeconds: holdingDuration,
      feePaid,
      rMultiple,
    };

    this.decisionLogs.unshift(log);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'tefeci_decision_logs',
          JSON.stringify(this.decisionLogs.slice(0, 150))
        );
      } catch {
        // ignore
      }
    }
  }

  // Loan Mechanics
  public triggerLoanRequest(trader: TraderProfile) {
    if (trader.activeLoanId) return;

    const principal = Math.round((1500 + Math.random() * 2500) / 100) * 100;
    const initialInterestRate = 20; // 20%
    const termMinutes = 10; // 10 minutes

    const loan: Loan = {
      id: `loan_${Date.now()}_${trader.id}`,
      traderId: trader.id,
      principal,
      interestRate: initialInterestRate,
      termMinutes,
      createdAt: Date.now(),
      dueAt: Date.now() + termMinutes * 60 * 1000,
      remainingSeconds: termMinutes * 60,
      accruedInterest: (principal * initialInterestRate) / 100,
      totalDue: principal + (principal * initialInterestRate) / 100,
      status: 'PROPOSAL',
      negotiationRounds: 0,
      actionsTaken: [],
    };

    this.loans.unshift(loan);

    // Speak loan request
    const quotes = TRADER_DIALOGUES[trader.id].loanRequest;
    const speech = quotes[Math.floor(Math.random() * quotes.length)];
    soundService.speak(speech, trader.id);

    this.addNewsEvent({
      type: 'LOAN_REQUEST',
      speaker: trader.id,
      speakerName: trader.name,
      message: `Kapıya geldi: "${speech}" (${principal} USDT borç talep ediyor)`,
      badge: `BORÇ TALEBİ: ${principal} USDT`,
      urgent: true,
    });

    this.notify();
  }

  // Shark accepts or proposes loan to trader
  public submitLoanOffer(
    loanId: string,
    proposedRate: number,
    proposedTermMinutes: number
  ): { accepted: boolean; counterOffer?: { rate: number; term: number; speech: string } } {
    const loan = this.loans.find((l) => l.id === loanId);
    if (!loan) return { accepted: false };

    const trader = this.traders[loan.traderId];

    // Check if player has enough money in cash balance
    if (this.cashBalance < loan.principal) {
      soundService.speak('Usta kasada para kalmadı, adamı boş çevirmek zorundayız!', 'cirak');
      return { accepted: false };
    }

    // Trader counter-offer negotiation logic
    loan.negotiationRounds++;
    const acceptsDirectly =
      loan.negotiationRounds >= 3 ||
      trader.id === 'selo' || // Selo never bargains much
      proposedRate <= 15; // Low rate accepted immediately

    if (acceptsDirectly) {
      // Finalized agreement
      loan.interestRate = proposedRate;
      loan.termMinutes = proposedTermMinutes;
      loan.dueAt = Date.now() + proposedTermMinutes * 60 * 1000;
      loan.remainingSeconds = proposedTermMinutes * 60;
      loan.accruedInterest = (loan.principal * proposedRate) / 100;
      loan.totalDue = loan.principal + loan.accruedInterest;
      loan.status = 'ACTIVE';

      // Money moves: from Shark's cash to Trader's trading balance
      this.cashBalance -= loan.principal;
      this.totalDistributedLoans += loan.principal;
      trader.balance += loan.principal;
      trader.activeLoanId = loan.id;
      trader.statusText = `${loan.principal}$ sermayeyle masaya oturdu, scalp arıyor...`;

      soundService.playGavelSound();
      soundService.playCashSound();

      const acceptSpeech = `Anlaştık tefeci! ${loan.principal} USDT'yi aldım, %${proposedRate} faiziyle vadesinde teslim edeceğim.`;
      soundService.speak(acceptSpeech, trader.id);

      this.addNewsEvent({
        type: 'LOAN_REQUEST',
        speaker: trader.id,
        speakerName: trader.name,
        message: `Anlaşma sağlandı! ${loan.principal} USDT borç verildi (%${proposedRate} faiz, ${proposedTermMinutes} dk vade). Masaya geçti!`,
        badge: `BORÇ AKTİF: ${loan.principal} USDT`,
      });

      this.notify();
      return { accepted: true };
    } else {
      // Trader counters!
      const counterRate = Math.max(8, proposedRate - (3 + Math.floor(Math.random() * 5)));
      const counterTerm = Math.min(25, proposedTermMinutes + 5);

      const counterQuotes = TRADER_DIALOGUES[trader.id].counterOffer;
      let counterSpeech = counterQuotes[Math.floor(Math.random() * counterQuotes.length)];
      counterSpeech = counterSpeech.replace('{rate}', counterRate.toString());

      loan.lastCounterOffer = {
        principal: loan.principal,
        interestRate: counterRate,
        termMinutes: counterTerm,
        speech: counterSpeech,
      };

      soundService.speak(counterSpeech, trader.id);
      this.notify();

      return {
        accepted: false,
        counterOffer: {
          rate: counterRate,
          term: counterTerm,
          speech: counterSpeech,
        },
      };
    }
  }

  // Update loans timer & check for OVERDUE status
  private updateLoans() {
    const now = Date.now();
    for (const loan of this.loans) {
      if (loan.status === 'ACTIVE') {
        const remaining = Math.max(0, Math.round((loan.dueAt - now) / 1000));
        loan.remainingSeconds = remaining;

        if (remaining <= 0) {
          loan.status = 'OVERDUE';
          const trader = this.traders[loan.traderId];

          soundService.playSirenSound();
          const alert = CIRAK_DIALOGUES.overdueAlert(trader.name, loan.totalDue);
          soundService.speak(alert, 'cirak');

          this.addNewsEvent({
            type: 'LOAN_OVERDUE',
            speaker: 'cirak',
            speakerName: 'Cilet Ferhat',
            message: alert,
            badge: `⚠️ VADE GEÇTİ: ${loan.totalDue.toFixed(0)} USDT`,
            urgent: true,
          });
        }
      }
    }
  }

  // Action 1: "Çırağı Gönder, Korkut"
  public executeThreatAction(loanId: string) {
    const loan = this.loans.find((l) => l.id === loanId);
    if (!loan) return;

    const trader = this.traders[loan.traderId];
    loan.actionsTaken.push('THREATENED');
    trader.fearLevel = 100;

    soundService.playSirenSound();
    const threatDialogues = TRADER_DIALOGUES[trader.id].threatReaction;
    const traderReply = threatDialogues[Math.floor(Math.random() * threatDialogues.length)];

    soundService.speak(CIRAK_DIALOGUES.threatSuccess(trader.name), 'cirak');
    setTimeout(() => soundService.speak(traderReply, trader.id), 1800);

    // If trader has enough balance, they panic-pay immediately!
    if (trader.balance >= loan.totalDue) {
      this.settleLoan(loan, trader);
    } else {
      // Partial payment with all available balance
      const partialPayment = Math.max(0, trader.balance - 100);
      if (partialPayment > 0) {
        trader.balance -= partialPayment;
        this.cashBalance += partialPayment;
        loan.totalDue -= partialPayment;
      }

      this.addNewsEvent({
        type: 'THREAT',
        speaker: 'cirak',
        speakerName: 'Cilet Ferhat',
        message: `Ferhat dükkanı bastı! ${trader.name} titredi: "${traderReply}". Kısmi ödeme alındı.`,
        badge: '🗡️ ÇIRAK BASTI',
      });
    }

    this.notify();
  }

  // Action 2: "Faizi Katla / Vadeyi Uzat"
  public executeDoubleInterestAction(loanId: string) {
    const loan = this.loans.find((l) => l.id === loanId);
    if (!loan) return;

    loan.actionsTaken.push('INTEREST_DOUBLED');
    loan.interestRate = Math.round(loan.interestRate * 1.6);
    loan.dueAt = Date.now() + 8 * 60 * 1000; // extend by 8 minutes
    loan.remainingSeconds = 8 * 60;
    loan.status = 'ACTIVE';

    const addedInterest = (loan.principal * (loan.interestRate / 100));
    loan.accruedInterest = addedInterest;
    loan.totalDue = loan.principal + addedInterest;

    soundService.playGavelSound();
    const trader = this.traders[loan.traderId];
    const alert = `Usta faizi katladık! ${trader.name} artık tam ${loan.totalDue.toFixed(0)} USDT borçlu. Vade uzatıldı!`;
    soundService.speak(alert, 'cirak');

    this.addNewsEvent({
      type: 'LOAN_OVERDUE',
      speaker: 'cirak',
      speakerName: 'Cilet Ferhat',
      message: `${trader.name} için faiz %${loan.interestRate}'ye katlandı! Yeni borç: ${loan.totalDue.toFixed(0)} USDT.`,
      badge: `📈 FAİZ KATLANDI (%${loan.interestRate})`,
    });

    this.notify();
  }

  // Check if trader can auto-pay loan
  private checkAutoLoanRepayment(trader: TraderProfile) {
    if (!trader.activeLoanId) return;
    const loan = this.loans.find((l) => l.id === trader.activeLoanId);
    if (!loan) return;

    if (trader.balance >= loan.totalDue + 500) {
      this.settleLoan(loan, trader);
    }
  }

  // Settle loan successfully
  private settleLoan(loan: Loan, trader: TraderProfile) {
    trader.balance -= loan.totalDue;
    this.cashBalance += loan.totalDue;
    this.totalCollectedInterest += loan.accruedInterest;
    loan.status = 'PAID';
    trader.activeLoanId = null;

    soundService.playCashSound();
    const repayQuotes = TRADER_DIALOGUES[trader.id].debtRepayment;
    const speech = repayQuotes[Math.floor(Math.random() * repayQuotes.length)];
    soundService.speak(speech, trader.id);

    this.addNewsEvent({
      type: 'LOAN_PAID',
      speaker: trader.id,
      speakerName: trader.name,
      message: `Borç ödendi! ${loan.totalDue.toFixed(0)} USDT tahsil edildi (Kâr faiz: +${loan.accruedInterest.toFixed(0)} USDT). "${speech}"`,
      badge: `💰 BORÇ TAHSİL EDİLDİ`,
    });

    this.notify();
  }

  private addNewsEvent(event: Omit<NewsEvent, 'id' | 'timestamp'>) {
    const fullEvent: NewsEvent = {
      id: `news_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      ...event,
    };
    this.newsFeed.unshift(fullEvent);
    if (this.newsFeed.length > 50) this.newsFeed.pop();
  }

  public destroy() {
    if (this.loopInterval) clearInterval(this.loopInterval);
  }
}

export const tradingEngine = new TradingEngine();
