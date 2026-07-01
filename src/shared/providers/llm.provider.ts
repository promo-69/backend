import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';

const LLM_PROVIDER_SYMBOL = Symbol.for('global.llm.provider');

type ChatMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export class LLMProvider {
	private static _instance: LLMProvider;
	private readonly provider: string;
	private readonly apiKey: string;
	private readonly model: string;
	private readonly baseUrl: string;

	private constructor() {
		const config = AppConfig.load();
		this.provider = config.llm.provider.toLowerCase();
		this.apiKey = config.llm.apiKey;
		this.model = config.llm.model;
		this.baseUrl = config.llm.baseUrl;

		if (!this.apiKey) {
			throw new Error('LLM_API_KEY no está configurado en el entorno. Agrega OPENAI_API_KEY en .env.');
		}

		Logger.natural(ANSI.success(`[+] LLM Provider initialized: ${this.provider}`));
	}

	static getInstance(): LLMProvider {
		if (AppConfig.isProduction()) {
			if (!this._instance) this._instance = new LLMProvider();
			return this._instance;
		}

		const globalWithLLM = globalThis as typeof globalThis & {
			[LLM_PROVIDER_SYMBOL]?: LLMProvider;
		};

		if (!globalWithLLM[LLM_PROVIDER_SYMBOL]) {
			globalWithLLM[LLM_PROVIDER_SYMBOL] = new LLMProvider();
		}

		return globalWithLLM[LLM_PROVIDER_SYMBOL] as LLMProvider;
	}

	async createChatCompletion(messages: ChatMessage[]): Promise<string> {
		const fetchFn = (globalThis as any).fetch;
		if (typeof fetchFn !== 'function') {
			throw new Error('Fetch no está disponible en este entorno.');
		}

		if (this.provider === 'openai') {
			return this.createOpenAIChatCompletion(fetchFn, messages);
		}

		if (this.provider === 'google') {
			return this.createGoogleChatCompletion(fetchFn, messages);
		}

		throw new Error(`LLM provider no soportado: ${this.provider}`);
	}

	private async createOpenAIChatCompletion(fetchFn: any, messages: ChatMessage[]): Promise<string> {
		const response = await fetchFn(`${this.baseUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({
				model: this.model,
				messages,
				temperature: 0.7,
				max_tokens: 400,
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(`LLM request failed (${response.status}): ${errorBody}`);
		}

		const result = await response.json();
		const message = result?.choices?.[0]?.message?.content;

		if (!message || typeof message !== 'string') {
			throw new Error('Respuesta inválida del servicio LLM.');
		}

		return message.trim();
	}

	private async createGoogleChatCompletion(fetchFn: any, messages: ChatMessage[]): Promise<string> {
		const url = `${this.baseUrl}/models/${this.model}:generateMessage?key=${encodeURIComponent(this.apiKey)}`;

		const googleMessages = messages.map((message) => ({
			author: message.role === 'assistant' ? 'assistant' : message.role === 'user' ? 'user' : 'system',
			content: [{ type: 'text', text: message.content }],
		}));

		const response = await fetchFn(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				messages: googleMessages,
				temperature: 0.7,
				maxOutputTokens: 400,
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(`LLM request failed (${response.status}): ${errorBody}`);
		}

		const result = await response.json();
		const message = result?.candidates?.[0]?.content?.[0]?.text;

		if (!message || typeof message !== 'string') {
			throw new Error('Respuesta inválida del servicio LLM.');
		}

		return message.trim();
	}
}
