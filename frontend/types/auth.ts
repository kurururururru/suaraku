export type Role = 'ADMIN' | 'VOTER';

export interface User {
  id: number;
  nim: string;
  name: string;
  role: Role;
  hasVoted: boolean;
  hasPublicKey?: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  message?: string;
}

export interface GetMeResponse {
  success: boolean;
  data: User;
  message?: string;
}
