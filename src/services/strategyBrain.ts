import {
  IndicatorSnapshot,
  MarketRegime,
  MarketTicker,
  OrderSide,
  RiskMode,
  TraderProfile,
} from '../types';

export interface StrategyEvaluationResult {
  shouldEnter: boolean;
  side: OrderSide | null;
  confidenceScore: number;
  reason: string;
  marketRegime: MarketRegime;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  initialStopDistance: number; // dollar distance per unit
  recommendedLeverage: number;
  riskAmount: number; // total USDT risked on initial stop
  notionalSize: number; // total notional USDT
  unitSize: number; // quantity in coin
  margin: number;
}

export class StrategyBrain {
  // Detect overarching market regime
  public static detectMarketRegime(
    ticker: MarketTicker,
    ind: IndicatorSnapshot
  ): MarketRegime {
    const emaDiffPct =
      ind.ema50 > 0 ? (ind.ema20 - ind.ema50) / ind.ema50 : 0;

    // If bands are wide and EMAs show clear divergence
    if (ind.bbWidth >= 0.025 && emaDiffPct > 0.002 && ticker.lastPrice > ind.ema20) {
      return 'TREND_UP';
    }
    if (ind.bbWidth >= 0.025 && emaDiffPct < -0.002 && ticker.lastPrice < ind.ema20) {
      return 'TREND_DOWN';
    }
    return 'RANGE';
  }

  // Get current risk mode based on consecutive losses
  public static evaluateRiskMode(trader: TraderProfile): RiskMode {
    if (trader.consecutiveLosses >= 2) return 'BUZDA';
    if (trader.consecutiveLosses === 1) return 'TEMKINLI';
    return 'NORMAL';
  }

  // Calculate dynamic Trader Credit Rating & Expected Collection Probability
  public static evaluateCreditRating(trader: TraderProfile): {
    rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'CCC' | 'D';
    collectionRate: number;
  } {
    const totalTrades = trader.winCount + trader.lossCount;
    const winRate = totalTrades > 0 ? (trader.winCount / totalTrades) * 100 : trader.baseWinRate;

    if (trader.consecutiveLosses >= 3 || (trader.balance === 0 && trader.totalPnl < -2000)) {
      return { rating: 'D', collectionRate: 25 };
    }
    if (trader.consecutiveLosses >= 2 || winRate < 45) {
      return { rating: 'CCC', collectionRate: 55 };
    }
    if (trader.consecutiveLosses === 1 || winRate < 52) {
      return { rating: 'BBB', collectionRate: 78 };
    }
    if (winRate >= 65 && trader.totalPnl > 1000) {
      return { rating: 'AAA', collectionRate: 98 };
    }
    if (winRate >= 58 && trader.totalPnl >= 0) {
      return { rating: 'AA', collectionRate: 94 };
    }
    return { rating: 'A', collectionRate: 88 };
  }

