import { neon } from '@neondatabase/serverless';

// With the latest driver (0.10.4+), we don't need to manually clean the URL.
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

export const db = {
  async getNotes(userId: string, token?: string) {
    if (!DATABASE_URL) {
      console.warn('[Neon DB] DATABASE_URL is not defined.');
      return [];
    }
    
    try {
      // Use the token if provided, otherwise standard connection
      const sql = token 
        ? neon(DATABASE_URL, { fetchOptions: { headers: { Authorization: `Bearer ${token}` } } })
        : neon(DATABASE_URL);

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

  async saveNote(userId: string, note: any, token?: string) {
    if (!DATABASE_URL) {
      console.warn('[Neon DB] DATABASE_URL is not defined in environment variables. Note not saved to remote.');
      return;
    }

    try {
      console.log(`[Neon DB] Saving note ${note.id} for user ${userId}...`);
      
      const sql = token 
        ? neon(DATABASE_URL, { fetchOptions: { headers: { Authorization: `Bearer ${token}` } } })
        : neon(DATABASE_URL);

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
          ${note.segments}, 
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

  async deleteNote(userId: string, noteId: string, token?: string) {
    if (!DATABASE_URL) return;
    try {
      const sql = token 
        ? neon(DATABASE_URL, { fetchOptions: { headers: { Authorization: `Bearer ${token}` } } })
        : neon(DATABASE_URL);

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
