import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  protected username = '';
  protected password = '';
  protected errorMessage = '';

  public constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  protected onSubmit(): void {
    const isValidLogin = this.authService.login(this.username, this.password);

    if (!isValidLogin) {
      this.errorMessage = 'Usuario ou senha invalidos.';
      return;
    }

    this.errorMessage = '';
    void this.router.navigate(['/home']);
  }
}
