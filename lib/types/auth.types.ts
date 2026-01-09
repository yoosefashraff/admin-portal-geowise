export interface LoginRequest {
  UserName: string;
  Password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface User {
  UserID: number;
  UserName: string;
  UserType: string;
  UserEmail: string;
  Image: 'user' | 'admin' | 'moderator';
  FullName: string;
  IsAuthenticated: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