  // Evaluate candidate trade with real Binance Futures Layer (forceOrder, CVD, Open Interest)
  public static evaluate(
    trader: TraderProfile,
    symbol: string,
    ticker: MarketTicker,
    ind: IndicatorSnapshot
  ): StrategyEvaluationResult {
    const now = Date.now();
    const regime = this.detectMarketRegime(ticker, ind);
    const riskMode = this.evaluateRiskMode(trader);

    // 1. Check revenge trading cooldown on this specific symbol
    const cooldownUntil = trader.symbolCooldowns?.[symbol] || 0;
    if (now < cooldownUntil) {
      return this.noTrade(
        regime,
        0,
        `Rövanş engeli devrede: ${symbol} coini için soğuma süresi (${Math.ceil(
          (cooldownUntil - now) / 1000
        )} sn kaldı).`
      );
    }

    // 2. Base Baraj by Risk Mode
    let threshold = 68;
    let leverageFactor = 1.0;
    let riskBudgetPct = 0.25;

    if (riskMode === 'TEMKINLI') {
      threshold = 74;
      leverageFactor = 0.7;
      riskBudgetPct = 0.18;
    } else if (riskMode === 'BUZDA') {
      threshold = 82;
      leverageFactor = 0.45;
      riskBudgetPct = 0.12;
    }

    let side: OrderSide | null = null;
    let score = 0;
    let reason = '';

    switch (trader.id) {
      case 'mehmet': {
        // Fitilci Mehmet: Stop avı + Binance Gerçek Likidasyon Akışı (forceOrder)
        let longScore = 0;
        let shortScore = 0;

        // Long points
        if (ind.spikeShadowRatio >= 2.0 && ticker.lastPrice <= ind.bbLower * 1.002) longScore += 30;
        if (ind.rsi14 <= 36) longScore += 20;
        if (ind.orderbookImbalance >= 0.52) longScore += 15;
        if (ticker.lastPrice >= ticker.lowPrice + ind.atr * 0.3) longScore += 15;

        // REAL FORCE-ORDER STREAM CONFIRMATION:
        // If longs were flushed via forced market sell orders, the stop-hunt is complete!
        if (ind.liquidationBurstSide === 'LONG') {
          longScore += 25; // Massive whale liquidation exhaustion bonus!
        }

        // Short points
        if (ind.spikeShadowRatio >= 2.0 && ticker.lastPrice >= ind.bbUpper * 0.998) shortScore += 30;
        if (ind.rsi14 >= 64) shortScore += 20;
        if (ind.orderbookImbalance <= 0.48) shortScore += 15;
        if (ticker.lastPrice <= ticker.highPrice - ind.atr * 0.3) shortScore += 15;

        if (ind.liquidationBurstSide === 'SHORT') {
          shortScore += 25; // Short squeeze liquidation exhaustion bonus!
        }

        // Contradiction filter
        if (longScore > 40 && shortScore > 40) {
          return this.noTrade(regime, 0, 'Kararsız çift yönlü fitil doji tespit edildi, çelişki nedeniyle iptal.');
        }

        if (longScore > shortScore && longScore >= threshold) {
          side = 'LONG';
          score = Math.min(100, longScore);
          const liqText = ind.liquidationBurstSide === 'LONG' ? ' [Likidasyon Squeeze Teyitli]' : '';
          reason = `Alt fitil ${ind.spikeShadowRatio.toFixed(1)}x, RSI ${ind.rsi14}, stop avı süpürüldü${liqText} (Teyit: ${score}/100).`;
        } else if (shortScore > longScore && shortScore >= threshold) {
          side = 'SHORT';
          score = Math.min(100, shortScore);
          const liqText = ind.liquidationBurstSide === 'SHORT' ? ' [Likidasyon Squeeze Teyitli]' : '';
          reason = `Üst fitil ${ind.spikeShadowRatio.toFixed(1)}x, RSI ${ind.rsi14}, tepe stop avı reddi${liqText} (Teyit: ${score}/100).`;
        }
        break;
      }

      case 'kemal': {
        // Tahta Kemal: Orderbook imbalance + CVD Taker Doğrulama
        let longScore = 0;
        let shortScore = 0;

        // Spread check
        if (ind.spreadPercent > 0.08) {
          return this.noTrade(regime, 0, `Tahta makası çok açık (%${ind.spreadPercent.toFixed(3)}), duvar sahte olabilir.`);
        }

        if (ind.orderbookImbalance >= 0.65) longScore += 35;
        if (ticker.lastPrice >= ind.ema20) longScore += 20;
        if (ind.volumeSurgeRatio >= 1.15) longScore += 15;
        // CVD Taker delta confirmation: Aggressive buyers actually hitting the asks!
        if (ind.cvdRatio >= 0.58) longScore += 25;

        if (ind.orderbookImbalance <= 0.35) shortScore += 35;
        if (ticker.lastPrice <= ind.ema20) shortScore += 20;
        if (ind.volumeSurgeRatio >= 1.15) shortScore += 15;
        // CVD Taker delta confirmation: Aggressive sellers hitting the bids!
        if (ind.cvdRatio <= 0.42) shortScore += 25;

        // Spoof Wall Detection: Orderbook says bids are huge, but CVD shows aggressive selling -> Trap!
        if (ind.orderbookImbalance > 0.65 && ind.cvdRatio < 0.40) {
          return this.noTrade(regime, 0, 'Sahte alış duvarı (spoofing) tespit edildi! Alıcı yok, satış basılıyor.');
        }

        if (longScore >= threshold && longScore > shortScore) {
          side = 'LONG';
          score = Math.min(100, longScore);
          reason = `Alış kademelerinde balina duvarı (%${(ind.orderbookImbalance * 100).toFixed(0)}), CVD alıcı baskısı %${(ind.cvdRatio * 100).toFixed(0)} (Teyit: ${score}/100).`;
        } else if (shortScore >= threshold && shortScore > longScore) {
          side = 'SHORT';
          score = Math.min(100, shortScore);
          reason = `Satış blok kademeleri (%${((1 - ind.orderbookImbalance) * 100).toFixed(0)}), CVD satıcı baskısı (Teyit: ${score}/100).`;
        }
        break;
      }

      case 'nuri': {
        // Fonlama Nuri: Funding Rate + Open Interest (OI Delta) Birleşik Stratejisi
        let longScore = 0;
        let shortScore = 0;

        if (ind.fundingRate <= -0.0001) {
          longScore += 35;
          if (regime !== 'TREND_DOWN') longScore += 20;
          if (ind.rsi14 >= 28 && ind.rsi14 <= 62) longScore += 15;
          // Open Interest confirmation: If OI is rising (+oiDelta) during negative funding, trapped shorts are piling in!
          if (ind.oiDelta5m > 0) longScore += 25;
        }

        if (ind.fundingRate >= 0.0002) {
          shortScore += 35;
          if (regime !== 'TREND_UP') shortScore += 20;
          if (ind.rsi14 <= 72 && ind.rsi14 >= 38) shortScore += 15;
          // Open Interest confirmation: If OI is rising during positive funding, herd longs are ripe for a dump!
          if (ind.oiDelta5m > 0) shortScore += 25;
        }

        if (longScore >= threshold) {
          side = 'LONG';
          score = Math.min(100, longScore);
          const oiText = ind.oiDelta5m > 0 ? ` [OI +${ind.oiDelta5m.toFixed(0)}]` : '';
          reason = `Negatif fonlama (%${(ind.fundingRate * 100).toFixed(4)})${oiText}, short squeeze matematiği çalıştı (Teyit: ${score}/100).`;
        } else if (shortScore >= threshold) {
          side = 'SHORT';
          score = Math.min(100, shortScore);
          const oiText = ind.oiDelta5m > 0 ? ` [OI +${ind.oiDelta5m.toFixed(0)}]` : '';
          reason = `Pozitif fonlama (%${(ind.fundingRate * 100).toFixed(4)})${oiText}, long kalabalık sıkışması (Teyit: ${score}/100).`;
        }
        break;
      }

      case 'selo': {
        // Selo Roket: Volume surge + CVD Taker Momentum
        let longScore = 0;
        let shortScore = 0;

        if (ind.volumeSurgeRatio >= 2.0) {
          const volPoints = Math.min(35, Math.floor(ind.volumeSurgeRatio * 12));

          // Long momentum with CVD taker buyer confirmation
          if (ticker.lastPrice > ind.ema20 && ind.ema20 >= ind.ema50) {
            longScore += volPoints;
            if (ind.cvdRatio >= 0.62) longScore += 30; // true aggressive taker buying!
            if (ind.rsi14 >= 52 && ind.rsi14 <= 75) longScore += 20;
            if (regime === 'TREND_UP') longScore += 15;
          }

          // Short momentum with CVD taker seller confirmation
          if (ticker.lastPrice < ind.ema20 && ind.ema20 <= ind.ema50) {
            shortScore += volPoints;
            if (ind.cvdRatio <= 0.38) shortScore += 30; // true aggressive taker selling!
            if (ind.rsi14 <= 48 && ind.rsi14 >= 25) shortScore += 20;
            if (regime === 'TREND_DOWN') shortScore += 15;
          }
        }

        if (longScore >= threshold && longScore > shortScore) {
          side = 'LONG';
          score = Math.min(100, longScore);
          reason = `Hacim ${ind.volumeSurgeRatio.toFixed(1)}x, CVD %${(ind.cvdRatio * 100).toFixed(0)} alıcı, EMA20 üstü patlama (Teyit: ${score}/100).`;
        } else if (shortScore >= threshold && shortScore > longScore) {
          side = 'SHORT';
          score = Math.min(100, shortScore);
          reason = `Hacimli satış (${ind.volumeSurgeRatio.toFixed(1)}x), CVD %${((1 - ind.cvdRatio) * 100).toFixed(0)} satıcı baskısı (Teyit: ${score}/100).`;
        }
        break;
      }

      case 'sevil': {
        // Madam Sevil: Range & Bollinger mean reversion
        if (regime !== 'RANGE' || ind.volumeSurgeRatio > 1.8) {
          return this.noTrade(regime, 0, 'Piyasa trende veya sert kırılıma kalktı; Madam Sevil sadece yatay rejimde oynar.');
        }

        let longScore = 0;
        let shortScore = 0;

        if (ticker.lastPrice <= ind.bbLower * 1.002) {
          longScore += 40;
          if (ind.rsi14 <= 38) longScore += 30;
          if (ind.orderbookImbalance >= 0.48) longScore += 15;
          if (ind.bbWidth <= 0.035) longScore += 15;
        }

        if (ticker.lastPrice >= ind.bbUpper * 0.998) {
          shortScore += 40;
          if (ind.rsi14 >= 62) shortScore += 30;
          if (ind.orderbookImbalance <= 0.52) shortScore += 15;
          if (ind.bbWidth <= 0.035) shortScore += 15;
        }

        if (longScore >= threshold) {
          side = 'LONG';
          score = Math.min(100, longScore);
          reason = `Yatay bantta Bollinger alt sınırına indi, RSI ${ind.rsi14}, merkeze dönüş teyit edildi (Teyit: ${score}/100).`;
        } else if (shortScore >= threshold) {
          side = 'SHORT';
          score = Math.min(100, shortScore);
          reason = `Bollinger tavanına vurdu, RSI ${ind.rsi14}, aşırı alım bölgesi yatay dönüş (Teyit: ${score}/100).`;
        }
        break;
      }
    }

    if (!side || score < threshold) {
      return this.noTrade(regime, score, 'Yeterli teyit puanına ulaşılamadı.');
    }

    // Dynamic Sizing, Leverage & ATR Stops
    const leverage = Math.max(
      5,
      Math.min(trader.maxLeverage, Math.round(trader.maxLeverage * leverageFactor))
    );

    const entryPrice =
      side === 'LONG'
        ? ticker.bestAsk || ticker.lastPrice * 1.0002
        : ticker.bestBid || ticker.lastPrice * 0.9998;

    const atrStopDistance = Math.max(ind.atr * 1.25, entryPrice * 0.007);
    const stopLossPrice =
      side === 'LONG'
        ? Number((entryPrice - atrStopDistance).toFixed(entryPrice < 1 ? 6 : 2))
        : Number((entryPrice + atrStopDistance).toFixed(entryPrice < 1 ? 6 : 2));

    const takeProfitPrice =
      side === 'LONG'
        ? Number((entryPrice + atrStopDistance * 2.2).toFixed(entryPrice < 1 ? 6 : 2))
        : Number((entryPrice - atrStopDistance * 2.2).toFixed(entryPrice < 1 ? 6 : 2));

    const maxMargin = Math.min(trader.balance * riskBudgetPct, 1500);
    const margin = Math.max(50, Math.round(maxMargin));
    const notionalSize = margin * leverage;
    const unitSize = notionalSize / entryPrice;
    const riskAmount = (atrStopDistance / entryPrice) * notionalSize;

    return {
      shouldEnter: true,
      side,
      confidenceScore: score,
      reason,
      marketRegime: regime,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      initialStopDistance: atrStopDistance,
      recommendedLeverage: leverage,
      riskAmount,
      notionalSize,
      unitSize,
      margin,
    };
  }

  private static noTrade(
    regime: MarketRegime,
    score: number,
    reason: string
  ): StrategyEvaluationResult {
    return {
      shouldEnter: false,
      side: null,
      confidenceScore: score,
      reason,
      marketRegime: regime,
      entryPrice: 0,
      stopLossPrice: 0,
      takeProfitPrice: 0,
      initialStopDistance: 0,
      recommendedLeverage: 10,
      riskAmount: 0,
      notionalSize: 0,
      unitSize: 0,
      margin: 0,
    };
  }
}
