import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Animated } from 'react-native';
import { Note } from '../types';
import { SearchIcon, PinIcon, FolderIcon, UserIcon, MicrophoneIcon, PlusIcon, ShareIcon, TrashIcon } from '../components/Icons';

interface HomeProps {
  notes: Note[];
  userName?: string;
  isSignedIn?: boolean;
  onStartRecording: () => void;
  onSelectNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNotes?: (ids: string[]) => void;
  onOpenProfile: () => void;
}

// Helper to get unique speaker count from segments
const getSpeakerCount = (note: Note): number => {
  if (!note.segments || note.segments.length === 0) return 0;
  const uniqueSpeakers = new Set(note.segments.map(s => s.speakerId));
  return uniqueSpeakers.size;
};

// Helper to format date intelligently
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  }
};

export default function Home({ 
  notes, 
  userName = 'Guest', 
  isSignedIn = false,
  onStartRecording, 
  onSelectNote, 
  onUpdateNote,
  onDeleteNotes,
  onOpenProfile 
}: HomeProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;
  const categoriesOpacity = useRef(new Animated.Value(0)).current;
  const notesOpacity = useRef(new Animated.Value(0)).current;
  const floatingBarOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animations on mount
    Animated.stagger(200, [
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(searchOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(categoriesOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(notesOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(floatingBarOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Get unique categories from notes (excluding 'Recent')
  const categories = useMemo(() => {
    const cats = new Set(
      notes
        .map(n => n.category)
        .filter(cat => Boolean(cat) && cat !== 'Recent')
    );
    return ['All', ...Array.from(cats)];
  }, [notes]);

  // Filter and sort notes - pinned notes always show regardless of category
  const { pinnedNotes, recentNotes } = useMemo(() => {
    const allPinned = notes
      .filter(n => 
        n.isPinned &&
        ((n.title?.toLowerCase().includes(search.toLowerCase()) || false) || 
         (n.content?.toLowerCase().includes(search.toLowerCase()) || false))
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);

    const filteredRecent = notes
      .filter(n => {
        if (n.isPinned) return false;
        
        // Treat 'Recent' or empty category as uncategorized (show in 'All' or when no category matches)
        const noteCategory = (!n.category || n.category === 'Recent') ? null : n.category;
        
        const matchesCategory = activeCategory === 'All' || noteCategory === activeCategory;
        const matchesSearch = (n.title?.toLowerCase().includes(search.toLowerCase()) || false) || 
                             (n.content?.toLowerCase().includes(search.toLowerCase()) || false);
        
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);

    return { pinnedNotes: allPinned, recentNotes: filteredRecent };
  }, [notes, activeCategory, search]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      content: '',
      segments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      category: 'Jots'
    };
    onUpdateNote(newNote);
    onSelectNote(newNote);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    
    Alert.alert(
      'Delete Notes',
      `Are you sure you want to delete ${selectedIds.size} note${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (onDeleteNotes) {
              onDeleteNotes(Array.from(selectedIds));
            }
            setSelectedIds(new Set());
            setIsSelecting(false);
          }
        }
      ]
    );
  };

  const handleShareSelected = () => {
    Alert.alert('Share', `Sharing ${selectedIds.size} note${selectedIds.size > 1 ? 's' : ''}`);
  };

  const cancelSelection = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const getCategoryCount = (category: string) => {
    if (category === 'All') return notes.length;
    // Count notes with this category, excluding 'Recent' which is treated as uncategorized
    return notes.filter(n => {
      const noteCategory = (!n.category || n.category === 'Recent') ? null : n.category;
      return noteCategory === category;
    }).length;
  };

  const renderNoteCard = (note: Note, isPinned: boolean) => {
    const speakerCount = getSpeakerCount(note);
    const isSelected = selectedIds.has(note.id);

    return (
      <TouchableOpacity
        key={note.id}
        style={[
          styles.noteCard,
          isPinned ? styles.pinnedCard : styles.recentCard,
          isSelected && styles.selectedCard
        ]}
        onPress={() => {
          if (isSelecting) {
            toggleSelection(note.id);
          } else {
            onSelectNote(note);
          }
        }}
        onLongPress={() => {
          if (!isSelecting) {
            setIsSelecting(true);
            setSelectedIds(new Set([note.id]));
          }
        }}
        activeOpacity={0.7}
      >
        {/* Selection checkbox - top right */}
        {isSelecting && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}

        {/* Speaker count badge - only for signed-in users */}
        {isSignedIn && speakerCount > 0 && !isSelecting && (
          <View style={[styles.speakerBadge, isPinned ? styles.speakerBadgePinned : null]}>
            <Text style={[styles.speakerCount, isPinned ? styles.speakerCountPinned : null]}>
              {speakerCount}
            </Text>
          </View>
        )}

        {/* Note content */}
        <View style={styles.noteContent}>
          <View style={styles.noteTitleRow}>
            {isPinned && (
              <View style={styles.pinIconContainer}>
                <PinIcon size={14} color={isPinned ? '#fff' : '#000'} />
              </View>
            )}
            <Text style={[styles.noteTitle, isPinned && styles.noteTitlePinned]} numberOfLines={1}>
              {note.title || 'Untitled'}
            </Text>
          </View>
          
          <View style={styles.noteMetaRow}>
            <Text style={[styles.noteDate, isPinned && styles.noteDatePinned]}>
              {formatDate(note.updatedAt)}
            </Text>
            <Text style={[styles.notePreview, isPinned && styles.notePreviewPinned]} numberOfLines={1}>
              {note.content || 'No content'}
            </Text>
          </View>

          <View style={styles.noteCategoryRow}>
            <View style={styles.folderIconContainer}>
              <FolderIcon size={12} color={isPinned ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
            </View>
            <Text style={[styles.noteCategory, isPinned && styles.noteCategoryPinned]}>
              {note.category && note.category !== 'Recent' ? note.category : 'Jots'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View style={{ opacity: headerOpacity }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.userBadge} onPress={onOpenProfile}>
              <View style={styles.avatar}>
                <UserIcon size={18} color="#000" />
              </View>
              <Text style={styles.userName}>Hi, {userName.toLowerCase()}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => isSelecting ? cancelSelection() : setIsSelecting(true)}>
              <Text style={styles.selectButton}>{isSelecting ? 'Cancel' : 'Select'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          My{'\n'}Personal Jots
        </Animated.Text>

        {/* Search */}
        <Animated.View style={{ opacity: searchOpacity }}>
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <SearchIcon size={16} color="rgba(0,0,0,0.5)" />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="rgba(0,0,0,0.4)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </Animated.View>

        {/* Categories */}
        <Animated.View style={{ opacity: categoriesOpacity }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, activeCategory === cat && styles.categoryButtonActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat} ({getCategoryCount(cat)})
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addCategoryButton}>
            <Text style={styles.addCategoryIcon}>+</Text>
          </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Pinned Notes */}
        <Animated.View style={{ opacity: notesOpacity }}>
          {pinnedNotes.length > 0 && (
            <View style={styles.section}>
              {pinnedNotes.map(note => renderNoteCard(note, true))}
            </View>
          )}

          {/* Recent Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {recentNotes.length > 0 ? (
              recentNotes.map(note => renderNoteCard(note, false))
            ) : (
              <Text style={styles.emptyText}>No notes found</Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Selection Actions Bar */}
      {isSelecting && selectedIds.size > 0 && (
        <View style={styles.selectionBar}>
          <TouchableOpacity style={styles.selectionAction} onPress={handleShareSelected}>
            <ShareIcon size={20} color="#000" />
            <Text style={styles.selectionActionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionAction} onPress={handleDeleteSelected}>
            <TrashIcon size={20} color="#000" />
            <Text style={styles.selectionActionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Bar */}
      {!isSelecting && (
        <Animated.View style={[styles.floatingBar, { opacity: floatingBarOpacity }]}>
          <TouchableOpacity style={styles.recordButton} onPress={onStartRecording}>
            <MicrophoneIcon size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.newNoteButton} onPress={handleCreateNote}>
            <PlusIcon size={18} color="#f7f5ed" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E7E5DB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8C9A0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  selectButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  // Title
  title: {
    fontSize: 64,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: 0,
    lineHeight: 52,
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 5,
    fontFamily: 'Jersey10',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#Dad7cc',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  searchIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },

  // Categories
  categoriesScroll: {
    marginBottom: 20,
    paddingLeft: 24,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a80',
  },
  categoryButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  categoryText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Jersey25',
  },
  categoryTextActive: {
    color: '#fff',
    fontFamily: 'Jersey25',
  },
  addCategoryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  addCategoryIcon: {
    fontSize: 28,
    color: '#1a1a1a',
    fontWeight: '300',
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 10,
    marginTop: 0,
    fontFamily: 'Jersey10',
  },

  // Note Cards
  noteCard: {
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 7,
    position: 'relative',
  },
  pinnedCard: {
    backgroundColor: '#303138',
  },
  recentCard: {
    backgroundColor: '#DAD8CC',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#F7F5ED',
  },
  noteContent: {
    flex: 1,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 30,
  },
  pinIconContainer: {
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(75,41,17,0.9)',
    flex: 1,
  },
  noteTitlePinned: {
    color: '#f7f5ed',
  },
  noteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  noteDate: {
    fontSize: 14,
    color: 'rgba(82,55,37,0.79)',
    fontWeight: '600',
  },
  noteDatePinned: {
    color: '#B4B2A8',
  },
  notePreview: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(82,55,37,0.79)',
    flex: 1,
  },
  notePreviewPinned: {
    color: '#B4B2A8',
  },
  noteCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteCategory: {
    fontSize: 14,
    color: 'rgba(82,55,37,0.79)',
    fontWeight: '600',
  },
  noteCategoryPinned: {
    color: '#B4B2A8',
  },

  // Speaker Badge
  speakerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerBadgePinned: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  speakerCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
  },
  speakerCountPinned: {
    color: '#fff',
  },

  // Selection
  checkbox: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Empty State
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
    fontStyle: 'italic',
    paddingVertical: 48,
  },

  // Selection Bar
  selectionBar: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  selectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  selectionActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  // Floating Action Bar
  floatingBar: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -36 }], // Center the record button (8px padding + 28px half of 56px button)
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 4,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f7f5ed',
    borderColor: '#1a1a1a80',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newNoteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
