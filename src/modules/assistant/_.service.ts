import { BaseService } from '@bases/service.base.js';
import MoviesService from '@modules/movies/_.service.js';
import ShowtimesService from '@modules/showtimes/_.service.js';
import { ValidationError } from '@errors';
import { LLMProvider } from '@providers/llm.provider.js';
import type {
	AssistantChatRequest,
	AssistantChatResponse,
	AssistantRecommendation,
	AssistantIntent,
} from './assistant.types.js';

const GENRE_KEYWORDS: Record<string, number> = {
	terror: 5,
	suspenso: 5,
	acción: 1,
	accion: 1,
	comedia: 2,
	drama: 3,
	'ciencia ficción': 4,
	ficcion: 4,
	aventura: 10,
	romance: 9,
	animación: 6,
	animacion: 6,
	misterio: 12,
	fantasía: 11,
	fantasia: 11,
};

const SHOWTIME_KEYWORDS = /\b(funcion|funciones|showtime|showtimes|horario|cartelera|ver|programaci[oó]n)\b/i;

export class AssistantService extends BaseService {
	constructor() {
		super();
	}

	async processChatMessage(
		payload: AssistantChatRequest,
		session: any,
		requestContext?: Record<string, unknown>,
	): Promise<AssistantChatResponse> {
		this.validateRequired(payload, ['message']);

		const message = String(payload.message || '').trim();
		if (!message) throw new ValidationError('El mensaje de chat es requerido', ['message']);

		const intent = this.detectIntent(message);
		const date = this.resolveDate(payload.date, message);
		const cinemaId = payload.cinemaId;
		const genreId = this.detectGenre(message);

		if (intent === 'showtimes') {
			const showtimes = await this.findShowtimeRecommendations(cinemaId, date);
			const recommendations = showtimes.map(this.buildShowtimeCard);

			const messageText = recommendations.length
				? `Aquí tienes las funciones disponibles${cinemaId ? ` en la sucursal ${cinemaId}` : ''}${date ? ` para ${date}` : ''}.`
				: 'No encontré funciones disponibles con esos parámetros. Prueba con otra sucursal o fecha.';

			const llmContext = this.buildAssistantContext({
				session,
				request: {
					...(requestContext ?? {}),
					message,
					intent,
					type: 'showtime',
					cinemaId,
					date,
					recommendationsCount: recommendations.length,
				},
			});
			const llmMessage = await this.generateAssistantText(
				message,
				intent,
				recommendations,
				'showtime',
				llmContext,
			);

			return {
				intent,
				message: llmMessage || messageText,
				suggestedAction: recommendations.length ? 'view_showtimes' : 'ask_more',
				followUpQuestions: this.buildFollowUpQuestions(intent),
				recommendations,
				data: { showtimes },
			};
		}

		const movies = await this.findMovieRecommendations(genreId, cinemaId);
		const recommendations = movies.map(this.buildMovieCard);

		const messageText = recommendations.length
			? `${genreId ? 'Estas son algunas películas recomendadas según tu preferencia:' : 'Te comparto algunas películas que están en cartelera ahora mismo:'}`
			: 'No pude encontrar recomendaciones en este momento. Intenta con otro género o fecha.';

		const llmContext = this.buildAssistantContext({
			session,
			request: {
				...(requestContext ?? {}),
				message,
				intent,
				type: 'movie',
				cinemaId,
				date,
				genreId,
				recommendationsCount: recommendations.length,
			},
		});
		const llmMessage = await this.generateAssistantText(message, intent, recommendations, 'movie', llmContext);

		return {
			intent,
			message: llmMessage || messageText,
			suggestedAction: recommendations.length ? 'browse_movies' : 'ask_more',
			followUpQuestions: this.buildFollowUpQuestions(intent),
			recommendations,
			data: { movies },
		};
	}

	private detectIntent(message: string): AssistantIntent {
		const normalized = message.toLowerCase();
		if (SHOWTIME_KEYWORDS.test(normalized)) return 'showtimes';
		if (this.detectGenre(message)) return 'recommendation';
		if (/\b(hoy|mañana|manana|noche|tarde)\b/.test(normalized)) return 'showtimes';
		return 'recommendation';
	}

	private resolveDate(date: string | undefined, message: string): string | undefined {
		if (date && this.isValidDateString(date)) return date;

		const normalized = message.toLowerCase();
		const today = new Date();

		if (/\bhoy\b/.test(normalized)) return this.formatDate(today);
		if (/\b(mañana|manana)\b/.test(normalized))
			return this.formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
		if (/\b(este fin de semana|fin de semana)\b/.test(normalized)) return this.formatDate(today);

		return undefined;
	}

