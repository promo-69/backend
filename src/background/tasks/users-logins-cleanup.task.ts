import { Database } from '@database/index.js';
import { Op } from 'sequelize';

/**
 * Tarea encargada de eliminar físicamente de la base de datos
 * todos los registros de inicios de sesión (users_logins) que
 * ya han expirado.
 */
export async function cleanUpExpiredLoginsTask(): Promise<number> {
	const usersLoginsRepo = Database.repository('main', 'users-logins') as any;
	const now = new Date();

	const deletedCount = await usersLoginsRepo.delete(
		{
			expires_at: { [Op.lte]: now },
		},
		{ force: true }
	);

	return deletedCount;
}
