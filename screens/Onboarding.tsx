import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface OnboardingProps {
  onComplete: () => void;
  onLogin: () => void;
}

export default function Onboarding({ onComplete, onLogin }: OnboardingProps) {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  
  // Orb animation values (starting off-screen)
  const orb1X = useRef(new Animated.Value(-300)).current;
  const orb2X = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    // Sequence the animations with slight overlaps/staggering
    Animated.stagger(300, [
      // Step 1: Title fades in AND orbs bounce in
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(orb1X, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(orb2X, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Step 2: Subtitle fades in
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Step 3: Buttons fade in
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.orbContainer}>
        <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateX: orb1X }] }]} />
        <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateX: orb2X }] }]} />
      </View>

      <View style={styles.spacer} />

      <View style={styles.content}>
        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          Joddit
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Capture your ideas as they happen.
        </Animated.Text>
      </View>

      <Animated.View style={[styles.buttonContainer, { opacity: buttonsOpacity }]}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={onLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E7e5db', // Cream background
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
    width: 280,
    height: 280,
    backgroundColor: '#DAD8CC', // 100% opacity
    top: '15%',
    left: -40,
  },
  orb2: {
    width: 450,
    height: 450,
    backgroundColor: 'rgba(192, 184, 170, 0.5)', // #C0B8AA at 50% opacity
    bottom: 160,
    right: -130,
  },
  spacer: {
    flex: 1,
  },
  content: {
    marginBottom: 40,
    zIndex: 10,
  },
  title: {
    fontSize: 80,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0,
    fontFamily: 'Jersey10',
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(0, 0, 0, 0.7)',
    fontWeight: '400',
    maxWidth: 400,
    marginTop: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
    zIndex: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 24,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 24,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a80',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
});
