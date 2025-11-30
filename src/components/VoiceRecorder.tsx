import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface VoiceRecorderProps {
  isProcessing: boolean;
  onRecordingComplete: (audioBlob: Blob) => void;
}

export function VoiceRecorder({ isProcessing, onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={clsx(
          "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
          isRecording && "bg-red-500 text-white animate-pulse-red scale-110 cursor-pointer",
          isProcessing && "bg-gray-100 text-gray-400 cursor-not-allowed",
          !isRecording && !isProcessing && "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-xl cursor-pointer"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isRecording ? (
          <Square className="w-8 h-8 fill-current" />
        ) : (
          <Mic className="w-10 h-10" />
        )}
      </button>
      <p className="mt-6 text-sm font-medium text-gray-500 animate-fade-in">
        {isRecording 
          ? "Listening... Tap to stop" 
          : isProcessing 
            ? "AI is thinking..." 
            : "Tap to create an event"}
      </p>
    </div>
  );
}