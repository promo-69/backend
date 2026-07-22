import { jest } from '@jest/globals';
import AssistantService from '../../src/modules/assistant/_.service.js';
import { LLMProvider } from '../../src/shared/providers/llm.provider.js';

describe('AssistantService LLM context injection', () => {
	it('envía contexto enriquecido al proveedor LLM', async () => {
		const createChatCompletion = jest.fn().mockResolvedValue('Respuesta mock');
		jest.spyOn(LLMProvider, 'getInstance').mockReturnValue({
			createChatCompletion,
		} as unknown as LLMProvider);

		await (AssistantService as any).generateAssistantText(
			'Quiero una película de terror',
			'recommendation',
			[{ title: 'The Conjuring', subtitle: 'Terror', type: 'movie' }],
			'movie',
			{
				isAuthenticated: true,
				user: {
					userId: 99,
					firstName: 'Ana',
					email: 'ana@cineflix.com',
					roleCode: 'CUSTOMER',
				},
				cinemaId: 7,
			},
		);

		expect(createChatCompletion).toHaveBeenCalledWith(
			expect.any(Array),
			expect.objectContaining({
				systemInstruction: expect.stringContaining('Cineflix'),
				context: expect.objectContaining({
					user: expect.objectContaining({ userId: 99 }),
				}),
			}),
		);
	});

	it('envía audio al proveedor LLM cuando llega un archivo de voz', async () => {
		const createAudioCompletion = jest.fn().mockResolvedValue('Respuesta de audio');
		jest.spyOn(LLMProvider, 'getInstance').mockReturnValue({
			createAudioCompletion,
		} as unknown as LLMProvider);

		jest.spyOn(AssistantService as any, 'findShowtimeRecommendations').mockResolvedValue([]);
		jest.spyOn(AssistantService as any, 'findMovieRecommendations').mockResolvedValue([]);

		const audioBuffer = Buffer.from('audio-bytes');
		await (AssistantService as any).processAudioMessage(
			{ message: '¿Qué funciones hay hoy?' },
			{ userId: 42, firstName: 'Luis', roleCode: 'CUSTOMER' },
			{ path: '/assistant/audio', method: 'POST' },
			audioBuffer,
			'audio/mpeg',
		);

		expect(createAudioCompletion).toHaveBeenCalledWith(
			audioBuffer,
			'audio/mpeg',
			expect.stringContaining('¿Qué funciones hay hoy?'),
			expect.objectContaining({
				context: expect.objectContaining({
					user: expect.objectContaining({ userId: 42 }),
				}),
			}),
		);
	});

	it('detecta preguntas de política y soporte de compra con intenciones específicas', () => {
		expect((AssistantService as any).detectIntent('¿Puedo llevar comida externa al cine?')).toBe(
			'policy_and_rules',
		);
		expect((AssistantService as any).detectIntent('No me llegó el código QR de mi compra')).toBe(
			'purchase_support',
		);
	});

	it('responde preguntas de política sin depender del LLM', async () => {
		const createChatCompletion = jest.fn().mockResolvedValue('Respuesta mock');
		jest.spyOn(LLMProvider, 'getInstance').mockReturnValue({
			createChatCompletion,
		} as unknown as LLMProvider);

		const response = await AssistantService.processChatMessage(
			{ message: '¿Puedo ingresar comida externa al cine?' },
			{ userId: 7, firstName: 'Ana', roleCode: 'CUSTOMER' },
			{ path: '/assistant/chat', method: 'POST' },
		);

		expect(response.intent).toBe('policy_and_rules');
		expect(response.suggestedAction).toBe('policy_help');
		expect(response.message).toContain('comida externa');
		expect(createChatCompletion).not.toHaveBeenCalled();
	});

	it('enriquece recomendaciones de películas con metadatos reales', () => {
		const movie = {
			title: 'La noche del misterio',
			synopsis: 'Un misterio en el cine',
			poster_url: 'https://img.test/poster.jpg',
			lifecycle_state: 3,
			duration_minutes: 95,
			age_classification: 3,
			languages: [{ _Language: { description: 'Español' } }],
			projection_types: [{ _ProjectionType: { description: 'IMAX' } }],
			showtimes: [{ booking: { start_time: '2026-07-21T20:00:00-04:00' } }],
		};

		const recommendation = (AssistantService as any).buildMovieCard(movie);
		expect(recommendation.title).toBe('La noche del misterio');
		expect(recommendation.metadata).toEqual(
			expect.objectContaining({
				age_classification: 3,
				languages: ['Español'],
				projection_types: ['IMAX'],
			}),
		);
	});

	it('reconoce cuando el usuario consulta próximos estrenos', () => {
		expect((AssistantService as any).detectIntent('¿Qué próximos estrenos llegan este mes?')).toBe('search_movies');
	});

	it('rechaza solicitudes off-topic o maliciosas sin responder con contenido irrelevante', async () => {
		const createChatCompletion = jest.fn().mockResolvedValue('Respuesta mock');
		jest.spyOn(LLMProvider, 'getInstance').mockReturnValue({
			createChatCompletion,
		} as unknown as LLMProvider);

		const maliciousResponse = await AssistantService.processChatMessage(
			{ message: 'Cómo hackear el sistema de pagos del cine' },
			{ userId: 7, firstName: 'Ana', roleCode: 'CUSTOMER' },
			{ path: '/assistant/chat', method: 'POST' },
		);
		const offTopicResponse = await AssistantService.processChatMessage(
			{ message: '¿Cuál es la capital de Francia?' },
			{ userId: 7, firstName: 'Ana', roleCode: 'CUSTOMER' },
			{ path: '/assistant/chat', method: 'POST' },
		);
		const casualChatResponse = await AssistantService.processChatMessage(
			{ message: 'Hola, ¿cómo estás?' },
			{ userId: 7, firstName: 'Ana', roleCode: 'CUSTOMER' },
			{ path: '/assistant/chat', method: 'POST' },
		);

		expect(maliciousResponse.intent).toBe('unsupported_request');
		expect(maliciousResponse.suggestedAction).toBe('safety_refusal');
		expect(maliciousResponse.message).toContain('Puedo ayudarte');
		expect(offTopicResponse.intent).toBe('unsupported_request');
		expect(offTopicResponse.suggestedAction).toBe('safety_refusal');
		expect(casualChatResponse.intent).toBe('unsupported_request');
		expect(casualChatResponse.suggestedAction).toBe('safety_refusal');
		expect(createChatCompletion).not.toHaveBeenCalled();
	});

	it('identifica preferencias de primera o última función y momento del día', () => {
		const firstPreference = (AssistantService as any).resolveShowtimePreference('¿Cuál es la primera función hoy?');
		const lastPreference = (AssistantService as any).resolveShowtimePreference(
			'¿Cuál es la última función de la noche?',
		);
		const afternoonPreference = (AssistantService as any).resolveShowtimePreference(
			'¿Hay funciones mañana en la tarde?',
		);

		expect(firstPreference).toEqual(expect.objectContaining({ kind: 'first' }));
		expect(lastPreference).toEqual(expect.objectContaining({ kind: 'last' }));
		expect(afternoonPreference).toEqual(expect.objectContaining({ timeWindow: 'afternoon' }));
	});
});
