'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribeTransaction } from '@/ai/flows/transcribe-transaction';
import { cn } from '@/lib/utils';

type VoiceInputProps = {
  onTranscription: (text: string) => void;
};

type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'error';

export function VoiceInput({ onTranscription }: VoiceInputProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    setStatus('recording');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
        
        setStatus('transcribing');
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const result = await transcribeTransaction({ audioDataUri: base64Audio });
            if (result.transactionDetails) {
              onTranscription(result.transactionDetails);
              setStatus('idle');
            } else {
              throw new Error('Transcription failed to produce text.');
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast({
                variant: 'destructive',
                title: 'Transcription Error',
                description: 'Could not transcribe audio. Please try again.',
            });
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
          }
        };
      };
      
      mediaRecorderRef.current.start();
    } catch (error) {
      console.error('Microphone access denied:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access to use this feature.',
      });
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };
  
  const getButtonContent = () => {
    switch (status) {
        case 'recording':
            return <><Square className="mr-2 h-4 w-4" /> Stop Recording</>;
        case 'transcribing':
            return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transcribing...</>;
        case 'error':
            return 'Error';
        case 'idle':
        default:
            return <><Mic className="mr-2 h-4 w-4" /> Record Voice</>;
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
        disabled={status === 'transcribing'}
        className={cn(
            "w-full",
            status === 'recording' && 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:text-red-600',
            status === 'error' && 'bg-destructive text-destructive-foreground'
        )}
      >
        {getButtonContent()}
      </Button>
      <p className="text-xs text-muted-foreground">Bicara dalam Bahasa Indonesia</p>
    </div>
  );
}
