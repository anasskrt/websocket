import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { User, AVATARS } from './types';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateUsername(name: string): boolean {
  return name.length >= 3 && name.length <= 20 && /^[a-zA-Z0-9_\-\s]+$/.test(name);
}

export function createUser(name: string, avatar: string): User {
  return {
    id: uuidv4(),
    name: name.trim(),
    avatar,
    isAdmin: false,
    connectedAt: new Date(),
    lastActivity: new Date()
  };
}

export function formatTime(date: Date | string): string {
  // Convert to Date object if it's a string (from WebSocket serialization)
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if it's a valid Date object
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '--:--';
  }
  
  return dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getAvatarUrl(avatar: string): string {
  return `/avatars/${avatar}.png`;
}

export function sanitizeMessage(message: string): string {
  return message
    .trim()
    .replace(/<[^>]*>/g, '')
    .substring(0, 500);
}

export function isValidAvatar(avatar: string): boolean {
  return AVATARS.includes(avatar as typeof AVATARS[number]);
}

export function generateRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}