import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Note, NoteSegment } from '../types';
import { db, NeonNote } from './db';

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
  /**
   * Main entry point to sync local storage with cloud for a specific user.
   * This handles pushing guest/other account notes and pulling cloud notes.
   */
  async syncWithCloud(userId: string): Promise<Note[]> {
    try {
      console.log(`[Storage] Starting sync for user: ${userId}`);
      
      // 1. Get all local notes
      const localNotes = await this.getLocalNotes();
      console.log(`[Storage] Found ${localNotes.length} local notes`);
      let hasChanges = false;

      // 2. Identify notes that need pushing (unsynced OR owned by someone else/nobody)
      const notesToPush = localNotes.map(note => {
        if (note.userId !== userId) {
          // Re-own this note for the new account
          console.log(`[Storage] Re-owning note ${note.id} for user ${userId}`);
          hasChanges = true;
          return { ...note, userId, isSynced: false };
        }
        return note;
      });

      // 3. Push all unsynced notes to the cloud
      for (let i = 0; i < notesToPush.length; i++) {
        if (!notesToPush[i].isSynced) {
          try {
            console.log(`[Storage] Pushing note ${notesToPush[i].id} to cloud...`);
            await db.saveNote(userId, notesToPush[i]);
            notesToPush[i].isSynced = true;
            hasChanges = true;
          } catch (e) {
            console.error(`[Storage] Failed to push note ${notesToPush[i].id}:`, e);
          }
        }
      }

      // 4. Pull all notes from the cloud for this user
      const remoteNotes = await db.getNotes(userId);
      const cloudNotes = remoteNotes.map(convertNeonToAppNote);

      // 5. Merge Cloud notes into Local notes
      // We use a Map keyed by ID to make merging efficient
      const mergedMap = new Map<string, Note>();
      
      // Start with local notes (potentially updated with new userId/isSynced)
      notesToPush.forEach(n => mergedMap.set(n.id, n));

      // Merge in cloud notes
      cloudNotes.forEach(cloudNote => {
        const existing = mergedMap.get(cloudNote.id);
        if (!existing || cloudNote.updatedAt > existing.updatedAt) {
          mergedMap.set(cloudNote.id, cloudNote);
          hasChanges = true;
        }
      });

      const finalNotes = Array.from(mergedMap.values());

      // 6. Save final merged list locally
      if (hasChanges) {
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(finalNotes));
      }

      return finalNotes;
    } catch (error) {
      console.error('[Storage] Error during sync:', error);
      return this.getLocalNotes();
    }
  }

  async getNotes(userId?: string): Promise<Note[]> {
    try {
      // If we have a userId, we should ensure we are synced
      // Note: In a real app, you might not sync on EVERY get call, 
      // but rather trigger syncOnLogin separately. 
      // For now, we'll return local notes and let the hook handle the sync trigger.
      return await this.getLocalNotes();
    } catch (error) {
      console.error('[Storage] Error getting notes:', error);
      return [];
    }
  }

  async saveNote(note: Note, userId?: string): Promise<void> {
    try {
      const updatedNote = { 
        ...note, 
        updatedAt: Date.now(),
        userId: userId || note.userId, // Maintain existing ownership or take current user's
        isSynced: false // Mark for sync
      };

      // 1. Save locally
      const notes = await this.getLocalNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);
      
      if (existingIndex >= 0) {
        notes[existingIndex] = updatedNote;
      } else {
        notes.push(updatedNote);
      }
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));

      // 2. If logged in, try to sync immediately
      if (userId) {
        try {
          await db.saveNote(userId, updatedNote);
          // Update local copy to mark as synced
          updatedNote.isSynced = true;
          const currentNotes = await this.getLocalNotes();
          const idx = currentNotes.findIndex(n => n.id === updatedNote.id);
          if (idx >= 0) {
            currentNotes[idx] = updatedNote;
            await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(currentNotes));
          }
        } catch (dbError) {
          console.warn('[Storage] Remote save failed, will retry on next sync:', dbError);
        }
      }
    } catch (error) {
      console.error('[Storage] Error saving note:', error);
    }
  }

  async deleteNote(id: string, userId?: string): Promise<void> {
    try {
      const notes = await this.getLocalNotes();
      const noteToDelete = notes.find(n => n.id === id);
      
      if (!noteToDelete) return;

      // 1. Mark as deleted locally
      const updatedNote = { ...noteToDelete, isDeleted: true, updatedAt: Date.now(), isSynced: false };
      const idx = notes.findIndex(n => n.id === id);
      notes[idx] = updatedNote;
      
      // We keep deleted notes in local storage for a bit so we can sync the "deleted" state to cloud
      // Alternatively, we can just remove it locally if we don't care about cloud sync for this specific deletion
      // But for a robust sync, we keep it and sync the isDeleted: true flag.
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));

      // 2. If logged in, sync the deletion
      if (userId) {
        try {
          await db.deleteNote(userId, id);
          // Now we can actually remove it locally if we want, or mark as synced
          const currentNotes = await this.getLocalNotes();
          const filtered = currentNotes.filter(n => n.id !== id);
          await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
        } catch (dbError) {
          console.warn('[Storage] Remote delete failed:', dbError);
        }
      } else {
        // If not logged in, just remove locally
        const filtered = notes.filter(n => n.id !== id);
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('[Storage] Error deleting note:', error);
    }
  }

  async bulkSaveNotes(notes: Note[], userId?: string): Promise<void> {
    try {
      // For bulk save (initial notes), we just save locally. 
      // They will be synced on next user interaction or login.
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('[Storage] Error bulk saving notes:', error);
    }
  }

  // Helper to get raw local notes
  async getLocalNotes(): Promise<Note[]> {
    try {
      const notesJson = await AsyncStorage.getItem(NOTES_KEY);
      const notes: Note[] = notesJson ? JSON.parse(notesJson) : [];
      // Filter out notes that are marked as deleted and synced
      return notes.filter(n => !n.isDeleted || !n.isSynced);
    } catch (e) {
      return [];
    }
  }
}

export const storage = new Storage();

export function useNotes(userId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAndSync = async () => {
    try {
      setLoading(true);
      // 1. Load what we have locally right now
      const local = await storage.getLocalNotes();
      setNotes(local.filter(n => !n.isDeleted));

      // 2. If we have a user, perform a full sync
      if (userId) {
        console.log(`[useNotes] Triggering sync for ${userId}`);
        const synced = await storage.syncWithCloud(userId);
        setNotes(synced.filter(n => !n.isDeleted));
      }
    } catch (e) {
      console.error('[useNotes] Error in loadAndSync:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAndSync();
  }, [userId]); // Re-run whenever the user ID changes (sign-in, sign-out, switch)

  useEffect(() => {
    // Background refresh every 10 seconds (increased from 5 to reduce noise)
    const interval = setInterval(async () => {
      const current = await storage.getLocalNotes();
      setNotes(current.filter(n => !n.isDeleted));
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  return notes;
}
