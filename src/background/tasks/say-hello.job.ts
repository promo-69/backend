import { Logger } from '@utils/logger.util.js';

export default async function sayHello(): Promise<void> {
	Logger.info('Hola! Soy un Task. Puedo realizar una tarea específica');
}
