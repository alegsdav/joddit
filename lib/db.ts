import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.EXPO_PUBLIC_DATABASE_URL;

export interface NeonNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  segments: any; 
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  category: string;
  is_deleted: boolean;
}

// Simple SQL client without Neon Auth / Authorization headers
const getSql = () => {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }
  return neon(DATABASE_URL);
};

export const db = {
  async getNotes(userId: string) {
    try {
      const sql = getSql();
      const notes = await sql`
        SELECT * FROM notes 
        WHERE user_id = ${userId} 
        AND is_deleted = false
        ORDER BY updated_at DESC
      `;
      return notes as NeonNote[];
    } catch (e) {
      console.error('Error fetching notes from Neon:', e);
      return [];
    }
  },

  async saveNote(userId: string, note: any) {
    try {
      const sql = getSql();
      console.log(`[Neon DB] Saving note ${note.id} for user ${userId}...`);
      
      // Upsert note
      await sql`
        INSERT INTO notes (
          id, user_id, title, content, segments, 
          created_at, updated_at, is_pinned, category, is_deleted
        ) VALUES (
          ${note.id}, 
          ${userId}, 
          ${note.title}, 
          ${note.content}, 
          ${JSON.stringify(note.segments)}, 
          ${note.createdAt}, 
          ${note.updatedAt}, 
          ${note.isPinned}, 
          ${note.category}, 
          ${note.isDeleted || false}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          segments = EXCLUDED.segments,
          updated_at = EXCLUDED.updated_at,
          is_pinned = EXCLUDED.is_pinned,
          category = EXCLUDED.category,
          is_deleted = EXCLUDED.is_deleted
      `;
    } catch (e) {
      console.error('Error saving note to Neon:', e);
      throw e;
    }
  },

  async deleteNote(userId: string, noteId: string) {
    try {
      const sql = getSql();
      await sql`
        UPDATE notes 
        SET is_deleted = true 
        WHERE id = ${noteId} AND user_id = ${userId}
      `;
    } catch (e) {
      console.error('Error deleting note from Neon:', e);
      throw e;
    }
  }
};
