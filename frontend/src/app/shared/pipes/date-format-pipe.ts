import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateFormat', standalone: true })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '-';
    const opts: Intl.DateTimeFormatOptions = {
      short: { day: '2-digit', month: 'short', year: 'numeric' },
      medium: { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
      long: { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    }[format] as Intl.DateTimeFormatOptions;
    return date.toLocaleDateString('tr-TR', opts);
  }
}
