import { Component, AfterViewInit, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { DashboardService } from '../../services/dashboardService';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, AfterViewInit {
  @ViewChild('revenueChart') revenueChart!: ElementRef;
  
  // Artık değerler boş başlıyor, servisten dolacak
  kpis: any[] = [];
  chartInstance: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.fetchKpiData();
  }

  ngAfterViewInit() {
    this.fetchChartData();
  }

  fetchKpiData() {
    this.dashboardService.getSummaryStats().subscribe({
      next: (data) => {
        // Backend'den gelen veriyi dökümandaki ikonlarla eşleştiriyoruz
        this.kpis = [
          { title: 'Total Revenue', value: data.revenue, icon: '💰', color: '#00f2fe' },
          { title: 'Total Orders', value: data.orders, icon: '📦', color: '#ff007f' },
          { title: 'Customers', value: data.customers, icon: '👥', color: '#7928ca' },
          { title: 'Avg Rating', value: data.rating, icon: '⭐', color: '#f6e58d' }
        ];
      },
      error: () => {
        console.error("KPI verileri yüklenemedi.");
      }
    });
  }

  fetchChartData() {
    this.dashboardService.getRevenueData().subscribe({
      next: (data) => {
        this.createChart(data.labels, data.values);
      },
      error: () => {
        // Backend yoksa bile grafik alanı çökmesin diye boş bir grafik çizelim
        this.createChart(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [0, 0, 0, 0, 0, 0, 0]);
      }
    });
  }

  createChart(labels: string[], values: number[]) {
    // Eğer halihazırda bir grafik varsa, üzerine yazmasın diye temizleyelim
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(this.revenueChart.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Weekly Revenue',
          data: values,
          borderColor: '#66fcf1',
          backgroundColor: 'rgba(102, 252, 241, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#c5c6c7' } }
        },
        scales: {
          y: { grid: { color: '#1f2833' }, ticks: { color: '#c5c6c7' } },
          x: { grid: { color: '#1f2833' }, ticks: { color: '#c5c6c7' } }
        }
      }
    });
  }
}