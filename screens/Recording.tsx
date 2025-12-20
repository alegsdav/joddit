import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { transcribeAudio, formatTranscriptWithSpeakers } from '../lib/deepgram';

interface RecordingProps {
  onCancel: () => void;
  onFinish: (transcript: string, segments: any[]) => void;
}

export default function RecordingScreen({ onCancel, onFinish }: RecordingProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow microphone access to record audio.');
        onCancel();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      onCancel();
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setIsTranscribing(true);
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (!uri) {
        throw new Error('No audio URI available');
      }
      
      // Transcribe with Deepgram
      try {
        const { transcript, segments } = await transcribeAudio(uri);
        const formattedTranscript = formatTranscriptWithSpeakers(segments);
        
        onFinish(formattedTranscript || transcript, segments);
      } catch (transcribeError) {
        console.error('Transcription error:', transcribeError);
        // Fallback to placeholder if transcription fails
        const fallbackTranscript = `Recording from ${new Date().toLocaleString()}\n\nDuration: ${formatDuration(duration)}\n\nTranscription failed. Please check your Deepgram API key.`;
        onFinish(fallbackTranscript, []);
      }
      
      // Clean up
      recordingRef.current = null;
      setRecording(null);
      setIsTranscribing(false);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
      setIsTranscribing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    startRecording();
    
    return () => {
      // Cleanup on unmount
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
        recordingRef.current = null;
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.waveform}>
          <View style={[styles.wave, { height: 40 }]} />
          <View style={[styles.wave, { height: 60 }]} />
          <View style={[styles.wave, { height: 80 }]} />
          <View style={[styles.wave, { height: 100 }]} />
          <View style={[styles.wave, { height: 80 }]} />
          <View style={[styles.wave, { height: 60 }]} />
          <View style={[styles.wave, { height: 40 }]} />
        </View>

        <Text style={styles.duration}>{formatDuration(duration)}</Text>
        <Text style={styles.status}>
          {isRecording ? 'Recording...' : isTranscribing ? 'Transcribing with Deepgram...' : 'Processing...'}
        </Text>
      </View>

      <View style={styles.controls}>
        {isRecording ? (
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={stopRecording}
          >
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        ) : (
          <View style={styles.processingIndicator}>
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
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
  },
  cancelButton: {
    alignSelf: 'flex-start',
  },
  cancelText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 48,
  },
  wave: {
    width: 4,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  duration: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: -2,
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.5)',
  },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  processingIndicator: {
    paddingVertical: 20,
  },
  processingText: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.5)',
  },
});
