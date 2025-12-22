import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';

interface ProfileProps {
  onBack: () => void;
  onLogin: () => void;
}

export default function Profile({ onBack, onLogin }: ProfileProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut, isSignedIn } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.firstName || '');
  const [updating, setUpdating] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      onBack();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setUpdating(true);
    try {
      await user?.update({
        firstName: newName.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update name');
    } finally {
      setUpdating(false);
    }
  };

  if (!isUserLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitial}>
              {isSignedIn ? (user?.firstName?.[0] || user?.emailAddresses[0].emailAddress[0]).toUpperCase() : '?'}
            </Text>
          </View>
          
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                autoCapitalize="words"
              />
              <View style={styles.editButtons}>
                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleUpdateName} 
                  style={styles.saveButton}
                  disabled={updating}
                >
                  {updating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>
                  {isSignedIn ? (user?.firstName || 'User') : 'Guest User'}
                </Text>
                {isSignedIn && (
                  <TouchableOpacity onPress={() => {
                    setNewName(user?.firstName || '');
                    setIsEditing(true);
                  }}>
                    <Text style={styles.editIcon}>✎</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.userEmail}>
                {isSignedIn ? user?.emailAddresses[0].emailAddress : 'Sign in to sync your notes across devices'}
              </Text>
            </>
          )}

          {!isSignedIn ? (
            <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
              <Text style={styles.loginButtonText}>Sign In / Sign Up</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>

        {isSignedIn && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user?.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        )}
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  editIcon: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.3)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  editContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  nameInput: {
    width: '100%',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 8,
    marginBottom: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cancelButtonText: {
    color: 'rgba(0,0,0,0.5)',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(0,0,0,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    maxWidth: '60%',
  },
});

