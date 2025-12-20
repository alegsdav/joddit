import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface OnboardingProps {
  onComplete: () => void;
  onLogin: () => void;
}

export default function Onboarding({ onComplete, onLogin }: OnboardingProps) {
  const handleContinue = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.orbContainer}>
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
      </View>

      <View style={styles.spacer} />

      <View style={styles.content}>
        <Text style={styles.title}>Joddit</Text>
        <Text style={styles.subtitle}>Capture your ideas as they happen.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={onLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    top: 80,
    left: -40,
  },
  orb2: {
    width: 320,
    height: 320,
    backgroundColor: 'rgba(191, 219, 254, 0.5)',
    bottom: 160,
    right: -80,
  },
  spacer: {
    flex: 1,
  },
  content: {
    marginBottom: 80,
    zIndex: 10,
  },
  title: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '300',
    maxWidth: 280,
    marginTop: 16,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 48,
    zIndex: 10,
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '500',
  },
});