	private detectGenre(message: string): number | undefined {
		const normalized = message.toLowerCase();
		for (const [keyword, genreId] of Object.entries(GENRE_KEYWORDS)) {
			if (normalized.includes(keyword)) return genreId;
		}
		return undefined;
	}

	private async findMovieRecommendations(genreId?: number, cinemaId?: number): Promise<any[]> {
		if (genreId) {
			try {
				const result = await MoviesService.getByGenres([genreId], {
					pagination: { offset: 0, limit: 10 },
					order: [],
					qc: {},
					raw: {},
				});
				return result.rows;
			} catch {
				return [];
			}
		}

		const result = await MoviesService.getActiveWithShowtimes();
		return result.rows.slice(0, 10);
	}

	private async findShowtimeRecommendations(cinemaId?: number, date?: string): Promise<any[]> {
		try {
			const result = await ShowtimesService.getBillboard(cinemaId);
			const rows = Array.isArray(result.rows) ? result.rows : [];

			return rows
				.map((entry: any) => ({
					...entry,
					showtimes: Array.isArray(entry.showtimes)
						? entry.showtimes.filter((showtime: any) => this.isShowtimeOnDate(showtime, date))
						: [],
				}))
				.filter((entry: any) => entry.showtimes.length > 0)
				.slice(0, 10);
		} catch {
			return [];
		}
	}

	private isShowtimeOnDate(showtime: any, date?: string): boolean {
		if (!showtime || !showtime.booking?.start_time) return false;
		if (!date) return true;

		const startTime = new Date(showtime.booking.start_time);
		if (Number.isNaN(startTime.getTime())) return false;

		return this.formatDate(startTime) === date;
	}

	private buildMovieCard(movie: any): AssistantRecommendation {
		const genres = Array.isArray(movie.genres)
			? movie.genres.map((genre: any) => genre._Genre?.description ?? '').filter(Boolean)
			: [];

		return {
			id: movie.id,
			title: movie.title,
			subtitle: genres.length ? genres.join(', ') : (movie.synopsis ?? ''),
			type: 'movie',
			posterUrl: movie.poster_url ?? null,
			nextShowtime: null,
			metadata: {
				lifecycle_state: movie.lifecycle_state,
				duration_minutes: movie.duration_minutes,
			},
		};
	}

	private buildShowtimeCard(entry: any): AssistantRecommendation {
		const movie = entry.movie ?? entry.event;
		const firstShowtime = Array.isArray(entry.showtimes) ? entry.showtimes[0] : undefined;
		const startTime = firstShowtime?.booking?.start_time ?? null;

		return {
			id: movie?.id ?? null,
			title: movie?.title ?? 'Función disponible',
			subtitle: startTime ? `Próxima función: ${startTime}` : 'Función disponible',
			type: 'showtime',
			posterUrl: movie?.poster_url ?? null,
			nextShowtime: startTime,
			metadata: {
				cinema: firstShowtime?._Rooms?.cinema ?? null,
				room: firstShowtime?._Rooms?.name ?? null,
			},
		};
	}

	private buildFollowUpQuestions(intent: AssistantIntent): string[] {
		if (intent === 'showtimes') {
			return ['¿Deseas ver horarios en otra sucursal?', '¿Te gustaría filtrar por idioma o formato?'];
		}

		return ['¿Prefieres una película de acción, comedia o terror?', '¿Te interesa que sea subtitulada o doblada?'];
	}

