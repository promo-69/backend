import { BaseService } from '@bases/service.base.js';
import MoviesService from '@modules/movies/_.service.js';
import ShowtimesService from '@modules/showtimes/_.service.js';
import ConcessionsService from '@modules/concessions/_.service.js';
import PaymentsService from '@modules/payments/_.service.js';
import UsersService from '@modules/users/_.service.js';
import { ValidationError, DatabaseError, UnknownError, AppError } from '@errors';
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
const POLICY_KEYWORDS =
	/\b(comida externa|reembolso|reembols|menor|niño|niña|permiso|regla|política|politica|ingreso|llegar|anticipación|anticipacion)\b/i;
const PURCHASE_KEYWORDS =
	/\b(compra|compré|comprar|bolet|ticket|código qr|codigo qr|correo|confirmación|confirmacion|pago|fallo|error|no me llegó|no me llego|qr|reembolso)\b/i;
const CONCESSION_KEYWORDS =
	/\b(cotufa|cotufas|palomita|palomitas|combo|refresco|bebida|concesi[oó]n|snack|food|coleccionable)\b/i;
const PRICING_KEYWORDS =
	/\b(precio|precios|tarifa|tarifas|descuento|promoción|promocion|2x1|lunes|estudiante|adulto mayor|niño|niños|precio general)\b/i;
