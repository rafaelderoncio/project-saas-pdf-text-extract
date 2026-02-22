import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  public constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly themeService: ThemeService
  ) {}

  protected isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  protected username(): string {
    return this.authService.getUsername() || 'Visitante';
  }

  protected isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  protected toggleTheme(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.themeService.setDarkMode(checked);
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
