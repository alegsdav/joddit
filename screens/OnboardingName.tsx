import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';

interface OnboardingNameProps {
  onComplete: () => void;
}

export default function OnboardingName({ onComplete }: OnboardingNameProps) {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      // Update Clerk user's first name
      await user?.update({
        firstName: name.trim(),
      });
      onComplete();
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.orbContainer}>
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What's your{'\n'}name?</Text>
        <Text style={styles.subtitle}>Your name will be displayed at the top of your journal.</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="rgba(0,0,0,0.3)"
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.primaryButton, (!name.trim() || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!name.trim() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Start Creating</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3',
    padding: 32,
    justifyContent: 'space-between',
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 256,
    height: 256,
    backgroundColor: 'rgba(251, 146, 60, 0.4)',
    top: -50,
    left: -40,
  },
  orb2: {
    width: 320,
    height: 320,
    backgroundColor: 'rgba(191, 219, 254, 0.5)',
    bottom: -100,
    right: -80,
  },
  content: {
    marginTop: 100,
    zIndex: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: -1,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '300',
    marginTop: 16,
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 24,
    fontSize: 18,
    color: '#000',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonContainer: {
    marginBottom: 48,
    zIndex: 10,
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
});

