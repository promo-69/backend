import { toCamelCase, snakeToCamel } from './string-formatters.util.js';

/**
 * Verifica si un valor es un objeto literal puro (excluye arrays, null, Date, RegExp, etc.)
 */
const isObject = (obj: any): obj is Record<string, any> => {
	return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date) && !(obj instanceof RegExp);
};

/**
 * Transforma recursivamente todas las claves de un objeto o arreglo de objetos a camelCase.
 *
 * @param input Objeto o arreglo a transformar
 * @returns El mismo tipo de estructura con sus claves en camelCase
 */
export const keysToCamelCase = <T = any>(input: any): T => {
	if (Array.isArray(input)) {
		return input.map(item => keysToCamelCase(item)) as unknown as T;
	}

	if (isObject(input)) {
		const newObj: Record<string, any> = {};
		for (const key of Object.keys(input)) {
			// Usamos snakeToCamel si sabemos que viene de DB en snake_case (más rápido)
			// O podemos usar toCamelCase para un formateo universal
			const camelKey = key.includes('_') ? snakeToCamel(key) : key;
			newObj[camelKey] = keysToCamelCase(input[key]);
		}
		return newObj as T;
	}

	// Si es primitivo, Date, etc., devolver tal cual
	return input;
};

export default keysToCamelCase;
