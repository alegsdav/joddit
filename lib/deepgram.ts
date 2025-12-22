import * as FileSystem from 'expo-file-system';

const DEEPGRAM_API_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.warn('[Deepgram] API key is not defined in environment variables.');
}

interface TranscriptionSegment {
  speakerId: string;
  text: string;
  timestamp: number;
}

export async function transcribeAudio(audioUri: string): Promise<{
  transcript: string;
  segments: TranscriptionSegment[];
}> {
  try {
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key not configured');
    }

    // In Expo 54, getInfoAsync is deprecated/removed.
    // We can just rely on fetch(audioUri) to fail if the file doesn't exist,
    // or use a more compatible check if needed.
    
    // Upload to Deepgram using fetch API
    const audioBlob = await fetch(audioUri).then(r => r.blob());
    
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true&utterances=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav',
        },
        body: audioBlob,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Extract transcript and segments
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const utterances = result.results?.utterances || [];

    // Convert utterances to segments with speaker diarization
    const segments: TranscriptionSegment[] = utterances.map((utterance: any) => ({
      speakerId: `speaker-${utterance.speaker}`,
      text: utterance.transcript,
      timestamp: utterance.start,
    }));

    return { transcript, segments };
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    throw error;
  }
}

// Format segments for display
export function formatTranscriptWithSpeakers(segments: TranscriptionSegment[]): string {
  if (segments.length === 0) return '';

  return segments
    .map((seg) => {
      const speakerNum = seg.speakerId.replace('speaker-', '');
      const speakerLabel = `Speaker ${parseInt(speakerNum) + 1}`;
      return `${speakerLabel}: ${seg.text}`;
    })
    .join('\n\n');
}
