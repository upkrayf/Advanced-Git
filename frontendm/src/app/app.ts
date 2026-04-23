import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiChat } from './shared/components/ai-chat/ai-chat';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AiChat],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
