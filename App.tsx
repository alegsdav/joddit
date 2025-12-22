import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { useFonts, Jersey10_400Regular } from '@expo-google-fonts/jersey-10';
import { tokenCache } from './lib/clerk';
import { useNotes, storage } from './lib/storage';
import { Note, AppView } from './types';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Editor from './screens/Editor';
import Recording from './screens/Recording';
import Auth from './screens/Auth';
import Profile from './screens/Profile';
import OnboardingName from './screens/OnboardingName';



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
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const notes = useNotes(user?.id) || [];
  const [view, setView] = useState<AppView>('onboarding');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded) return;

    // Logic to determine initial view
    if (isSignedIn) {
      if (!user?.firstName) {
        setView('onboarding_name');
      } else if (view === 'onboarding' || view === 'auth') {
        setView('home');
      }
    }
  }, [isSignedIn, isAuthLoaded, isUserLoaded, user?.firstName]);

  useEffect(() => {
    const init = async () => {
      const currentNotes = await storage.getNotes(user?.id);
      if (currentNotes.length === 0) {
        await storage.bulkSaveNotes(INITIAL_NOTES, user?.id);
      }
    };
    init();
  }, [user?.id]);

  // Update view when sign-in status changes
  useEffect(() => {
    if (isSignedIn && view === 'auth') {
      setView('home');
    }
  }, [isSignedIn, view]);

  const handleUpdateNote = async (note: Note) => {
    await storage.saveNote(note, user?.id);
  };

  const handleDeleteNote = async (id: string) => {
    await storage.deleteNote(id, user?.id);
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
    
    await storage.saveNote(newNote, user?.id);
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

      {view === 'onboarding_name' && (
        <OnboardingName 
          onComplete={() => setView('home')}
        />
      )}
      
      {view === 'home' && (
        <Home
          notes={notes}
          userName={user?.firstName || 'Guest'}
          onStartRecording={() => setView('recording')}
          onSelectNote={(note) => {
            setSelectedNote(note);
            setView('editor');
          }}
          onUpdateNote={handleUpdateNote}
          onOpenProfile={() => setView('profile')}
        />
      )}

      {view === 'profile' && (
        <Profile 
          onBack={() => setView('home')}
          onLogin={() => setView('auth')}
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
  const [fontsLoaded] = useFonts({
    'Jersey10': Jersey10_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <MainApp />
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E7e5db', // Match onboarding background
  },
});
