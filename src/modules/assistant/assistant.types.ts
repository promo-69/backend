export type AssistantIntent = 'recommendation' | 'showtimes' | 'unknown';

export interface AssistantChatRequest {
	message: string;
	cinemaId?: number;
	date?: string;
	sessionId?: string;
	userId?: number;
	[key: string]: any;
}

export interface AssistantRecommendation {
	id: number | string | null;
	title: string;
	subtitle?: string;
	type: 'movie' | 'special_event' | 'showtime';
	posterUrl?: string | null;
	nextShowtime?: string | null;
	metadata?: Record<string, unknown>;
}

export interface AssistantChatResponse {
	intent: AssistantIntent;
	message: string;
	suggestedAction: 'browse_movies' | 'view_showtimes' | 'ask_more';
	followUpQuestions: string[];
	recommendations: AssistantRecommendation[];
	data?: {
		movies?: any[];
		showtimes?: any[];
	};
}
