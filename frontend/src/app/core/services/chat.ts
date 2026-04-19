import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Chat {
  private apiUrl = '/api/chat';

  constructor(private http: HttpClient, private auth: Auth) {}

  ask(question: string): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/ask`, {
      question,
      role: this.auth.getRole(),
    });
  }
}
