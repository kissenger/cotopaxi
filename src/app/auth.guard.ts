import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpService } from './shared/services/http.service';
import { AuthService } from './shared/services/auth.service';

/**
 *
 * returns true if route is allowed and false if not allowed
 *
 */

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(): any {
    if (this.auth.isLoggedIn()) {
      console.log('true');
      return true;
    } else {
      console.log('false');
      // this.router.navigate(['welcome']);
      return this.router.parseUrl('/welcome');
      // return false;
    }
  }
}