const UPCOMING_KEYWORDS =
	/\b(estreno|estrenos|próximos|proximos|llegan|llegará|llegara|este mes|esta semana|próxima semana|proxima semana)\b/i;

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

		if (this.shouldRejectRequest(message)) {
			return {
				intent: 'unsupported_request',
				message:
					'Puedo ayudarte con temas del cine, como películas, funciones, compras, políticas o concesiones. Si quieres algo fuera de ese alcance, te puedo orientar hacia una consulta relacionada con el cine.',
				suggestedAction: 'safety_refusal',
				followUpQuestions: [
					'¿Quieres buscar películas o funciones?',
					'¿Necesitas ayuda con una compra o política del cine?',
				],
				recommendations: [],
			};
		}

		if (intent === 'policy_and_rules') {
			const policyResponse = this.buildPolicyResponse(message);
			return {
				intent,
				message: policyResponse.message,
				suggestedAction: 'policy_help',
				followUpQuestions: [
					'¿Quieres que te ayude con otra regla o política del cine?',
					'¿Necesitas ayuda con tu compra o tus boletos?',
				],
				recommendations: [],
				data: { policies: policyResponse.relatedPolicies },
			};
		}

		if (intent === 'purchase_support') {
			const purchaseResponse = await this.buildPurchaseSupportResponse(message, session);
			return {
				intent,
				message: purchaseResponse.message,
				suggestedAction: 'purchase_help',
				followUpQuestions: [
					'¿Quieres que te ayude a revisar tu compra?',
					'¿Prefieres que te guíe con el reembolso o cambio de fecha?',
				],
				recommendations: [],
				data: { supportTips: purchaseResponse.supportTips },
			};
		}

		if (intent === 'concession_menu') {
			const concessionResponse = await this.buildConcessionResponse(cinemaId, session);
			return {
				intent,
				message: concessionResponse.message,
				suggestedAction: 'concession_help',
				followUpQuestions: [
					'¿Quieres ver combos especiales o coleccionables?',
					'¿Prefieres opciones saludables o para compartir?',
				],
				recommendations: concessionResponse.recommendations,
			};
		}

		if (intent === 'pricing_promos') {
			const pricingResponse = await this.buildPricingResponse(cinemaId, session);
			return {
				intent,
				message: pricingResponse.message,
				suggestedAction: 'pricing_help',
				followUpQuestions: [
					'¿Quieres comparar precios por formato o sucursal?',
					'¿Te ayudo con promociones activas hoy?',
				],
				recommendations: pricingResponse.recommendations,
			};
		}

		if (intent === 'showtimes' || intent === 'get_showtimes') {
			const showtimePreference = this.resolveShowtimePreference(message);
			const showtimes = await this.findShowtimeRecommendations(cinemaId, date, showtimePreference);
			const recommendations = showtimes.map(this.buildShowtimeCard);

			const messageText = this.buildShowtimeResponseText(recommendations, cinemaId, date, showtimePreference);

			const llmContext = this.buildAssistantContext({
				session,
				request: {
					...(requestContext ?? {}),
					message,
					intent,
					type: 'showtime',
					cinemaId,
					date,
					showtimePreference,
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
				data: { showtimes, showtimePreference },
			};
		}

		const movies = await this.findMovieRecommendations(genreId, cinemaId);
		const recommendations = movies.map(this.buildMovieCard);

		const messageText = this.buildMovieResponseText(recommendations, genreId, cinemaId, date);

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

	private shouldRejectRequest(message: string): boolean {
		const normalized = message.toLowerCase();
		const suspiciousPatterns = [
			/hack/i,
			/bypass/i,
			/evadir/i,
			/robar/i,
			/virus/i,
			/malware/i,
			/dump/i,
			/credential/i,
			/contraseña|password/i,
			/ddl|sql injection|injection/i,
			/automatizar|scrap|scrape/i,
			/privilegio|root/i,
		];
		const isOffTopic = !this.isRelevantDomainRequest(normalized);
		return suspiciousPatterns.some((pattern) => pattern.test(normalized)) || isOffTopic;
	}

	private isRelevantDomainRequest(normalized: string): boolean {
		return Boolean(
			POLICY_KEYWORDS.test(normalized) ||
			PURCHASE_KEYWORDS.test(normalized) ||
			CONCESSION_KEYWORDS.test(normalized) ||
			PRICING_KEYWORDS.test(normalized) ||
			UPCOMING_KEYWORDS.test(normalized) ||
			SHOWTIME_KEYWORDS.test(normalized) ||
			this.detectGenre(normalized) ||
			/\b(hoy|mañana|manana|noche|tarde|película|pelicula|cine|funcion|funciones|sala|horario|cartelera|entrada|asiento|compra|comprar|boleto|ticket|precio|promoción|promocion|estreno|reembolso|snack|combo|bebida|concesión|concesion)\b/.test(
				normalized,
			),
		);
	}

	private detectIntent(message: string): AssistantIntent {
		const normalized = message.toLowerCase();
		if (POLICY_KEYWORDS.test(normalized)) return 'policy_and_rules';
		if (PURCHASE_KEYWORDS.test(normalized)) return 'purchase_support';
		if (CONCESSION_KEYWORDS.test(normalized)) return 'concession_menu';
		if (PRICING_KEYWORDS.test(normalized)) return 'pricing_promos';
		if (UPCOMING_KEYWORDS.test(normalized)) return 'search_movies';
		if (SHOWTIME_KEYWORDS.test(normalized)) return 'get_showtimes';
		if (this.detectGenre(message)) return 'search_movies';
		if (/\b(hoy|mañana|manana|noche|tarde)\b/.test(normalized)) return 'get_showtimes';
		return 'recommendation';
	}

	private resolveDate(date: string | undefined, message: string): string | undefined {
		if (date && this.isValidDateString(date)) return date;

		const normalized = message.toLowerCase();
		const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' }));

		if (/\bhoy\b/.test(normalized)) return this.formatDate(today);
		if (/\b(mañana|manana)\b/.test(normalized))
			return this.formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
		if (/\b(este fin de semana|fin de semana)\b/.test(normalized)) return this.formatDate(today);

		return undefined;
	}

	private resolveShowtimePreference(message: string): {
		kind?: 'first' | 'last';
		timeWindow?: 'afternoon' | 'evening' | 'morning';
	} {
		const normalized = message.toLowerCase().replace(/[¿?¡!.,:;]/g, ' ');
		const tokens = normalized.split(/\s+/).filter(Boolean);

		if (tokens.includes('primera') || tokens.includes('first')) return { kind: 'first' };
		if (tokens.includes('última') || tokens.includes('ultima') || tokens.includes('last')) return { kind: 'last' };
		if (tokens.includes('tarde') || tokens.includes('afternoon') || tokens.includes('late'))
			return { timeWindow: 'afternoon' };
		if (tokens.includes('noche') || tokens.includes('evening') || tokens.includes('night'))
			return { timeWindow: 'evening' };
		if (tokens.includes('mañana') || tokens.includes('manana') || tokens.includes('morning'))
			return { timeWindow: 'morning' };
		return {};
	}

	private detectGenre(message: string): number | undefined {
		const normalized = message.toLowerCase();
		for (const [keyword, genreId] of Object.entries(GENRE_KEYWORDS)) {
			if (normalized.includes(keyword)) return genreId;
		}
		return undefined;
	}

	private async findMovieRecommendations(genreId?: number, cinemaId?: number): Promise<any[]> {
		try {
			if (genreId) {
				const result = await MoviesService.getByGenres([genreId], {
					pagination: { offset: 0, limit: 10 },
					order: [],
					qc: {},
					raw: {},
				});
				return result.rows;
			}

			const result = cinemaId
				? await MoviesService.getActiveWithShowtimes()
				: await MoviesService.getActiveWithShowtimes();
			return result.rows.slice(0, 10);
		} catch (error) {
			throw this.wrapAssistantError(error, 'movie recommendations');
		}
	}

	private async findShowtimeRecommendations(
		cinemaId?: number,
		date?: string,
		preference?: { kind?: 'first' | 'last'; timeWindow?: 'afternoon' | 'evening' | 'morning' },
	): Promise<any[]> {
		try {
			const result = await ShowtimesService.getFullActiveBillboardFiltered(
				cinemaId !== undefined ? { cinemaId, date } : date ? { date } : undefined,
			);
			const rows = Array.isArray(result.rows) ? result.rows : [];

			return rows
				.map((entry: any) => ({
					...entry,
					showtimes: this.filterShowtimesByPreference(
						Array.isArray(entry.showtimes)
							? entry.showtimes.filter((showtime: any) => this.isShowtimeOnDate(showtime, date))
							: [],
						preference,
					),
				}))
				.filter((entry: any) => entry.showtimes.length > 0)
				.slice(0, 10);
		} catch (error) {
			throw this.wrapAssistantError(error, 'showtime recommendations');
		}
	}

	private filterShowtimesByPreference(
		showtimes: any[],
		preference?: { kind?: 'first' | 'last'; timeWindow?: 'afternoon' | 'evening' | 'morning' },
	): any[] {
		if (!Array.isArray(showtimes) || showtimes.length === 0) return [];
		if (!preference || (!preference.kind && !preference.timeWindow)) return showtimes;

		const sortedShowtimes = [...showtimes].sort((a, b) => {
			const aTime = new Date(a?.booking?.start_time ?? a?.start_time ?? 0).getTime();
			const bTime = new Date(b?.booking?.start_time ?? b?.start_time ?? 0).getTime();
			return aTime - bTime;
		});

		if (preference.kind === 'first') return sortedShowtimes.slice(0, 1);
		if (preference.kind === 'last') return sortedShowtimes.slice(-1);

		const window = preference.timeWindow;
		const filtered = sortedShowtimes.filter((showtime) => this.matchesTimeWindow(showtime, window));
		return filtered.length > 0 ? filtered : sortedShowtimes;
	}

	private matchesTimeWindow(showtime: any, timeWindow?: 'afternoon' | 'evening' | 'morning'): boolean {
		if (!timeWindow) return true;
		const startTime = new Date(showtime?.booking?.start_time ?? showtime?.start_time ?? 0);
		if (Number.isNaN(startTime.getTime())) return false;

		const hour = startTime.getHours();
		if (timeWindow === 'morning') return hour >= 5 && hour < 12;
		if (timeWindow === 'afternoon') return hour >= 12 && hour < 19;
		if (timeWindow === 'evening') return hour >= 18;
		return false;
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
		const languages = this.extractLabelList(movie.languages ?? movie._Languages ?? movie.language ?? []);
		const projectionTypes = this.extractLabelList(
			movie.projection_types ?? movie.projectionTypes ?? movie._ProjectionTypes ?? [],
		);
		const nextShowtime = this.extractNextShowtime(
			Array.isArray(movie.showtimes) ? movie.showtimes : Array.isArray(movie._Showtimes) ? movie._Showtimes : [],
		);
		const subtitleParts = [
			genres.length ? genres.join(', ') : (movie.synopsis ?? ''),
			movie.duration_minutes ? `${movie.duration_minutes} min` : '',
			movie.age_classification ? `Clasificación ${movie.age_classification}` : '',
		].filter(Boolean);

		return {
			id: movie.id,
			title: movie.title,
			subtitle: subtitleParts.join(' · '),
			type: 'movie',
			posterUrl: movie.poster_url ?? null,
			nextShowtime,
			metadata: {
				lifecycle_state: movie.lifecycle_state,
				duration_minutes: movie.duration_minutes,
				age_classification: movie.age_classification ?? null,
				languages,
				projection_types: projectionTypes,
				release_date: movie.release_date ?? null,
				next_showtime: nextShowtime,
			},
		};
	}

	private buildShowtimeCard(entry: any): AssistantRecommendation {
		const movie = entry.movie ?? entry.event;
		const firstShowtime = Array.isArray(entry.showtimes) ? entry.showtimes[0] : undefined;
		const startTime = firstShowtime?.booking?.start_time ?? firstShowtime?.start_time ?? null;
		const roomName = firstShowtime?._Rooms?.name ?? firstShowtime?.room?.name ?? null;
		const cinemaName =
			firstShowtime?._Rooms?._Cinemas?.name ??
			firstShowtime?._Rooms?.cinema?.name ??
			firstShowtime?.cinema?.name ??
			null;
		const subtitle = startTime
			? `Próxima función: ${this.formatShowtime(startTime)}${roomName ? ` · Sala ${roomName}` : ''}${cinemaName ? ` · ${cinemaName}` : ''}`
			: 'Función disponible';

		return {
			id: movie?.id ?? null,
			title: movie?.title ?? 'Función disponible',
			subtitle,
			type: 'showtime',
			posterUrl: movie?.poster_url ?? null,
			nextShowtime: startTime,
			metadata: {
				cinema: cinemaName,
				room: roomName,
				showtime_id: firstShowtime?.id ?? null,
				movie_id: movie?.id ?? null,
			},
		};
	}

	private buildMovieResponseText(
		recommendations: AssistantRecommendation[],
		genreId?: number,
		cinemaId?: number,
		date?: string,
	): string {
		if (!recommendations.length) {
			return 'No pude encontrar recomendaciones en este momento. Intenta con otro género o fecha.';
		}

		const intro = genreId
			? 'Estas son algunas películas recomendadas según tu preferencia:'
			: 'Te comparto películas con funciones reales en cartelera ahora mismo:';
		const suffix = cinemaId ? ` en la sucursal ${cinemaId}` : '';
		const dateSuffix = date ? ` para ${date}` : '';
		const lines = recommendations
			.slice(0, 3)
			.map((item) => {
				const metadata = (item.metadata ?? {}) as Record<string, unknown>;
				const nextShowtime = metadata.next_showtime
					? ` · ${this.formatShowtime(String(metadata.next_showtime))}`
					: '';
				return `• ${item.title}${nextShowtime}`;
			})
			.join('\n');

		return `${intro}\n${lines}\n\nPuedes ver más detalles de cada opción${suffix}${dateSuffix}.`;
	}

	private buildShowtimeResponseText(
		recommendations: AssistantRecommendation[],
		cinemaId?: number,
		date?: string,
		preference?: { kind?: 'first' | 'last'; timeWindow?: 'afternoon' | 'evening' | 'morning' },
	): string {
		if (!recommendations.length) {
			return 'No encontré funciones disponibles con esos parámetros. Prueba con otra sucursal o fecha.';
		}

		const intro =
			preference?.kind === 'first'
				? 'Estas son las primeras funciones que encontré'
				: preference?.kind === 'last'
					? 'Estas son las últimas funciones que encontré'
					: preference?.timeWindow === 'afternoon'
						? 'Estas son las funciones de la tarde'
						: preference?.timeWindow === 'evening'
							? 'Estas son las funciones de la noche'
							: preference?.timeWindow === 'morning'
								? 'Estas son las funciones de la mañana'
								: 'Aquí tienes las funciones disponibles';
		const lines = recommendations
			.slice(0, 3)
			.map((item) => `• ${item.title} — ${item.subtitle}`)
			.join('\n');
		const suffix = cinemaId ? ` en la sucursal ${cinemaId}` : '';
		const dateSuffix = date ? ` para ${date}` : '';

		return `${intro}${suffix}${dateSuffix}:\n${lines}`;
	}

	private extractLabelList(values: unknown): string[] {
		if (!Array.isArray(values)) return [];
		return values
			.map((value: any) => {
				if (typeof value === 'string') return value;
				if (value?.description) return String(value.description);
				if (value?._Language?.description) return String(value._Language.description);
				if (value?._ProjectionType?.description) return String(value._ProjectionType.description);
				if (value?._Genre?.description) return String(value._Genre.description);
				return '';
			})
			.filter(Boolean);
	}

	private extractNextShowtime(showtimes: unknown[]): string | null {
		if (!Array.isArray(showtimes) || showtimes.length === 0) return null;
		const firstShowtime = showtimes[0] as any;
		const startTime = firstShowtime?.booking?.start_time ?? firstShowtime?.start_time ?? null;
		return startTime ? String(startTime) : null;
	}

	private formatShowtime(value: string | Date | null | undefined): string {
		if (!value) return '';
		const date = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(date.getTime())) return String(value);
		return date.toLocaleString('es-VE', {
			timeZone: 'America/Caracas',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	private buildFollowUpQuestions(intent: AssistantIntent): string[] {
		if (intent === 'get_showtimes' || intent === 'showtimes') {
			return ['¿Deseas ver horarios en otra sucursal?', '¿Te gustaría filtrar por idioma o formato?'];
		}

		if (intent === 'policy_and_rules') {
			return ['¿Quieres conocer otra política del cine?', '¿Necesitas orientación sobre compra o reembolso?'];
		}

		if (intent === 'purchase_support') {
			return [
				'¿Quieres revisar el estado de tu pedido?',
				'¿Prefieres ayuda para un reembolso o cambio de fecha?',
			];
		}

		if (intent === 'concession_menu') {
			return [
				'¿Quieres ver combos especiales o coleccionables?',
				'¿Te ayudo con opciones sin gluten o vegetarianas?',
			];
		}

		if (intent === 'pricing_promos') {
			return ['¿Quieres conocer promociones activas hoy?', '¿Prefieres comparar precios por formato o sucursal?'];
		}

		return ['¿Prefieres una película de acción, comedia o terror?', '¿Te interesa que sea subtitulada o doblada?'];
	}

	private buildPolicyResponse(message: string) {
		const normalized = message.toLowerCase();
		if (normalized.includes('comida externa')) {
			return {
				message:
					'No se permite ingresar comida externa en la sala. En el cine puedes adquirir snacks y bebidas dentro de la concesión.',
				relatedPolicies: ['Ingreso de comida externa', 'Compra de snacks dentro del cine'],
			};
		}

		if (normalized.includes('reembolso') || normalized.includes('reembols')) {
			return {
				message:
					'Los reembolsos dependen de la política vigente y del tiempo de anticipación. Puedes revisar el estado de tu compra en la app o contactar a atención al cliente.',
				relatedPolicies: ['Reembolsos', 'Cambios de fecha o asistencia'],
			};
		}

		return {
			message:
				'Para reglas del cine, puedes consultar la política general de ingreso, uso de la sala y condiciones de compra en la app o en taquilla.',
			relatedPolicies: ['Normas de ingreso', 'Políticas de compra y asistencia'],
		};
	}

	private async buildPurchaseSupportResponse(message: string, session?: any) {
		const normalized = message.toLowerCase();
		let supportTips = ['Revisa el estado del pedido', 'Contacta a soporte si no aparece la compra'];

		try {
			if (session?.userId) {
				const orders = await UsersService.getMyOrders?.(session, { limit: 3, page: 1 });
				const recentOrders = Array.isArray(orders?.rows) ? orders.rows : Array.isArray(orders) ? orders : [];
				if (recentOrders.length > 0) {
					supportTips = [
						`Tienes ${recentOrders.length} compra(s) recientes registradas`,
						'Revisa el estado de la más reciente en la app',
					];
				}
			}
		} catch {
			// fallback silencioso si el usuario no tiene perfil o la consulta falla
		}

		if (normalized.includes('qr') || normalized.includes('codigo')) {
			return {
				message:
					'Si no recibiste el código QR, revisa tu correo de confirmación o la sección de compras de la app. Si sigue sin aparecer, podemos ayudarte a verificar el estado del pedido.',
				supportTips: [...supportTips, 'Revisa spam y promociones'],
			};
		}

		if (normalized.includes('pago') || normalized.includes('error')) {
			return {
				message:
					'Si tu pago falló o marcó error, verifica el estado del cobro en tu banco o método de pago y luego confirma en la app si el pedido quedó registrado.',
				supportTips: [...supportTips, 'Verifica el estado del pago'],
			};
		}

		return {
			message:
				'Para ayudarte con tu compra, revisa el estado del pedido en la app o contacta a soporte si el boleto no llegó o el pago no se registró.',
			supportTips,
		};
	}

	private async buildConcessionResponse(cinemaId?: number, session?: any) {
		try {
			const products = await ConcessionsService.findAllProducts({ limit: 5 } as any, session?.userId);
			const items = Array.isArray(products) ? products : products?.rows || [];
			const recommendations = items.slice(0, 5).map((item: any) => ({
				id: item.id,
				title: item.name,
				subtitle: item.description ?? 'Producto de concesión',
				type: 'special_event' as const,
				posterUrl: item.image_url ?? null,
				nextShowtime: null,
				metadata: {
					price: item.pricing?.final_price ?? item.price ?? null,
					currency: item.pricing?.currency_description ?? null,
					cinemaId,
				},
			}));

			return {
				message: recommendations.length
					? 'Aquí tienes algunas opciones de la concesión disponibles para hoy.'
					: 'No pude encontrar productos de concesión disponibles en este momento.',
				recommendations,
			};
		} catch {
			return {
				message: 'No pude recuperar la información de la concesión en este momento.',
				recommendations: [],
			};
		}
	}

	private async buildPricingResponse(cinemaId?: number, session?: any) {
		try {
			const paymentOptions = await PaymentsService.getPaymentOptions();
			const recommendations = Array.isArray(paymentOptions)
				? paymentOptions.slice(0, 4).map((item: any) => ({
						id: item.id,
						title: item.description,
						subtitle: item.requires_reference ? 'Requiere referencia' : 'Sin referencia',
						type: 'special_event' as const,
						posterUrl: null,
						nextShowtime: null,
						metadata: { cinemaId, paymentMethod: item.description },
					}))
				: [];

			return {
				message:
					'Estas son algunas opciones de pago y métodos disponibles que puedes usar para completar tu compra.',
				recommendations,
			};
		} catch {
			return {
				message: 'No pude recuperar las opciones de pago disponibles en este momento.',
				recommendations: [],
			};
		}
	}

	private isValidDateString(value: string): boolean {
		return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
	}

	private formatDate(date: Date): string {
		const caracasDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
		const year = caracasDate.getFullYear();
		const month = String(caracasDate.getMonth() + 1).padStart(2, '0');
		const day = String(caracasDate.getDate()).padStart(2, '0');
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
		if (!audioBuffer || !mimeType) {
			throw new ValidationError('Se requiere un archivo de audio válido para procesar la solicitud.', ['audio']);
		}

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
		} catch (error) {
			throw this.wrapAssistantError(error, 'resolve recommendations');
		}
	}

	private async generateAssistantAudio(
		prompt: string,
		audioBuffer: Buffer,
		mimeType: string,
		context?: Record<string, unknown>,
	): Promise<string> {
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
		} catch (error) {
			throw this.wrapAssistantError(error, 'audio generation');
		}
	}

	private async generateAssistantText(
		userMessage: string,
		intent: AssistantIntent,
		recommendations: AssistantRecommendation[],
		type: 'movie' | 'showtime',
		context?: Record<string, unknown>,
	): Promise<string> {
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
		} catch (error) {
			throw this.wrapAssistantError(error, 'text generation');
		}
	}

	private wrapAssistantError(error: unknown, context: string): AppError {
		if (error instanceof AppError) return error;

		if (error instanceof Error) {
			const message = error.message || 'Error inesperado en el asistente';
			const normalizedMessage = message.toLowerCase();

			if (
				normalizedMessage.includes('database') ||
				normalizedMessage.includes('repository') ||
				normalizedMessage.includes('sequelize')
			) {
				return new DatabaseError(`No se pudieron obtener los datos para ${context}.`, context, {
					details: { source: 'assistant.service' },
					cause: error,
				});
			}

			return new UnknownError(error, {
				source: 'assistant.service',
				context,
			});
		}

		return new UnknownError(new Error(`Error inesperado en ${context}`), {
			source: 'assistant.service',
			context,
		});
	}
}

export default new AssistantService();
