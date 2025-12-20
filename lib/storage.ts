import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Note } from '../types';

const NOTES_KEY = '@joddit_notes';

class Storage {
  async getNotes(): Promise<Note[]> {
    try {
      const notesJson = await AsyncStorage.getItem(NOTES_KEY);
      return notesJson ? JSON.parse(notesJson) : [];
    } catch (error) {
      console.error('[Storage] Error getting notes:', error);
      return [];
    }
  }

  async saveNote(note: Note): Promise<void> {
    try {
      const notes = await this.getNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);
      
      if (existingIndex >= 0) {
        notes[existingIndex] = { ...note, updatedAt: Date.now() };
      } else {
        notes.push(note);
      }
      
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('[Storage] Error saving note:', error);
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const filtered = notes.filter(n => n.id !== id);
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[Storage] Error deleting note:', error);
    }
  }

  async bulkSaveNotes(notes: Note[]): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('[Storage] Error bulk saving notes:', error);
    }
  }
}

export const storage = new Storage();

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const loadedNotes = await storage.getNotes();
    setNotes(loadedNotes);
    setLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(loadNotes, 1000);
    return () => clearInterval(interval);
  }, []);

  return loading ? null : notes;
}