	private isValidDateString(value: string): boolean {
		return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	private buildAssistantContext(options: { session?: any; request?: Record<string, unknown> }) {
		const session = options.session;
		const user = session?.userId
			? {
					isAuthenticated: true,
					userId: session.userId,
					firstName: session.firstName ?? null,
					lastName: session.lastName ?? null,
					email: session.email ?? null,
					roleCode: session.roleCode ?? null,
					permissions: Array.isArray(session.permissions) ? session.permissions : [],
				}
			: {
					isAuthenticated: false,
					userId: null,
					roleCode: null,
					permissions: [],
				};

		return {
			user,
			request: options.request ?? {},
			backend: {
				currentDate: new Date().toISOString(),
				source: 'assistant-module',
				channel: 'web-mobile',
			},
		};
	}

	private normalizeContext(context?: Record<string, unknown>): Record<string, unknown> {
		if (!context || (context.user && context.request) || context.backend) {
			return (context ?? {}) as Record<string, unknown>;
		}

		const maybeContext = context as Record<string, unknown> & {
			isAuthenticated?: boolean;
			user?: Record<string, unknown>;
			cinemaId?: number;
		};
		const userContext = (maybeContext.user as Record<string, unknown> | undefined) ?? {
			isAuthenticated: maybeContext.isAuthenticated ?? false,
			userId: maybeContext.userId ?? null,
			firstName: maybeContext.firstName ?? null,
			lastName: maybeContext.lastName ?? null,
			email: maybeContext.email ?? null,
			roleCode: maybeContext.roleCode ?? null,
			permissions: Array.isArray(maybeContext.permissions) ? maybeContext.permissions : [],
		};

		return {
			user: userContext,
			request: {
				...(maybeContext.request as Record<string, unknown> | undefined),
				cinemaId: maybeContext.cinemaId,
			},
			backend: {
				currentDate: new Date().toISOString(),
				source: 'assistant-module',
				channel: 'web-mobile',
			},
		};
	}

	async processAudioMessage(
		payload: AssistantChatRequest,
		session: any,
		requestContext?: Record<string, unknown>,
		audioBuffer?: Buffer,
		mimeType?: string,
	): Promise<AssistantChatResponse> {
		const message = String(payload.message || '').trim();
		const intent = this.detectIntent(message);
		const date = this.resolveDate(payload.date, message);
		const cinemaId = payload.cinemaId;
		const genreId = this.detectGenre(message);
		const recommendations = await this.resolveRecommendations(intent, cinemaId, date, genreId);
		const llmContext = this.buildAssistantContext({
			session,
			request: {
				...(requestContext ?? {}),
				message,
				intent,
				type: 'audio',
				cinemaId,
				date,
				genreId,
				recommendationsCount: recommendations.length,
			},
		});

		const prompt = `Usuario: ${message}\nIntención detectada: ${intent}\nTipo: audio`;
		const llmMessage =
			audioBuffer && mimeType
				? await this.generateAssistantAudio(prompt, audioBuffer, mimeType, llmContext)
				: null;

		return {
			intent,
			message: llmMessage || 'Escuché tu mensaje de voz. Te ayudo a encontrar lo que necesitas.',
			suggestedAction: recommendations.length ? 'browse_movies' : 'ask_more',
			followUpQuestions: this.buildFollowUpQuestions(intent),
			recommendations,
			data: { movies: recommendations.filter((item) => item.type === 'movie') },
		};
	}

	private async resolveRecommendations(
		intent: AssistantIntent,
		cinemaId?: number,
		date?: string,
		genreId?: number,
	): Promise<AssistantRecommendation[]> {
		try {
			if (intent === 'showtimes') {
				const showtimes = await this.findShowtimeRecommendations(cinemaId, date);
				return showtimes.map(this.buildShowtimeCard);
			}

			const movies = await this.findMovieRecommendations(genreId, cinemaId);
			return movies.map(this.buildMovieCard);
		} catch {
			return [];
		}
	}

	private async generateAssistantAudio(
		prompt: string,
		audioBuffer: Buffer,
		mimeType: string,
		context?: Record<string, unknown>,
	): Promise<string | null> {
		try {
			const provider = LLMProvider.getInstance();
			const systemInstruction =
				'Eres CineBot, el asistente virtual de Cineflix. Responde en español, breve y útil. ' +
				'Si el usuario habla de horarios, funciones o películas, responde de forma concreta y orienta al usuario al flujo correcto.';

			const normalizedContext = this.normalizeContext(context);
			return await provider.createAudioCompletion(audioBuffer, mimeType, prompt, {
				systemInstruction,
				context: normalizedContext,
			});
		} catch {
			return null;
		}
	}

	private async generateAssistantText(
		userMessage: string,
		intent: AssistantIntent,
		recommendations: AssistantRecommendation[],
		type: 'movie' | 'showtime',
		context?: Record<string, unknown>,
	): Promise<string | null> {
		try {
			const provider = LLMProvider.getInstance();
			const recommendationSummary =
				recommendations
					.slice(0, 5)
					.map((item) => `- ${item.title}${item.subtitle ? ` (${item.subtitle})` : ''}`)
					.join('\n') || 'No hay recomendaciones disponibles en este momento.';

			const systemInstruction =
				'Eres CineBot, el asistente virtual de Cineflix. Responde en español con un tono amigable, breve y útil. ' +
				'Si el usuario consulta horarios o funciones, menciona que puede abrir los detalles en la app o web. ' +
				'Si no hay recomendaciones, sugiere cambiar el género, fecha o sucursal. ' +
				'No puedes crear órdenes, pagos ni reservas directamente; guía al usuario a la interfaz correspondiente.';

			const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
				{
					role: 'system',
					content: systemInstruction,
				},
				{
					role: 'user',
					content: `Usuario: ${userMessage}\nIntención detectada: ${intent}\nTipo: ${type}\nRecomendaciones:\n${recommendationSummary}`,
				},
			];

			const normalizedContext = this.normalizeContext(context);
			const response = await provider.createChatCompletion(messages, {
				systemInstruction,
				context: normalizedContext,
			});
			return response;
		} catch {
			return null;
		}
	}
}

export default new AssistantService();
