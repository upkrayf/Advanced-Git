import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.css']
})
export class Reviews {
  // Kaggle DS6 Veri Seti Örneği
  reviews = [
    { id: 1, user: 'Alice W.', rating: 5, comment: 'Amazing quality! Highly recommended.', sentiment: 'Positive', date: '2026-04-01' },
    { id: 2, user: 'Bob M.', rating: 2, comment: 'Shipping took too long, not happy.', sentiment: 'Negative', date: '2026-03-28' },
    { id: 3, user: 'Clara K.', rating: 4, comment: 'Good product but the packaging was damaged.', sentiment: 'Neutral', date: '2026-03-25' }
  ];

  // Yıldızları array olarak döner (Görselleştirme için)
  getStars(rating: number) {
    return new Array(rating);
  }
}