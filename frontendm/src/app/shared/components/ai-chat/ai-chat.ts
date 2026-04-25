import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chat } from '../../../core/services/chat';
import { Auth } from '../../../core/services/auth';
import { ChatMessage } from '../../../core/models/chat-message.model';

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

  constructor(private chatService: Chat, private authService: Auth) {
    const role = this.authService.getRole();
    this.messages.push({
      sender: 'assistant',
      text: `Merhaba! Ben DataPulse AI. ${role === 'ADMIN' ? 'Platform geneli' : 'Mağazanızla ilgili'} analizler yapabilirim. Size nasıl yardımcı olabilirim?`
    });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendQuestion(): void {
    const questionText = this.question?.trim();
    if (!questionText) {
      return;
    }

    this.messages.push({ sender: 'user', text: questionText });
    this.question = '';
    this.loading = true;

    this.chatService.ask(questionText).subscribe({
      next: response => {
        // response artık bir ChatResponse nesnesi (reply, visualization, sqlQuery içeriyor)
        this.messages.push({
          sender: 'assistant',
          text: response.reply || 'Yanıt alınamadı.'
        });

        if (response.visualization) {
          console.log('Grafik verisi alındı:', response.visualization);
          // İleride grafik çizimi için burası genişletilebilir
        }

        this.loading = false;
      },
      error: () => {
        this.messages.push({ sender: 'assistant', text: 'Üzgünüm, sohbet hizmetine bağlanırken bir hata oluştu.' });
        this.loading = false;
      }
    });
  }
}
