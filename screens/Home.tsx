import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Note } from '../types';

interface HomeProps {
  notes: Note[];
  userName?: string;
  onStartRecording: () => void;
  onSelectNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onOpenProfile: () => void;
}

export default function Home({ notes, userName = 'Guest', onStartRecording, onSelectNote, onUpdateNote, onOpenProfile }: HomeProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Bookmarks', 'Ideas', 'Personal'];
  const filteredNotes = notes.filter(n => 
    (activeCategory === 'All' || n.category === activeCategory) &&
    ((n.title?.toLowerCase().includes(search.toLowerCase()) || false) || 
     (n.content?.toLowerCase().includes(search.toLowerCase()) || false))
  );

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const recentNotes = filteredNotes.filter(n => !n.isPinned);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      content: '',
      segments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      category: 'Recent'
    };
    onUpdateNote(newNote);
    onSelectNote(newNote);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.userBadge} onPress={onOpenProfile}>
            <View style={styles.avatar} />
            <Text style={styles.userName}>Hi, {userName}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>⋯</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>My{'\n'}Journal</Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="rgba(0,0,0,0.2)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, activeCategory === cat && styles.categoryButtonActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat} ({cat === 'All' ? notes.length : notes.filter(n => n.category === cat).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {pinnedNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pinned</Text>
            {pinnedNotes.map(note => (
              <TouchableOpacity
                key={note.id}
                style={[styles.noteCard, styles.pinnedCard]}
                onPress={() => onSelectNote(note)}
                activeOpacity={0.7}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                  <Text style={styles.pinIcon}>📌</Text>
                </View>
                <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
                <Text style={styles.noteDate}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          {recentNotes.length > 0 ? (
            recentNotes.map(note => (
              <TouchableOpacity
                key={note.id}
                style={styles.noteCard}
                onPress={() => onSelectNote(note)}
                activeOpacity={0.7}
              >
                <Text style={styles.noteTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
                <Text style={styles.noteDate}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No notes found</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.floatingBar}>
        <TouchableOpacity style={styles.recordButton} onPress={onStartRecording}>
          <Text style={styles.recordIcon}>🎤</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.newNoteButton} onPress={handleCreateNote}>
          <Text style={styles.newNoteIcon}>📝</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FED7AA',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: '#000',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: -1,
    lineHeight: 40,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 24,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  categoriesScroll: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  categoryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#000',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  categoryTextActive: {
    color: '#fff',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  noteCard: {
    backgroundColor: 'rgba(194, 211, 228, 0.3)',
    padding: 20,
    borderRadius: 28,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pinnedCard: {
    backgroundColor: 'rgba(251, 146, 60, 0.4)',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    letterSpacing: -0.5,
  },
  pinIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  noteContent: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    lineHeight: 20,
    marginBottom: 16,
  },
  noteDate: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.3)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
    fontStyle: 'italic',
    paddingVertical: 48,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -80 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 24,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 16,
  },
  newNoteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newNoteIcon: {
    fontSize: 22,
  },
});
