import { Database } from '@database/index.js';
import { Transaction } from 'sequelize';

/**
 * Tarea encargada de verificar si un usuario no confirmó su registro a tiempo.
 * De ser así, se elimina su registro temporal y la data asociada de persona si
 * no tiene otras vinculaciones (ej. otros roles de empleado).
 */
export async function signupVerificationTask(userId: number, personId: number): Promise<void> {
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
		const lockedUser = await usersRepo.getOne({ id: userId }, { transaction, lock: transaction.LOCK.UPDATE });

		// Si el usuario desapareció o se verificó en este instante, abortar
		if (!lockedUser || lockedUser.signup_verified_at !== null) return;

		await usersRepo.delete({ id: userId }, { transaction, force: true });
		await customersRepo.delete({ person: personId }, { transaction, force: true });

		const countUsers = await usersRepo.count({ person: personId }, { transaction });
		const countEmployees = await employeesRepo.count({ person: personId }, { transaction });

		if (countUsers === 0 && countEmployees === 0)
			await peopleRepo.delete({ id: personId }, { transaction, force: true });
	});
}
