export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  slackConnected?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}
