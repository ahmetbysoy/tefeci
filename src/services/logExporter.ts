import { DecisionLog } from '../types';

export function exportLossLogsAsJson(logs: DecisionLog[]): void {
  const lossLogs = logs.filter((l) => l.realizedPnl < 0);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(lossLogs, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `tefeci-zarar-loglari-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportLossLogsAsMarkdown(logs: DecisionLog[]): void {
  const lossLogs = logs.filter((l) => l.realizedPnl < 0);

  let md = `# TEFECİ OYUNU - DETAYLI ZARAR VE HATA ANALİZ RAPORU (AI PROMPT İÇİN)\n\n`;
  md += `**Rapor Tarihi:** ${new Date().toLocaleString('tr-TR')}\n`;
  md += `**Toplam İncelenen Zarar Eden İşlem Sayısı:** ${lossLogs.length}\n\n`;
  md += `> **Amaç:** Bu dosyadaki tüm işlemler, Binance Futures gerçek piyasa verileri ve algoritmik sinyaller üzerinden açılmış ancak zarar veya likidasyonla sonuçlanmıştır. Aşağıdaki verileri bir Yapay Zeka mühendisine veya analiz modeline vererek trader indikatörlerini, stop mesafelerini ve risk algoritmalarını optimize edebilirsiniz.\n\n`;
  md += `---\n\n`;

  if (lossLogs.length === 0) {
    md += `*Şu ana kadar kaydedilmiş zarar eden işlem bulunmuyor. Mıntıka şu an kârda veya işlemler henüz kapanmadı.*\n`;
  } else {
    lossLogs.forEach((log, index) => {
      const dateStr = new Date(log.timestamp).toLocaleTimeString('tr-TR');
      md += `### ${index + 1}. [${log.traderName}] ${log.symbol} (${log.side} ${log.leverage}x)\n\n`;
      md += `- **İşlem Zamanı:** ${dateStr}\n`;
      md += `- **Giriş Fiyatı:** ${log.entryPrice.toFixed(4)} USDT\n`;
      md += `- **Çıkış Fiyatı:** ${log.exitPrice.toFixed(4)} USDT\n`;
      md += `- **İzole Marjin:** ${log.margin.toFixed(2)} USDT\n`;
      md += `- **Gerçekleşen Zarar:** **${log.realizedPnl.toFixed(2)} USDT** (%${log.roePercent.toFixed(1)} ROE)\n`;
      md += `- **Kapanış Nedeni:** \`${log.exitReason}\`\n\n`;

      md += `#### Giriş Anındaki İndikatör Verileri (Piyasa Durumu):\n`;
      md += `- **RSI (14):** ${log.entryIndicators.rsi14}\n`;
      md += `- **EMA 20:** ${log.entryIndicators.ema20.toFixed(4)} | **EMA 50:** ${log.entryIndicators.ema50.toFixed(4)}\n`;
      md += `- **Bollinger Bantları:** Üst: ${log.entryIndicators.bbUpper.toFixed(4)} / Orta: ${log.entryIndicators.bbMiddle.toFixed(4)} / Alt: ${log.entryIndicators.bbLower.toFixed(4)}\n`;
      md += `- **Emir Defteri Alış Oranı:** %${(log.entryIndicators.orderbookImbalance * 100).toFixed(1)}\n`;
      md += `- **Fonlama Oranı:** %${(log.entryIndicators.fundingRate * 100).toFixed(4)}\n`;
      md += `- **Fitil/Gölge Oranı:** ${log.entryIndicators.spikeShadowRatio.toFixed(2)}x\n`;
      md += `- **1 Dakikalık Hacim Artışı:** ${log.entryIndicators.volumeSurgeRatio.toFixed(2)}x\n\n`;

      md += `#### Pozisyon Açılış Gerekçesi:\n`;
      md += `> "${log.whyOpened}"\n\n`;

      md += `#### Neden Zarar Etti (Teşhis):\n`;
      md += `${log.whyFailedOrWon}\n\n`;

      md += `#### Yapay Zeka İçin İyileştirme Önerisi:\n`;
      md += `${log.aiImprovementNote}\n\n`;

      md += `---\n\n`;
    });
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `tefeci-zarar-analizi-${new Date().toISOString().slice(0, 10)}.md`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}
