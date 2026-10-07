import { DataHealthStatus, IndicatorSnapshot, MarketTicker } from '../types';

export interface KlineData {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface AggTradeEvent {
  time: number;
  price: number;
  qty: number;
  isBuyerMaker: boolean; // if false, aggressive buyer hitting ask
}

export interface LiquidationOrderEvent {
  symbol: string;
  side: 'BUY' | 'SELL'; // if SELL -> a LONG was liquidated; if BUY -> a SHORT was liquidated
  price: number;
  qty: number;
  timestamp: number;
}

export type MarketUpdateCallback = (ticker: MarketTicker) => void;
export type IndicatorsUpdateCallback = (symbol: string, indicators: IndicatorSnapshot) => void;
export type LiquidationEventCallback = (event: LiquidationOrderEvent) => void;

class BinanceFeedService {
  private ws: WebSocket | null = null;
  private symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'PEPEUSDT'];
  private marketTickers: Map<string, MarketTicker> = new Map();
  private klinesHistory: Map<string, KlineData[]> = new Map();
  private indicatorsCache: Map<string, IndicatorSnapshot> = new Map();

  // Advanced Data Layer: AggTrades (CVD), Open Interest, Liquidations
  private aggTradesMap: Map<string, AggTradeEvent[]> = new Map();
  private openInterestMap: Map<string, { current: number; history: { oi: number; time: number }[] }> = new Map();
  private liquidationsMap: Map<string, LiquidationOrderEvent[]> = new Map();

  private marketCallbacks: Set<MarketUpdateCallback> = new Set();
  private indicatorCallbacks: Set<IndicatorsUpdateCallback> = new Set();
  private liquidationCallbacks: Set<LiquidationEventCallback> = new Set();

  private reconnectAttempts: number = 0;
  private reconnectTimeout: number | null = null;
  private isDestroyed: boolean = false;
  private pollInterval: number | null = null;
  private oiPollInterval: number | null = null;

  // Data health metrics
  private totalMessagesReceived: number = 0;
  private lastMessageTime: number = Date.now();
  private latencyMs: number = 28;
  private connectionStatus: 'CONNECTED' | 'RECONNECTING' | 'FALLBACK_REST' = 'CONNECTED';

  constructor() {
    this.initFeed();
  }

  public getSymbols(): string[] {
    return [...this.symbols];
  }

  public setSymbols(newSymbols: string[]) {
    if (newSymbols.length === 0) return;
    this.symbols = newSymbols.map((s) => s.toUpperCase());
    this.reconnectWs();
    this.fetchInitialData();
  }

  public onMarketUpdate(cb: MarketUpdateCallback): () => void {
    this.marketCallbacks.add(cb);
    return () => this.marketCallbacks.delete(cb);
  }

  public onIndicatorsUpdate(cb: IndicatorsUpdateCallback): () => void {
    this.indicatorCallbacks.add(cb);
    return () => this.indicatorCallbacks.delete(cb);
  }

  public onLiquidation(cb: LiquidationEventCallback): () => void {
    this.liquidationCallbacks.add(cb);
    return () => this.liquidationCallbacks.delete(cb);
  }

  public getTicker(symbol: string): MarketTicker | undefined {
    return this.marketTickers.get(symbol.toUpperCase());
  }

  public getIndicators(symbol: string): IndicatorSnapshot | undefined {
    return this.indicatorsCache.get(symbol.toUpperCase());
  }

  public getAllTickers(): MarketTicker[] {
    return Array.from(this.marketTickers.values());
  }

  public getDataHealth(): DataHealthStatus {
    const isStale = Date.now() - this.lastMessageTime > 8000;
    return {
      status: isStale ? 'FALLBACK_REST' : this.connectionStatus,
      latencyMs: this.latencyMs,
      lastMessageTime: this.lastMessageTime,
      activeStreamsCount: this.symbols.length * 5 + 1, // ticker, bookTicker, markPrice, kline, aggTrade + forceOrder
      totalMessagesReceived: this.totalMessagesReceived,
    };
  }

  private initFeed() {
    this.fetchInitialData();
    this.connectWs();

    // High frequency REST backup poll every 4 seconds
    if (typeof window !== 'undefined') {
      this.pollInterval = window.setInterval(() => {
        this.pollMarketData();
        this.measureLatency();
      }, 4000);

      // Open interest polling every 8 seconds
      this.oiPollInterval = window.setInterval(() => {
        this.pollOpenInterest();
      }, 8000);
    }
  }

