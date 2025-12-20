import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from './lib/clerk';
import { useNotes, storage } from './lib/storage';
import { Note, AppView } from './types';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Editor from './screens/Editor';
import Recording from './screens/Recording';
import Auth from './screens/Auth';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'Product Vision',
    content: 'Joddit is not a productivity app. It is a thinking companion. It respects silence and design.',
    segments: [],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    isPinned: true,
    category: 'Ideas',
    isSynced: false,
    isDeleted: false
  },
  {
    id: '2',
    title: 'Grocery List',
    content: 'Milk, Eggs, Bread, Avocados for breakfast.',
    segments: [],
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
    isPinned: false,
    category: 'Personal',
    isSynced: false,
    isDeleted: false
  }
];

function MainApp() {
  const { isSignedIn } = useAuth();
  const notes = useNotes() || [];
  const [view, setView] = useState<AppView>('onboarding');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    const init = async () => {
      const currentNotes = await storage.getNotes();
      if (currentNotes.length === 0) {
        await storage.bulkSaveNotes(INITIAL_NOTES);
      }
    };
    init();
  }, []);

  const handleUpdateNote = async (note: Note) => {
    await storage.saveNote(note);
  };

  const handleDeleteNote = async (id: string) => {
    await storage.deleteNote(id);
    setSelectedNote(null);
  };

  const handleFinishRecording = async (transcript: string, segments: any[]) => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Voice Note',
      content: transcript,
      segments: segments,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      category: 'Recent',
      isSynced: false,
      isDeleted: false
    };
    await storage.saveNote(newNote);
    setSelectedNote(newNote);
    setView('editor');
  };

  return (
    <View style={styles.container}>
      {view === 'onboarding' && (
        <Onboarding 
          onComplete={() => setView('home')}
          onLogin={() => setView('auth')}
        />
      )}
      
      {view === 'home' && (
        <Home
          notes={notes}
          onStartRecording={() => setView('recording')}
          onSelectNote={(note) => {
            setSelectedNote(note);
            setView('editor');
          }}
          onUpdateNote={handleUpdateNote}
        />
      )}

      {view === 'editor' && selectedNote && (
        <Editor
          note={selectedNote}
          onBack={() => setView('home')}
          onUpdate={handleUpdateNote}
          onDelete={() => handleDeleteNote(selectedNote.id)}
        />
      )}

      {view === 'recording' && (
        <Recording
          onCancel={() => setView('home')}
          onFinish={handleFinishRecording}
        />
      )}

      {view === 'auth' && (
        <Auth onBack={() => {
          console.log('App: Auth onBack called, setting view to onboarding');
          setView('onboarding');
        }} />
      )}
      
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <MainApp />
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 32,
  },
  info: {
    fontSize: 16,
    color: '#333',
    marginVertical: 4,
  },
});
