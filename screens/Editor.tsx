import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Note } from '../types';

interface EditorProps {
  note: Note;
  onBack: () => void;
  onUpdate: (note: Note) => void;
  onDelete: () => void;
}

export default function Editor({ note, onBack, onUpdate, onDelete }: EditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const handleSave = () => {
    const updatedNote: Note = {
      ...note,
      title,
      content,
      updatedAt: Date.now(),
    };
    onUpdate(updatedNote);
    onBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete();
            onBack();
          }
        }
      ]
    );
  };

  const handleTogglePin = () => {
    const updatedNote: Note = {
      ...note,
      title,
      content,
      isPinned: !note.isPinned,
      updatedAt: Date.now(),
    };
    onUpdate(updatedNote);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleTogglePin} style={styles.iconButton}>
            <Text style={styles.icon}>{note.isPinned ? '📌' : '📍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
            <Text style={styles.icon}>🗑️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          placeholderTextColor="rgba(0,0,0,0.3)"
          value={title}
          onChangeText={setTitle}
          multiline
        />
        
        <TextInput
          style={styles.contentInput}
          placeholder="Start writing..."
          placeholderTextColor="rgba(0,0,0,0.3)"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
        
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Created: {new Date(note.createdAt).toLocaleString()}
          </Text>
          <Text style={styles.metadataText}>
            Updated: {new Date(note.updatedAt).toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  saveButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  titleInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    letterSpacing: -1,
  },
  contentInput: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    minHeight: 200,
  },
  metadata: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
  },
});
