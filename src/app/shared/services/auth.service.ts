import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AuthService {

  private tokenName: string = 'tsToken';

  constructor() {

  }

  isLoggedIn() {
    return !!localStorage.getItem(this.tokenName);   // double ! casts result to boolean
  }

  getToken() {
    return localStorage.getItem(this.tokenName);
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenName, token);
  }

  deleteToken() {
    localStorage.removeItem(this.tokenName);
  }

}
