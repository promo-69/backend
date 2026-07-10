import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const LLM_PROVIDER_SYMBOL = Symbol.for('global.llm.provider');

type ChatMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

type LLMRequestOptions = {
	systemInstruction?: string;
	context?: Record<string, unknown>;
};

type AudioLLMRequestOptions = {
	systemInstruction?: string;
	context?: Record<string, unknown>;
	prompt?: string;
};

export class LLMProvider {
	private static _instance: LLMProvider;
	private readonly provider: string;
	private readonly apiKey: string;
	private readonly model: string;
	private readonly baseUrl: string;
	private readonly googleClient: GoogleGenerativeAI | null;

	private constructor() {
		const config = AppConfig.load();
		this.provider = config.llm.provider.toLowerCase();
		this.apiKey = config.llm.apiKey;
		this.model = config.llm.model;
		this.baseUrl = config.llm.baseUrl;
		this.googleClient = this.provider === 'google' ? new GoogleGenerativeAI(this.apiKey) : null;

		if (!this.apiKey) {
			throw new Error(
				'LLM_API_KEY no está configurado en el entorno. Agrega OPENAI_API_KEY o GOOGLE_API_KEY según el proveedor.',
			);
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

	async createChatCompletion(messages: ChatMessage[], options?: LLMRequestOptions): Promise<string> {
		const fetchFn = (globalThis as any).fetch;
		if (typeof fetchFn !== 'function' && this.provider !== 'google') {
			throw new Error('Fetch no está disponible en este entorno.');
		}

		if (this.provider === 'openai') {
			return this.createOpenAIChatCompletion(fetchFn, messages);
		}

		if (this.provider === 'google') {
			return this.createGoogleChatCompletion(messages, options);
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

	async createAudioCompletion(
		audioBuffer: Buffer,
		mimeType: string,
		prompt: string,
		options?: AudioLLMRequestOptions,
	): Promise<string> {
		if (this.provider !== 'google') {
			throw new Error('El procesamiento de audio solo está soportado con el proveedor de Gemini.');
		}

		if (!this.googleClient) {
			throw new Error('No se pudo inicializar el cliente de Gemini.');
		}

		const systemInstruction = [options?.systemInstruction, this.formatContextForPrompt(options?.context)]
			.filter(Boolean)
			.join('\n\n');

		const model = this.googleClient.getGenerativeModel({
			model: this.model,
			systemInstruction,
		});

		const audioPart = {
			inlineData: {
				data: audioBuffer.toString('base64'),
				mimeType,
			},
		};

		const result = await model.generateContent({
			contents: [
				{
					role: 'user',
					parts: [{ text: prompt || 'Analiza el audio del usuario y responde de forma útil.' }, audioPart],
				},
			],
		});

		const responseText = result?.response?.text?.() ?? '';
		if (!responseText || typeof responseText !== 'string') {
			throw new Error('Respuesta inválida del servicio LLM.');
		}

		return responseText.trim();
	}

	private async createGoogleChatCompletion(messages: ChatMessage[], options?: LLMRequestOptions): Promise<string> {
		if (!this.googleClient) {
			throw new Error('No se pudo inicializar el cliente de Gemini.');
		}

		const systemInstruction = [options?.systemInstruction, this.formatContextForPrompt(options?.context)]
			.filter(Boolean)
			.join('\n\n');

		const model = this.googleClient.getGenerativeModel({
			model: this.model,
			systemInstruction,
		});

		const contents = messages.map((message) => ({
			role: message.role === 'assistant' ? 'model' : 'user',
			parts: [{ text: message.content }],
		}));

		const result = await model.generateContent({ contents });
		const responseText = result?.response?.text?.() ?? '';

		if (!responseText || typeof responseText !== 'string') {
			throw new Error('Respuesta inválida del servicio LLM.');
		}

		return responseText.trim();
	}

	private formatContextForPrompt(context?: Record<string, unknown>): string {
		if (!context) return '';
		return `Contexto del backend:\n${JSON.stringify(context, null, 2)}`;
	}
}
