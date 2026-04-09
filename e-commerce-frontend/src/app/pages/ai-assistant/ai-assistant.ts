import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrls: ['./ai-assistant.css']
})
export class AiAssistant {
  userQuery = '';
  isLoading = false;
  errorMessage = '';

  // DataPulse AI initial greeting from project specs [cite: 277]
  chatHistory = [
    { 
      role: 'ai', 
      text: "Hello! I'm your DataPulse AI assistant. I can analyze your store data and generate real-time visualizations. How can I help you today?" 
    }
  ];

  // Suggested queries based on project requirements [cite: 169, 279]
  suggestedQueries = [
    "Show sales by category",
    "Weekly revenue chart",
    "Top products performance",
    "Find negative reviews",
    "Customer distribution"
  ];

  constructor(private productService: ProductService) {}

  sendMessage() {
    const query = this.userQuery.trim();
    if (!query || this.isLoading) return;

    this.chatHistory.push({ role: 'user', text: query });
    this.userQuery = '';
    this.isLoading = true;
    this.errorMessage = '';

    // Integrating with the backend AI Service 
    // Note: We use a placeholder ID (e.g., 0) for general store-wide queries
    this.productService.askGemini(0, query).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.chatHistory.push({ 
          role: 'ai', 
          text: response.reply // The AI Agent's natural language explanation [cite: 133]
        });
        
        // If the response contains visualization data, we will handle it here [cite: 134]
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = "Assistant is currently unavailable. Please check your connection.";
        console.error('AI Service Error:', err);
      }
    });
  }

  useSuggestion(query: string) {
    this.userQuery = query;
    this.sendMessage();
  }
}