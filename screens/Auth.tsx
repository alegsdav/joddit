import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

interface AuthProps {
  onBack: () => void;
}

export default function Auth({ onBack }: AuthProps) {
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  
  // Debug function
  const handleBack = () => {
    console.log('Auth: Back button pressed');
    onBack();
  };
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!signIn) return;
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActiveSignIn({ session: result.createdSessionId });
        // No need to call onBack() here, App.tsx will detect isSignedIn and redirect
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || 'Failed to sign in';
      if (errorMessage.toLowerCase().includes('session already exists') || err.status === 403) {
        // If session exists, we should be good to go back
        console.log('Session already exists, navigating back');
        onBack();
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUp) return;
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp) return;
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        // App.tsx handles the redirect
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            console.log('Auth: Verification back button pressed');
            setPendingVerification(false);
            onBack();
          }} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.orb, styles.orb1]} />
          <View style={[styles.orb, styles.orb2]} />

          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Verification code"
              placeholderTextColor="rgba(0,0,0,0.3)"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />

        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Sign up to sync your notes' : 'Sign in to sync your notes'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isSignUp ? handleSignUp : handleSignIn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchButton}>
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    zIndex: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
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
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: -1,
    marginBottom: 8,
    zIndex: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '300',
    marginBottom: 32,
    zIndex: 10,
  },
  form: {
    gap: 16,
    zIndex: 10,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchText: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 14,
  },
});
