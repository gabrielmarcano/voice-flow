export interface Task {
  id: string;
  user_id: string;
  created_at: string;
  audio_url: string | null;
  transcription: string | null;
  title: string | null;
  event_date: string | null;
  status: 'processing' | 'synced' | 'failed' | 'pending';
}

export interface EdgeFunctionResponse {
  transcription: string;
  data: {
    title: string;
    date: string;
  };
}