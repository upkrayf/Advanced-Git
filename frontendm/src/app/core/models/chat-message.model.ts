export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  valueLabel?: string;
  data: ChartDataPoint[];
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  chartData?: ChartData;
}
