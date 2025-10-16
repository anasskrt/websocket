export interface User {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  connectedAt: Date;
  lastActivity: Date;
}

export interface Message {
  id: string;
  type: 'global' | 'private' | 'system';
  content: string;
  sender: User;
  recipient?: User;
  timestamp: Date;
}

export interface GameScore {
  global: number;
  lastUpdate: Date;
  contributors: {
    userId: string;
    userName: string;
    points: number;
  }[];
}

export interface GameState {
  users: User[];
  score: GameScore;
  messages: Message[];
  isActive: boolean;
}

export interface UserLoginData {
  name: string;
  avatar: string;
}

export interface SocketEvents {
  'user:join': (userData: UserLoginData) => void;
  'user:disconnect': () => void;
  'message:global': (content: string) => void;
  'message:private': (content: string, recipientId: string) => void;
  'game:action': (actionType: string, data: unknown) => void;
  'admin:kick': (userId: string) => void;
  'admin:reset-score': () => void;
  
  'user:joined': (user: User) => void;
  'user:left': (userId: string) => void;
  'users:list': (users: User[]) => void;
  'message:received': (message: Message) => void;
  'score:updated': (score: GameScore) => void;
  'admin:notification': (message: string) => void;
  'game:state-changed': (gameState: GameState) => void;
  'error': (message: string) => void;
}

export const AVATARS = [
  'avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 
  'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8'
] as const;

export type Avatar = typeof AVATARS[number];

export const ADMIN_TOKEN = 'boom-admin-2024';