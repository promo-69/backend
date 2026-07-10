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
});
