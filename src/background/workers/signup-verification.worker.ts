import { WorkerHandler } from '../handlers/worker.handler.js';
import { Job } from 'bullmq';
import { Database } from '@database/index.js';
import { Logger } from '@utils/logger.util.js';
import { Transaction } from 'sequelize';

export default function signupVerificationWorker() {
	return WorkerHandler.create({
		queue: 'signup-verification-queue',
		task: async (job: Job) => {
			const { email, userId, personId } = job.data;
			if (!userId || !personId) {
				Logger.warn(`Trabajo incompleto en signup-verification-queue para job ${job.id}`);
				return;
			}

			const usersRepo = Database.repository('main', 'users') as any;
			const customersRepo = Database.repository('main', 'customers') as any;
			const peopleRepo = Database.repository('main', 'people') as any;
			const employeesRepo = Database.repository('main', 'employees') as any;

			// Consultar usuario por ID
			const user = await usersRepo.getById(userId);

			// Si no existe o si ya fue verificado, termina exitosamente
			if (!user || user.signup_verified_at !== null) return;

			// Si aún es nulo (no verificado), abre una transacción SQL
			await usersRepo.transaction(async (transaction: Transaction) => {
				// Bloqueo pesimista: volver a consultar el usuario con lock para evitar carreras
				const lockedUser = await usersRepo.getOne(
					{ id: userId },
					{ transaction, lock: transaction.LOCK.UPDATE },
				);

				// Si el usuario desapareció o se verificó en este instante, abortar
				if (!lockedUser || lockedUser.signup_verified_at !== null) return;

				await usersRepo.delete({ id: userId }, { transaction, force: true });
				await customersRepo.delete({ person: personId }, { transaction, force: true });

				const otherUsers = await usersRepo.getAll({ count: true }, { person: personId }, { transaction });
				const countUsers = Array.isArray(otherUsers) ? otherUsers.length : otherUsers.count;

				const otherEmployees = await employeesRepo.getAll(
					{ count: true },
					{ person: personId },
					{ transaction },
				);
				const countEmployees = Array.isArray(otherEmployees) ? otherEmployees.length : otherEmployees.count;

				if (countUsers === 0 && countEmployees === 0)
					await peopleRepo.delete({ id: personId }, { transaction, force: true });
			});
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en signup-verification-queue para el trabajo "${job?.id}"`, err);
			},
			completed: (job) => {
				Logger.info(`Tarea de limpieza "${job.id}" para el usuario "${job.data.email}" completada`);
			},
		},
	});
}
