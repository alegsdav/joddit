import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Note, NoteSegment } from '../types';
import { db, NeonNote } from './db';
import { useAuth } from '@clerk/clerk-expo';

const NOTES_KEY = '@joddit_notes';

// Helper to convert Neon DB shape to App Note shape
const convertNeonToAppNote = (n: NeonNote): Note => {
  let segments: NoteSegment[] = [];
  try {
    segments = typeof n.segments === 'string' ? JSON.parse(n.segments) : n.segments;
  } catch (e) {
    console.log('Error parsing segments:', e);
  }

  return {
    id: n.id,
    title: n.title,
    content: n.content,
    segments: segments,
    createdAt: typeof n.created_at === 'string' ? parseInt(n.created_at) : n.created_at,
    updatedAt: typeof n.updated_at === 'string' ? parseInt(n.updated_at) : n.updated_at,
    isPinned: n.is_pinned,
    category: n.category,
    userId: n.user_id,
    isSynced: true,
    isDeleted: n.is_deleted
  };
};

class Storage {
  async getNotes(userId?: string, token?: string): Promise<Note[]> {
    try {
      // If user is logged in, try fetching from Neon
      if (userId) {
        try {
          const remoteNotes = await db.getNotes(userId, token);
          if (remoteNotes && remoteNotes.length > 0) {
            return remoteNotes.map(convertNeonToAppNote);
          }
        } catch (dbError) {
          console.error('[Storage] Error fetching from DB:', dbError);
        }
      }

      // Default/Fallback to local storage
      const notesJson = await AsyncStorage.getItem(NOTES_KEY);
      const localNotes: Note[] = notesJson ? JSON.parse(notesJson) : [];
      
      return localNotes;
    } catch (error) {
      console.error('[Storage] Error getting notes:', error);
      return [];
    }
  }

  async saveNote(note: Note, userId?: string, token?: string): Promise<void> {
    try {
      // Always save locally for offline support/latency
      const notes = await this.getLocalNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);
      
      const updatedNote = { ...note, updatedAt: Date.now() };

      if (existingIndex >= 0) {
        notes[existingIndex] = updatedNote;
      } else {
        notes.push(updatedNote);
      }
      
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));

      // If logged in, save to Neon
      if (userId) {
        await db.saveNote(userId, updatedNote, token);
      }
    } catch (error) {
      console.error('[Storage] Error saving note:', error);
    }
  }

  async deleteNote(id: string, userId?: string, token?: string): Promise<void> {
    try {
      // Delete locally
      const notes = await this.getLocalNotes();
      const filtered = notes.filter(n => n.id !== id);
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));

      // Delete from Neon if user exists
      if (userId) {
        await db.deleteNote(userId, id, token);
      }
    } catch (error) {
      console.error('[Storage] Error deleting note:', error);
    }
  }

  async bulkSaveNotes(notes: Note[], userId?: string, token?: string): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      
      if (userId) {
        for (const note of notes) {
          await db.saveNote(userId, note, token);
        }
      }
    } catch (error) {
      console.error('[Storage] Error bulk saving notes:', error);
    }
  }

  // Helper to get raw local notes
  private async getLocalNotes(): Promise<Note[]> {
    const notesJson = await AsyncStorage.getItem(NOTES_KEY);
    return notesJson ? JSON.parse(notesJson) : [];
  }
}

export const storage = new Storage();

export function useNotes(userId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const loadNotes = async () => {
    setLoading(true);
    let token;
    if (userId) {
      try {
        token = await getToken();
      } catch (e) {
        console.error('Error getting token in useNotes:', e);
      }
    }
    const loadedNotes = await storage.getNotes(userId, token || undefined);
    setNotes(loadedNotes);
    setLoading(false);
  };

  useEffect(() => {
    loadNotes();
  }, [userId]); // Reload when userId changes

  useEffect(() => {
    // Poll for updates less frequently
    const interval = setInterval(loadNotes, 5000); 
    return () => clearInterval(interval);
  }, [userId]);

  return notes;
}
