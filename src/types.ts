export interface Task {
	id: string;
	user_id: string;
	created_at: string;
	audio_url: string | null;
	transcription: string | null;
	title: string | null;
	event_date: string | null;
	is_synced: boolean;
	// UI-Only States
	isProcessing?: boolean;
	isFailed?: boolean;
}

export interface EdgeFunctionResponse {
	transcription: string;
	data: {
		title: string;
		date: string;
	};
}
