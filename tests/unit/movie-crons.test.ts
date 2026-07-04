import { jest } from '@jest/globals';

const addMock = jest.fn();
const getInstanceMock = jest.fn(() => ({ add: addMock }));
const infoMock = jest.fn();
const errorMock = jest.fn();

jest.unstable_mockModule('../../src/shared/providers/queue.provider.js', () => ({
	QueueProvider: {
		getInstance: getInstanceMock,
	},
}));

jest.unstable_mockModule('@utils/logger.util.js', () => ({
	Logger: {
		info: infoMock,
		error: errorMock,
	},
}));

jest.unstable_mockModule('@config/app.config.js', () => ({
	AppConfig: {
		load: () => ({
			movieLifecycle: {
				syncCron: '*/10 * * * *',
				timezone: 'America/Caracas',
			},
		}),
		isProduction: () => false,
	},
}));

const { default: movieLifecycleCron } = await import('../../src/background/crons/movie-lifecycle.cron.js');
const { default: movieRemindersCron } = await import('../../src/background/crons/movie-reminders.cron.js');

describe('background crons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		addMock.mockResolvedValue({ id: 'job-1' });
	});

	it('registra el cron de ciclo de vida de películas en la cola', async () => {
		await movieLifecycleCron();

		expect(getInstanceMock).toHaveBeenCalledTimes(1);
		expect(addMock).toHaveBeenCalledWith(
			'movie-lifecycle-queue',
			'sync-movie-lifecycle',
			{},
			expect.objectContaining({
				repeat: expect.objectContaining({
					pattern: '*/10 * * * *',
					tz: 'America/Caracas',
				}),
				removeOnComplete: true,
				removeOnFail: true,
			}),
		);
		expect(infoMock).toHaveBeenCalledWith(expect.stringContaining('Registrado'));
	});

	it('registra el cron de recordatorios con el horario diario esperado', async () => {
		await movieRemindersCron();

		expect(addMock).toHaveBeenCalledWith(
			'movie-reminders-queue',
			'check-movie-reminders',
			{},
			expect.objectContaining({
				repeat: expect.objectContaining({
					pattern: '0 9 * * *',
					tz: 'America/Caracas',
				}),
				removeOnComplete: true,
				removeOnFail: true,
			}),
		);
	});

	it('registra el error cuando no se puede encolar el trabajo del cron', async () => {
		addMock.mockRejectedValueOnce(new Error('queue unavailable'));

		await movieLifecycleCron();

		expect(errorMock).toHaveBeenCalledWith(
			'Error al registrar el cron de ciclo de vida de películas:',
			expect.any(Error),
		);
	});
});
