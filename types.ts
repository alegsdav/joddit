
export type AppView = 'onboarding' | 'onboarding_name' | 'home' | 'recording' | 'editor' | 'settings' | 'auth' | 'profile';

export interface Speaker {
  id: string;
  name: string;
  color: string;
}

export interface NoteSegment {
  speakerId: string;
  text: string;
  timestamp: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  segments: NoteSegment[];
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  category: string;
  userId?: string;
  isSynced?: boolean;
  isDeleted?: boolean;
}

export interface User {
  isGuest: boolean;
  name: string;
}