  public async fetchAvailableFuturesSymbols(): Promise<string[]> {
    try {
      const res = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');
      if (!res.ok) throw new Error('Failed to fetch exchangeInfo');
      const data = await res.json();
      const usdtPerps = (data.symbols as { symbol: string; contractType: string; status: string }[])
        .filter((s) => s.contractType === 'PERPETUAL' && s.status === 'TRADING' && s.symbol.endsWith('USDT'))
        .map((s) => s.symbol);
      return usdtPerps;
    } catch (e) {
      console.warn('Error fetching exchangeInfo, fallback to top coins:', e);
      return [
        'BTCUSDT',
        'ETHUSDT',
        'SOLUSDT',
        'DOGEUSDT',
        'PEPEUSDT',
        'BNBUSDT',
        'XRPUSDT',
        'SUIUSDT',
        'NEARUSDT',
        'AVAXUSDT',
        'LINKUSDT',
        'ADAUSDT',
      ];
    }
  }

  private async fetchInitialData() {
    for (const symbol of this.symbols) {
      this.fetchKlinesAndDepth(symbol);
    }
    this.pollOpenInterest();
  }

  private async measureLatency() {
    try {
      const start = performance.now();
      const res = await fetch('https://fapi.binance.com/fapi/v1/time');
      if (res.ok) {
        this.latencyMs = Math.round(performance.now() - start);
      }
    } catch {
      // ignore
    }
  }

  private async pollOpenInterest() {
    for (const symbol of this.symbols) {
      try {
        const res = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`);
        if (!res.ok) continue;
        const data = await res.json();
        const oi = parseFloat(data.openInterest || '0');
        if (oi > 0) {
          const prev = this.openInterestMap.get(symbol) || { current: oi, history: [] };
          const now = Date.now();
          prev.history.push({ oi, time: now });
          // keep 15 minutes of OI history
          const cutoff = now - 15 * 60 * 1000;
          prev.history = prev.history.filter((h) => h.time >= cutoff);
          prev.current = oi;
          this.openInterestMap.set(symbol, prev);
          this.recomputeIndicators(symbol);
        }
      } catch {
        // ignore
      }
    }
  }

  private async fetchKlinesAndDepth(symbol: string) {
    try {
      // 1. Fetch 1m Klines
      const klineRes = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&limit=40`
      );
      if (klineRes.ok) {
        const klineData = await klineRes.json();
        const parsedKlines: KlineData[] = klineData.map((k: (string | number)[]) => ({
          openTime: Number(k[0]),
          open: parseFloat(String(k[1])),
          high: parseFloat(String(k[2])),
          low: parseFloat(String(k[3])),
          close: parseFloat(String(k[4])),
          volume: parseFloat(String(k[5])),
          closeTime: Number(k[6]),
        }));
        this.klinesHistory.set(symbol, parsedKlines);
      }

      // 2. Fetch Premium Index (funding rate & mark price)
      const premRes = await fetch(
        `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`
      );
      let fundingRate = 0.0001;
      let markPrice = 0;
      if (premRes.ok) {
        const prem = await premRes.json();
        fundingRate = parseFloat(prem.lastFundingRate || '0.0001');
        markPrice = parseFloat(prem.markPrice || '0');
      }

      // 3. Fetch Order Book Depth
      const depthRes = await fetch(
        `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=20`
      );
      let bidDepthVol = 0;
      let askDepthVol = 0;
      let bestBid = 0;
      let bestAsk = 0;
      if (depthRes.ok) {
        const depth = await depthRes.json();
        if (depth.bids && depth.bids.length > 0) {
          bestBid = parseFloat(depth.bids[0][0]);
          bidDepthVol = depth.bids.reduce(
            (acc: number, curr: string[]) => acc + parseFloat(curr[1]),
            0
          );
        }
        if (depth.asks && depth.asks.length > 0) {
          bestAsk = parseFloat(depth.asks[0][0]);
          askDepthVol = depth.asks.reduce(
            (acc: number, curr: string[]) => acc + parseFloat(curr[1]),
            0
          );
        }
      }

      const lastKline = this.klinesHistory.get(symbol)?.slice(-1)[0];
      const lastPrice = lastKline ? lastKline.close : bestBid || 100;
      const orderbookRatio =
        bidDepthVol + askDepthVol > 0
          ? bidDepthVol / (bidDepthVol + askDepthVol)
          : 0.5;

      const ticker: MarketTicker = {
        symbol,
        lastPrice,
        priceChangePercent: 0,
        highPrice: lastKline?.high || lastPrice,
        lowPrice: lastKline?.low || lastPrice,
        volume: lastKline?.volume || 0,
        quoteVolume: 0,
        fundingRate,
        markPrice: markPrice || lastPrice,
        bestBid: bestBid || lastPrice * 0.9995,
        bestAsk: bestAsk || lastPrice * 1.0005,
        bidDepthVolume: bidDepthVol,
        askDepthVolume: askDepthVol,
        orderbookRatio,
        updatedAt: Date.now(),
      };

      this.updateTicker(ticker);
      this.recomputeIndicators(symbol);
    } catch (e) {
      console.warn(`Error fetching initial data for ${symbol}:`, e);
    }
  }

