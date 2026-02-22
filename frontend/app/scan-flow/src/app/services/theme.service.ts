import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeStorageKey = 'scanflow-theme';
  private readonly darkModeState = signal(false);

  public constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedTheme = sessionStorage.getItem(this.themeStorageKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    this.setDarkMode(useDark);
  }

  public isDarkMode(): boolean {
    return this.darkModeState();
  }

  public setDarkMode(enabled: boolean): void {
    this.darkModeState.set(enabled);
    const theme = enabled ? 'dark' : 'light';
    this.document.documentElement.setAttribute('data-theme', theme);

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.themeStorageKey, theme);
    }
  }
}
