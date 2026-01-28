
export enum Role {
  MANAGER = 'MANAGER',
  LEADER = 'LEADER',
  MEMBER = 'MEMBER'
}

export interface Team {
  id: number;
  name: string;
  leader: string;
  score: number;
  color: string;
  password?: string; // Password for team leader login
  resetRequested?: boolean; // Flag for password reset requests
}

export interface User {
  role: Role;
  teamId?: number;
  name: string;
}

export interface GemType {
  name: string;
  value: number;
  icon: string;
  color: string;
}

export const GEMS: GemType[] = [
  { name: 'Sapphire', value: 10, icon: '💎', color: '#0F52BA' },
  { name: 'Emerald', value: 25, icon: '💚', color: '#50C878' },
  { name: 'Ruby', value: 50, icon: '❤️', color: '#E0115F' },
  { name: 'Diamond', value: 100, icon: '✨', color: '#B9F2FF' }
];
