# Pending Feature List for BTC Signal Engine

This document enumerates all the features that have been identified for the BTC Signal Engine project but are **not yet implemented**. The list serves as a backlog for future development.

---

## 📊 Core Market Features

1. **BTC Market Data**
   - Current BTC price
   - 24h change
   - 24h volume
   - Market cap
   - Historical OHLC/candles

2. **Multi-Timeframe Analysis**
   - 5m
   - 15m
   - 1h
   - 4h
   - 1D
   - Independent analysis + timeframe alignment

3. **Technical Analysis**
   - RSI
   - EMA 20
   - EMA 50
   - SMA
   - ATR
   - Volatility
   - Price change
   - Volume change

---

## ⛓️ On-Chain & Blockchain Features

4. **Bitcoin Network Intelligence**
   - Mempool transactions
   - Mempool size
   - Network fees
   - Block height
   - Network activity changes

5. **Whale / On-Chain Intelligence**
   - Large BTC transactions
   - Transaction value
   - Whale activity
   - Exchange inflows
   - Exchange outflows
   - On-chain activity
   - Large transaction detection

---

## 💰 Derivatives Features

6. **Derivatives Intelligence**
   - Funding rate
   - Open interest
   - Liquidations
   - Long/short ratio
   - Derivatives anomaly detection

---

## 🌎 Macro Features

7. **Macro Intelligence**
   - DXY
   - US Treasury yields (2Y, 10Y)
   - S&P 500
   - Nasdaq
   - Gold
   - Major economic events
   - FOMC
   - CPI, PPI
   - Nonfarm Payrolls

---

## 📰 News & AI Features

8. **BTC News**
   - BTC‑related headlines
   - News sources
   - Publication timestamps
   - Article links

9. **News Sentiment Timeline**
   - Bullish / Bearish / Neutral / Mixed
   - News impact
   - Price at news publication
   - 1h / 4h / 24h outcome tracking
   - Combined news + BTC price timeline

10. **Jev AI Intelligence**
    - Market regime
    - News direction & impact
    - Network anomaly
    - Setup quality
    - Multi‑timeframe interpretation
    - On‑chain interpretation
    - Derivatives interpretation
    - Macro interpretation
    - Conflict / alignment analysis

---

## 🧠 Signal & Decision Features

11. **Deterministic Signal Engine**
    - LONG / SHORT / WAIT
    - Technical conditions
    - Jev interpretation
    - News, Network, Derivatives, Macro contexts

12. **Confidence Engine**
    - Technical agreement
    - Jev agreement
    - News compatibility
    - Setup quality
    - Network conditions
    - Configurable confidence calculation

13. **Regime Detection**
    - Bullish / Bearish / Ranging / Uncertain
    - Volatility regime
    - Multi‑timeframe regime

14. **Anomaly Detection**
    - Price, Volume, Volatility anomalies
    - Network, Derivatives, On‑chain anomalies

---

## 🧪 Research Features

15. **Backtesting Engine**
    - Historical BTC replay
    - Historical signal generation
    - Trade simulation with look‑ahead bias protection
    - Configurable timeframes & date ranges

16. **Strategy Lab**
    - Create and version strategies
    - Configure indicators & thresholds
    - Enable / disable Jev
    - Risk parameter configuration
    - Strategy comparison

17. **Data Replay**
    - Replay historical candles
    - Pause / resume / step forward
    - View historical state
    - Debug historical signals

18. **Performance Analytics**
    - Total return, Net PnL
    - Number of trades, Win rate, Avg win/loss
    - Profit factor, Max drawdown
    - Avg holding time, Sharpe & Sortino ratios
    - Equity curve visualization

19. **Historical Decision Log**
    - Record every signal with full market, technical, Jev, news, network, derivatives, and macro context
    - Track signal outcomes

---

## 💵 Paper Trading Features

20. **Paper Trading**
    - Simulated LONG / SHORT
    - Entry / exit price
    - Position sizing, Stop‑loss, Take‑profit
    - Fees, Slippage, PnL, Holding period

21. **Risk Engine**
    - Position sizing logic
    - Stop‑loss / Take‑profit rules
    - Risk percentage & capital management
    - Execution assumptions

---

## 🚨 Monitoring & Alerts

22. **Alert Engine**
    - Signal, price, network, whale, liquidation, funding, open‑interest, macro event, news alerts

23. **Data Freshness Monitoring**
    - Last update timestamp per provider
    - Provider health status
    - Stale‑data and API‑failure detection
    - Degraded‑mode handling

---

## 📊 Dashboard

24. **BTC Intelligence Dashboard**
    - Market overview & price chart
    - Technical analysis & multi‑timeframe view
    - Network, Whale, Derivatives, Macro, News, Sentiment, Jev analysis
    - Current signal & historical performance

25. **Strategy Dashboard**
    - Builder UI, backtest configuration, results
    - Strategy comparison, equity curve, trade history

---

## ⚙️ Platform Features

26. **Data Provider Abstraction**
    - Pluggable market, news, derivatives, macro providers
    - Normalization layer

27. **Feature Flags**
    - Toggle Multi‑Timeframe, Whale, Derivatives, Macro, News Sentiment, Jev, etc.

28. **Database & Historical Storage**
    - Market snapshots, network snapshots, news, sentiment, indicators, Jev analyses, signals, trades, backtests, strategies, performance data

29. **Testing & Validation**
    - Unit, integration, signal, indicator, backtesting, look‑ahead bias tests
    - API validation, Zod schemas, strict TypeScript checking

---

*All of the above items are currently pending implementation.*