  private async pollMarketData() {
    try {
      const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
      if (!res.ok) return;
      const allTickers = await res.json();
      const map = new Map(
        allTickers.map((t: { symbol: string }) => [t.symbol, t])
      );

      for (const symbol of this.symbols) {
        const t = map.get(symbol) as {
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
          highPrice: string;
          lowPrice: string;
          volume: string;
          quoteVolume: string;
        } | undefined;

        if (t) {
          const prev = this.marketTickers.get(symbol);
          const lastPrice = parseFloat(t.lastPrice);
          const ticker: MarketTicker = {
            symbol,
            lastPrice,
            priceChangePercent: parseFloat(t.priceChangePercent),
            highPrice: parseFloat(t.highPrice),
            lowPrice: parseFloat(t.lowPrice),
            volume: parseFloat(t.volume),
            quoteVolume: parseFloat(t.quoteVolume),
            fundingRate: prev?.fundingRate || 0.0001,
            markPrice: prev?.markPrice || lastPrice,
            bestBid: prev?.bestBid || lastPrice * 0.9998,
            bestAsk: prev?.bestAsk || lastPrice * 1.0002,
            bidDepthVolume: prev?.bidDepthVolume || 100,
            askDepthVolume: prev?.askDepthVolume || 100,
            orderbookRatio: prev?.orderbookRatio || 0.5,
            updatedAt: Date.now(),
          };
          this.updateTicker(ticker);
          this.recomputeIndicators(symbol);
        }
      }
    } catch {
      // ignore
    }
  }

