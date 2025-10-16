import { io, Socket } from 'socket.io-client';
import { User, UserLoginData, Message, GameScore } from './types';

class SocketManager {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:3001', {
        autoConnect: false
      });
    }
    
    if (!this.isConnected) {
      this.socket.connect();
      this.isConnected = true;
    }
    
    return this.socket;
  }

  disconnect() {
    if (this.socket && this.isConnected) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  joinGame(userData: UserLoginData) {
    if (this.socket) {
      this.socket.emit('user:join', userData);
    }
  }

  sendGlobalMessage(content: string) {
    if (this.socket) {
      this.socket.emit('message:global', content);
    }
  }

  sendPrivateMessage(content: string, recipientId: string) {
    if (this.socket) {
      this.socket.emit('message:private', content, recipientId);
    }
  }

  performGameAction(actionType: string, data: unknown) {
    if (this.socket) {
      this.socket.emit('game:action', actionType, data);
    }
  }

  kickUser(userId: string) {
    if (this.socket) {
      this.socket.emit('admin:kick', userId);
    }
  }

  resetScore() {
    if (this.socket) {
      this.socket.emit('admin:reset-score');
    }
  }

  onUserJoined(callback: (user: User) => void) {
    if (this.socket) {
      this.socket.on('user:joined', callback);
    }
  }

  onUserLeft(callback: (userId: string) => void) {
    if (this.socket) {
      this.socket.on('user:left', callback);
    }
  }

  onUsersListUpdate(callback: (users: User[]) => void) {
    if (this.socket) {
      console.log('Registering users:list listener');
      this.socket.on('users:list', (users) => {
        console.log('Received users:list event with', users.length, 'users');
        callback(users);
      });
    }
  }

  onMessageReceived(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on('message:received', callback);
    }
  }

  onScoreUpdated(callback: (score: GameScore) => void) {
    if (this.socket) {
      this.socket.on('score:updated', callback);
    }
  }

  onError(callback: (error: string) => void) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketManager = new SocketManager();