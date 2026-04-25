import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PieChartModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule, PieChartModule],
  template: `
    <div class="chart-container" style="height: 250px; width: 100%; display: flex; justify-content: center;">
      <ngx-charts-pie-chart
        [scheme]="colorScheme"
        [results]="data"
        [gradient]="false"
        [legend]="false"
        [labels]="true"
        [doughnut]="true"
        [arcWidth]="0.25"
        [animations]="true"
        (select)="onSelect($event)">
      </ngx-charts-pie-chart>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ngx-charts text { fill: var(--text-secondary); font-size: 10px; font-weight: 500; }
  `]
})
export class PieChart {
  @Input() data: any[] = [];

  colorScheme: Color = {
    name: 'crowCategoryScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#6c63ff', '#1d9e75', '#ff9f43', '#00cfe8', '#ea5455', '#7367f0']
  };

  onSelect(data: any): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }
}
