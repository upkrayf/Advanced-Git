import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chat } from '../../../core/services/chat';
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
  messages: ChatMessage[] = [
    { sender: 'assistant', text: 'Merhaba! E-ticaret analiz asistanınıza hoş geldiniz. Sorunuzu yazabilirsiniz.' }
  ];
  loading = false;

  constructor(private chatService: Chat) {}

  sendQuestion(): void {
    const questionText = this.question?.trim();
    if (!questionText) {
      return;
    }

    this.messages.push({ sender: 'user', text: questionText });
    this.question = '';
    this.loading = true;

    this.chatService.ask(questionText).subscribe({
      next: answer => {
        this.messages.push({ sender: 'assistant', text: answer });
        this.loading = false;
      },
      error: () => {
        this.messages.push({ sender: 'assistant', text: 'Üzgünüm, sohbet hizmetine bağlanırken bir hata oluştu.' });
        this.loading = false;
      }
    });
  }
}