  private connectWs() {
    if (typeof window === 'undefined' || this.isDestroyed) return;

    try {
      // Build combined stream query with !forceOrder@arr, aggTrade, ticker, bookTicker, markPrice, kline
      const streamNames: string[] = ['!forceOrder@arr'];
      this.symbols.forEach((sym) => {
        const s = sym.toLowerCase();
        streamNames.push(`${s}@ticker`);
        streamNames.push(`${s}@bookTicker`);
        streamNames.push(`${s}@markPrice@1s`);
        streamNames.push(`${s}@kline_1m`);
        streamNames.push(`${s}@aggTrade`);
      });

      const wsUrl = `wss://fstream.binance.com/stream?streams=${streamNames.join('/')}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.connectionStatus = 'CONNECTED';
      };

      this.ws.onmessage = (event) => {
        this.totalMessagesReceived++;
        this.lastMessageTime = Date.now();
        try {
          const payload = JSON.parse(event.data);
          this.handleWsMessage(payload);
        } catch {
          // parse error ignore
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Binance WebSocket encountered error:', err);
        this.connectionStatus = 'FALLBACK_REST';
      };

      this.ws.onclose = () => {
        this.connectionStatus = 'RECONNECTING';
        if (!this.isDestroyed) {
          this.scheduleReconnect();
        }
      };
    } catch (e) {
      console.warn('WebSocket connection failed, will retry:', e);
      this.connectionStatus = 'RECONNECTING';
      this.scheduleReconnect();
    }
  }

  private handleWsMessage(payload: { stream: string; data: Record<string, unknown> }) {
    if (!payload || !payload.data) return;
    const { stream, data } = payload;

    // 1. Live ForceOrder Liquidation Stream (!forceOrder@arr)
    if (stream.includes('forceOrder')) {
      const o = data.o as {
        s: string; // symbol
        S: 'BUY' | 'SELL'; // side
        q: string; // qty
        p: string; // price
      };
      if (o && o.s) {
        const sym = o.s.toUpperCase();
        const liqEvent: LiquidationOrderEvent = {
          symbol: sym,
          side: o.S,
          price: parseFloat(o.p),
          qty: parseFloat(o.q),
          timestamp: Date.now(),
        };

        const list = this.liquidationsMap.get(sym) || [];
        list.push(liqEvent);
        // keep 5 minutes of liquidation orders
        const cutoff = Date.now() - 5 * 60 * 1000;
        this.liquidationsMap.set(
          sym,
          list.filter((l) => l.timestamp >= cutoff)
        );

        // Notify liquidation listeners
        this.liquidationCallbacks.forEach((cb) => {
          try {
            cb(liqEvent);
          } catch {
            // ignore
          }
        });

        this.recomputeIndicators(sym);
      }
      return;
    }

    const streamType = stream.split('@')[1];
    const symbol = (data.s as string) || stream.split('@')[0].toUpperCase();

    // 2. Real-time AggTrade for Cumulative Volume Delta (CVD)
    if (streamType === 'aggTrade') {
      const trade: AggTradeEvent = {
        time: Number(data.T || Date.now()),
        price: parseFloat(String(data.p || '0')),
        qty: parseFloat(String(data.q || '0')),
        isBuyerMaker: Boolean(data.m),
      };

      const trades = this.aggTradesMap.get(symbol) || [];
      trades.push(trade);
      // keep 5 minutes of trades
      const cutoff = Date.now() - 5 * 60 * 1000;
      this.aggTradesMap.set(
        symbol,
        trades.filter((t) => t.time >= cutoff)
      );

      this.recomputeIndicators(symbol);
      return;
    }

    const currentTicker = this.marketTickers.get(symbol) || {
      symbol,
      lastPrice: 0,
      priceChangePercent: 0,
      highPrice: 0,
      lowPrice: 0,
      volume: 0,
      quoteVolume: 0,
      fundingRate: 0.0001,
      markPrice: 0,
      bestBid: 0,
      bestAsk: 0,
      bidDepthVolume: 50,
      askDepthVolume: 50,
      orderbookRatio: 0.5,
      updatedAt: Date.now(),
    };

    if (streamType === 'ticker') {
      currentTicker.lastPrice = parseFloat(String(data.c || currentTicker.lastPrice));
      currentTicker.priceChangePercent = parseFloat(String(data.P || currentTicker.priceChangePercent));
      currentTicker.highPrice = parseFloat(String(data.h || currentTicker.highPrice));
      currentTicker.lowPrice = parseFloat(String(data.l || currentTicker.lowPrice));
      currentTicker.volume = parseFloat(String(data.v || currentTicker.volume));
      currentTicker.quoteVolume = parseFloat(String(data.q || currentTicker.quoteVolume));
      currentTicker.updatedAt = Date.now();
      this.updateTicker(currentTicker);
    } else if (streamType === 'bookTicker') {
      const bPrice = parseFloat(String(data.b || '0'));
      const aPrice = parseFloat(String(data.a || '0'));
      const bQty = parseFloat(String(data.B || '0'));
      const aQty = parseFloat(String(data.A || '0'));
      if (bPrice > 0) currentTicker.bestBid = bPrice;
      if (aPrice > 0) currentTicker.bestAsk = aPrice;
      currentTicker.bidDepthVolume = bQty;
      currentTicker.askDepthVolume = aQty;
      if (bQty + aQty > 0) {
        currentTicker.orderbookRatio = bQty / (bQty + aQty);
      }
      currentTicker.updatedAt = Date.now();
      this.updateTicker(currentTicker);
    } else if (streamType.startsWith('markPrice')) {
      const p = parseFloat(String(data.p || '0'));
      const r = parseFloat(String(data.r || '0'));
      if (p > 0) currentTicker.markPrice = p;
      if (r !== 0) currentTicker.fundingRate = r;
      currentTicker.updatedAt = Date.now();
      this.updateTicker(currentTicker);
    } else if (streamType === 'kline_1m') {
      const k = data.k as {
        t: number;
        o: string;
        h: string;
        l: string;
        c: string;
        v: string;
        T: number;
      };
      if (k) {
        const kline: KlineData = {
          openTime: k.t,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
          closeTime: k.T,
        };
        this.updateKline(symbol, kline);
      }
    }

    this.recomputeIndicators(symbol);
  }

  private updateKline(symbol: string, kline: KlineData) {
    const list = this.klinesHistory.get(symbol) || [];
    const lastIndex = list.findIndex((x) => x.openTime === kline.openTime);
    if (lastIndex >= 0) {
      list[lastIndex] = kline;
    } else {
      list.push(kline);
      if (list.length > 50) list.shift();
    }
    this.klinesHistory.set(symbol, list);
  }

  private updateTicker(ticker: MarketTicker) {
    this.marketTickers.set(ticker.symbol, ticker);
    this.marketCallbacks.forEach((cb) => {
      try {
        cb(ticker);
      } catch (e) {
        console.error('Ticker callback error:', e);
      }
    });
  }

  // Pure mathematical indicators + Real Futures Data Layer (OI, CVD, Liquidations)
  private recomputeIndicators(symbol: string) {
    const ticker = this.marketTickers.get(symbol);
    const klines = this.klinesHistory.get(symbol) || [];
    if (!ticker) return;

    const closes = klines.map((k) => k.close);
    if (closes.length === 0) closes.push(ticker.lastPrice);
    else closes[closes.length - 1] = ticker.lastPrice;

    // 1. RSI (14)
    let rsi14 = 50;
    if (closes.length >= 15) {
      let gains = 0;
      let losses = 0;
      for (let i = closes.length - 14; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      if (avgLoss === 0) {
        rsi14 = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi14 = 100 - 100 / (1 + rs);
      }
    }

    // 2. EMA 20 and EMA 50
    const ema20 = this.calculateEMA(closes, 20);
    const ema50 = this.calculateEMA(closes, Math.min(50, closes.length));

    // 3. Bollinger Bands (20 periods, 2.0 std dev)
    const windowSlice = closes.slice(-20);
    const bbMiddle =
      windowSlice.reduce((a, b) => a + b, 0) / (windowSlice.length || 1);
    const variance =
      windowSlice.reduce((acc, val) => acc + Math.pow(val - bbMiddle, 2), 0) /
      (windowSlice.length || 1);
    const stdDev = Math.sqrt(variance);
    const bbUpper = bbMiddle + 2.0 * stdDev;
    const bbLower = bbMiddle - 2.0 * stdDev;

    // 4. Spike Shadow Ratio
    const lastKline = klines[klines.length - 1];
    let spikeShadowRatio = 0;
    if (lastKline) {
      const body = Math.abs(lastKline.close - lastKline.open) || 0.0001;
      const upperShadow = lastKline.high - Math.max(lastKline.open, lastKline.close);
      const lowerShadow = Math.min(lastKline.open, lastKline.close) - lastKline.low;
      spikeShadowRatio = Math.max(upperShadow, lowerShadow) / body;
    }

    // 5. Volume Surge Ratio
    let volumeSurgeRatio = 1.0;
    if (klines.length >= 5) {
      const volumes = klines.map((k) => k.volume);
      const avgVol =
        volumes.slice(-20, -1).reduce((a, b) => a + b, 0) /
        Math.max(1, volumes.length - 1);
      const currVol = lastKline ? lastKline.volume : ticker.volume;
      if (avgVol > 0) {
        volumeSurgeRatio = currVol / avgVol;
      }
    }

    // 6. ATR (Average True Range, 14-period)
    let atr = ticker.lastPrice * 0.008;
    if (klines.length >= 2) {
      const trueRanges: number[] = [];
      for (let i = 1; i < klines.length; i++) {
        const high = klines[i].high;
        const low = klines[i].low;
        const prevClose = klines[i - 1].close;
        const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        trueRanges.push(tr);
      }
      const recentTr = trueRanges.slice(-14);
      if (recentTr.length > 0) {
        atr = recentTr.reduce((a, b) => a + b, 0) / recentTr.length;
      }
    }

    const bbWidth = bbMiddle > 0 ? (bbUpper - bbLower) / bbMiddle : 0.02;
    const midPrice = (ticker.bestAsk + ticker.bestBid) / 2 || ticker.lastPrice || 1;
    const spreadPercent = midPrice > 0 ? ((ticker.bestAsk - ticker.bestBid) / midPrice) * 100 : 0.02;

    // 7. Real Binance Open Interest & OI Delta (5m)
    const oiData = this.openInterestMap.get(symbol);
    const openInterest = oiData?.current || 0;
    let oiDelta5m = 0;
    if (oiData && oiData.history.length >= 2) {
      const oldest5m = oiData.history[0];
      oiDelta5m = openInterest - oldest5m.oi;
    }

    // 8. Cumulative Volume Delta (CVD) from AggTrade Stream
    const aggTrades = this.aggTradesMap.get(symbol) || [];
    let takerBuyNotional = 0;
    let takerSellNotional = 0;
    aggTrades.forEach((t) => {
      const notional = t.price * t.qty;
      if (!t.isBuyerMaker) {
        // Buyer took liquidity (aggressive buy)
        takerBuyNotional += notional;
      } else {
        // Seller took liquidity (aggressive sell)
        takerSellNotional += notional;
      }
    });

    const cvd5m = takerBuyNotional - takerSellNotional;
    const totalTakerNotional = takerBuyNotional + takerSellNotional;
    const cvdRatio = totalTakerNotional > 0 ? takerBuyNotional / totalTakerNotional : 0.5;

    // 9. Real Binance Force Orders (Liquidations) in last 5m
    const liqs = this.liquidationsMap.get(symbol) || [];
    let liqLongNotional = 0; // Forced SELL orders (liquidated Longs)
    let liqShortNotional = 0; // Forced BUY orders (liquidated Shorts)

    liqs.forEach((l) => {
      const notional = l.price * l.qty;
      if (l.side === 'SELL') {
        liqLongNotional += notional;
      } else {
        liqShortNotional += notional;
      }
    });

    const liquidationVolume5m = liqLongNotional + liqShortNotional;
    let liquidationBurstSide: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
    if (liqLongNotional > 50000 && liqLongNotional > liqShortNotional * 2) {
      liquidationBurstSide = 'LONG'; // Long squeeze liquidation flush
    } else if (liqShortNotional > 50000 && liqShortNotional > liqLongNotional * 2) {
      liquidationBurstSide = 'SHORT'; // Short squeeze liquidation flush
    }

    const snapshot: IndicatorSnapshot = {
      timestamp: Date.now(),
      symbol,
      currentPrice: ticker.lastPrice,
      rsi14: Number(rsi14.toFixed(2)),
      ema20: Number(ema20.toFixed(4)),
      ema50: Number(ema50.toFixed(4)),
      bbUpper: Number(bbUpper.toFixed(4)),
      bbLower: Number(bbLower.toFixed(4)),
      bbMiddle: Number(bbMiddle.toFixed(4)),
      orderbookImbalance: Number(ticker.orderbookRatio.toFixed(3)),
      fundingRate: Number(ticker.fundingRate.toFixed(6)),
      spikeShadowRatio: Number(spikeShadowRatio.toFixed(2)),
      volumeSurgeRatio: Number(volumeSurgeRatio.toFixed(2)),
      atr: Number(atr.toFixed(4)),
      bbWidth: Number(bbWidth.toFixed(4)),
      spreadPercent: Number(spreadPercent.toFixed(4)),
      // Real Futures Layer
      openInterest: Number(openInterest.toFixed(2)),
      oiDelta5m: Number(oiDelta5m.toFixed(2)),
      cvd5m: Number(cvd5m.toFixed(2)),
      cvdRatio: Number(cvdRatio.toFixed(3)),
      liquidationBurstSide,
      liquidationVolume5m: Number(liquidationVolume5m.toFixed(2)),
    };

    this.indicatorsCache.set(symbol, snapshot);
    this.indicatorCallbacks.forEach((cb) => {
      try {
        cb(symbol, snapshot);
      } catch {
        // ignore
      }
    });
  }

  private calculateEMA(data: number[], period: number): number {
    if (data.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 12000);
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connectWs();
    }, delay);
  }

  private reconnectWs() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.connectWs();
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.ws) this.ws.close();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.oiPollInterval) clearInterval(this.oiPollInterval);
  }
}

export const binanceFeed = new BinanceFeedService();
