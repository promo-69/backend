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

const { default: specialEventsLifecycleCron } =
	await import('../../src/background/crons/special-events-lifecycle.cron.js');

describe('special-events lifecycle cron', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		addMock.mockResolvedValue({ id: 'job-1' });
	});

	it('registra el cron de ciclo de vida de eventos especiales en la cola', async () => {
		await specialEventsLifecycleCron();

		expect(getInstanceMock).toHaveBeenCalledTimes(1);
		expect(addMock).toHaveBeenCalledWith(
			'special-events-lifecycle-queue',
			'sync-special-events-lifecycle',
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

	it('registra el error cuando no se puede encolar el trabajo del cron', async () => {
		addMock.mockRejectedValueOnce(new Error('queue unavailable'));

		await specialEventsLifecycleCron();

		expect(errorMock).toHaveBeenCalledWith(
			'Error al registrar el cron de ciclo de vida de eventos especiales:',
			expect.any(Error),
		);
	});
});
