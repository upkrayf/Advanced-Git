import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chat } from '../../../core/services/chat';
import { Auth } from '../../../core/services/auth';
import { ChatMessage, ChartData, ChartDataPoint } from '../../../core/models/chat-message.model';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.css',
})
export class AiChat {
  question = '';
  isOpen = false;
  messages: ChatMessage[] = [];
  loading = false;

  // Chart color palette matching the dark modern design
  readonly COLORS = ['#00e5a0', '#7c6af0', '#ff9f43', '#f44336', '#00bcd4', '#9c27b0', '#2196f3', '#ff6b6b'];

  // SVG coordinate constants (viewBox 0 0 300 200)
  readonly ML = 42;   // margin left  (y-axis labels)
  readonly MR = 8;    // margin right
  readonly MT = 14;   // margin top
  readonly MB = 38;   // margin bottom (x-axis labels)
  readonly AW = 300 - 42 - 8;   // chart area width  = 250
  readonly AH = 200 - 14 - 38;  // chart area height = 148

  constructor(private chatService: Chat, private authService: Auth) {
    const role = this.authService.getRole();
    this.messages.push({
      sender: 'assistant',
      text: `Merhaba! Ben DataPulse AI. ${role === 'ADMIN' ? 'Platform geneli' : 'Mağazanızla ilgili'} analizler ve grafikler oluşturabilirim. Nasıl yardımcı olabilirim?`,
    });
  }

  toggleChat(): void { this.isOpen = !this.isOpen; }

  sendQuestion(): void {
    const q = this.question?.trim();
    if (!q) return;
    this.messages.push({ sender: 'user', text: q });
    this.question = '';
    this.loading = true;

    this.chatService.ask(q).subscribe({
      next: response => {
        let chartData: ChartData | undefined;
        if (response.visualization) {
          try { chartData = JSON.parse(response.visualization) as ChartData; } catch { /* no chart */ }
        }
        this.messages.push({
          sender: 'assistant',
          text: response.reply || 'Yanıt alınamadı.',
          chartData,
        });
        this.loading = false;
      },
      error: () => {
        this.messages.push({ sender: 'assistant', text: 'Üzgünüm, sohbet hizmetine bağlanırken bir hata oluştu.' });
        this.loading = false;
      },
    });
  }

  // ─── Chart helpers ──────────────────────────────────────────────────────────

  /** Round max value up to a clean number for the y-axis. */
  chartMax(data: ChartDataPoint[]): number {
    const raw = Math.max(...data.map(d => d.value));
    if (raw <= 0) return 10;
    const exp = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.ceil(raw / exp) * exp;
  }

  /** Format a numeric value with K / M suffix. */
  fmtVal(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'K';
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  /** Six y-axis ticks from 0 → max with SVG y-coordinates. */
  chartYTicks(data: ChartDataPoint[]): Array<{ y: number; label: string }> {
    const max = this.chartMax(data);
    return [0, 1, 2, 3, 4, 5].map(i => ({
      y: this.MT + this.AH - (i / 5) * this.AH,
      label: this.fmtVal((max / 5) * i),
    }));
  }

  /** Pre-computed bar rects for bar charts. */
  chartBars(data: ChartDataPoint[]) {
    const max = this.chartMax(data);
    const n = data.length;
    const groupW = this.AW / n;
    const barW = Math.max(Math.min(groupW * 0.65, 38), 5);
    const maxLen = n > 8 ? 4 : 7;

    return data.map((d, i) => ({
      x:      this.ML + i * groupW + (groupW - barW) / 2,
      y:      this.MT + this.AH - (max > 0 ? (d.value / max) * this.AH : 0),
      w:      barW,
      h:      max > 0 ? Math.max((d.value / max) * this.AH, 1) : 1,
      color:  this.COLORS[i % this.COLORS.length],
      lx:     this.ML + i * groupW + groupW / 2,
      ly:     this.MT + this.AH + 15,
      label:  d.name.length > maxLen ? d.name.slice(0, maxLen) + '…' : d.name,
      valLbl: this.fmtVal(d.value),
    }));
  }

  /** SVG cubic-bezier path for a line chart. */
  chartLinePath(data: ChartDataPoint[]): string {
    const max = this.chartMax(data);
    const n   = data.length;
    if (n < 2) return '';
    const pts = data.map((d, i) => ({
      x: this.ML + (i / (n - 1)) * this.AW,
      y: this.MT + this.AH - (max > 0 ? (d.value / max) * this.AH : 0),
    }));
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cp = (pts[i].x - pts[i - 1].x) / 2;
      path += ` C ${(pts[i - 1].x + cp).toFixed(1)},${pts[i - 1].y.toFixed(1)}`
            + ` ${(pts[i].x - cp).toFixed(1)},${pts[i].y.toFixed(1)}`
            + ` ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    return path;
  }

  /** Closed filled-area path below the line. */
  chartAreaPath(data: ChartDataPoint[]): string {
    const line = this.chartLinePath(data);
    if (!line) return '';
    const lastX  = (this.ML + this.AW).toFixed(1);
    const firstX = this.ML.toFixed(1);
    const bot    = (this.MT + this.AH).toFixed(1);
    return `${line} L ${lastX},${bot} L ${firstX},${bot} Z`;
  }

  /** Dot positions + x-axis labels for line charts. */
  chartDots(data: ChartDataPoint[]) {
    const max = this.chartMax(data);
    const n   = data.length;
    const maxLen = n > 7 ? 5 : 7;
    return data.map((d, i) => ({
      cx:    this.ML + (i / Math.max(n - 1, 1)) * this.AW,
      cy:    this.MT + this.AH - (max > 0 ? (d.value / max) * this.AH : 0),
      lx:    this.ML + (i / Math.max(n - 1, 1)) * this.AW,
      ly:    this.MT + this.AH + 15,
      label: d.name.length > maxLen ? d.name.slice(0, maxLen) + '…' : d.name,
    }));
  }

  /** Donut arc paths for pie charts.  NOTE: Array.map() is synchronous so
   *  mutating startAngle in the callback is safe. */
  chartDonutSegments(data: ChartDataPoint[]) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return [];

    const cx = 150, cy = 90, outerR = 72, innerR = 44;
    let startAngle = -Math.PI / 2;

    return data.slice(0, 8).map((d, i) => {
      const frac     = d.value / total;
      const endAngle = startAngle + frac * 2 * Math.PI;
      const large    = frac > 0.5 ? 1 : 0;

      const pt = (r: number, a: number) =>
        `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;

      const path = [
        `M ${pt(outerR, startAngle)}`,
        `A ${outerR},${outerR} 0 ${large},1 ${pt(outerR, endAngle)}`,
        `L ${pt(innerR, endAngle)}`,
        `A ${innerR},${innerR} 0 ${large},0 ${pt(innerR, startAngle)}`,
        'Z',
      ].join(' ');

      startAngle = endAngle;

      return {
        path,
        color: this.COLORS[i % this.COLORS.length],
        name:  d.name.length > 14 ? d.name.slice(0, 14) + '…' : d.name,
        pct:   (frac * 100).toFixed(1) + '%',
        val:   this.fmtVal(d.value),
      };
    });
  }

  chartIcon(type: string): string {
    return type === 'pie' ? '🍩' : type === 'line' ? '📈' : '📊';
  }

  chartTypeLabel(type: string): string {
    return type === 'pie' ? 'Dağılım' : type === 'line' ? 'Trend' : 'Karşılaştırma';
  }
}
