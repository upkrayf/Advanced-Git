import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LineChartModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { curveMonotoneX } from 'd3-shape';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule, LineChartModule],
  template: `
    <div class="chart-container" style="height: 250px; width: 100%;">
      <ngx-charts-line-chart
        [scheme]="colorScheme"
        [results]="data"
        [gradient]="true"
        [xAxis]="true"
        [yAxis]="true"
        [legend]="false"
        [showXAxisLabel]="false"
        [showYAxisLabel]="false"
        [autoScale]="true"
        [curve]="curve"
        [animations]="true">
      </ngx-charts-line-chart>
    </div>
  `,
  styles: [`
    .chart-container {
      margin-top: 10px;
    }
  `]
})
export class LineChart {
  @Input() data: any[] = [];
  
  // Smooth curve for premium look
  curve = curveMonotoneX;

  colorScheme: Color = {
    name: 'crowTheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#6c63ff', '#3dd5f3', '#ffc107', '#1d9e75']
  };
}
