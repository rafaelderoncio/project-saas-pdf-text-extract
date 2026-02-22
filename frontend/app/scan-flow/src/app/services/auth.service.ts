import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authStorageKey = 'scanflow-authenticated';
  private readonly usernameStorageKey = 'scanflow-username';
  private readonly authenticatedState = signal(false);
  private readonly usernameState = signal('');

  public constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.authenticatedState.set(sessionStorage.getItem(this.authStorageKey) === 'true');
    this.usernameState.set(sessionStorage.getItem(this.usernameStorageKey) ?? '');
  }

  public login(username: string, password: string): boolean {
    const isValidLogin = username === 'admin' && password === 'admin';

    if (!isValidLogin) {
      this.logout();
      return false;
    }

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.authStorageKey, 'true');
      sessionStorage.setItem(this.usernameStorageKey, username);
    }

    this.authenticatedState.set(true);
    this.usernameState.set(username);
    return true;
  }

  public isAuthenticated(): boolean {
    return this.authenticatedState();
  }

  public getUsername(): string {
    return this.usernameState();
  }

  public logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.authStorageKey);
      sessionStorage.removeItem(this.usernameStorageKey);
    }

    this.authenticatedState.set(false);
    this.usernameState.set('');
  }
}
