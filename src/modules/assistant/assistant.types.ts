export type AssistantIntent =
	| 'recommendation'
	| 'showtimes'
	| 'get_showtimes'
	| 'search_movies'
	| 'concession_menu'
	| 'pricing_promos'
	| 'policy_and_rules'
	| 'purchase_support'
	| 'unsupported_request'
	| 'unknown';

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

export type AssistantSuggestedAction =
	| 'browse_movies'
	| 'view_showtimes'
	| 'ask_more'
	| 'policy_help'
	| 'purchase_help'
	| 'concession_help'
	| 'pricing_help'
	| 'safety_refusal';

export interface AssistantChatResponse {
	intent: AssistantIntent;
	message: string;
	suggestedAction: AssistantSuggestedAction;
	followUpQuestions: string[];
	recommendations: AssistantRecommendation[];
	data?: {
		movies?: any[];
		showtimes?: any[];
		showtimePreference?: {
			kind?: 'first' | 'last';
			timeWindow?: 'afternoon' | 'evening' | 'morning';
		};
		policies?: string[];
		supportTips?: string[];
	};
}
