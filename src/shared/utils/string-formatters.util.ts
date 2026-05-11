export type StringCase =
	| 'camel' // camelCase
	| 'pascal' // PascalCase
	| 'snake' // snake_case
	| 'kebab'
	| 'kebab-case'
	| 'dash-case'
	| 'slug-case'
	| 'constant' // CONSTANT_CASE
	| 'lower' // lowercase
	| 'upper' // UPPERCASE
	| 'capitalize' // Capitalize Each Word
	| 'dot' // dot.case
	| 'path' // path/case
	| 'trim' // trim whitespace
	| 'no-space' // remove all spaces
	| 'no-special' // remove special chars
	| 'slug'; // URL-friendly slug

/**
 * Función central para extraer palabras de cualquier string (Tokenizador Universal)
 * Ej: "user_Types-Model" -> ["user", "types", "model"]
 */
const extractWords = (str: string): string[] => {
	return str
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2') // Separa camel/pascal (ej. UserType -> User Type)
		.replace(/[^a-zA-Z0-9]+/g, ' ') // Reemplaza cualquier separador (-, _, ., /) por espacio
		.trim()
		.split(/\s+/)
		.map((word) => word.toLowerCase());
};

export const toCamelCase = (str: string): string => {
	if (!str) return '';
	const words = extractWords(str);
	return words.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join('');
};

export const toPascalCase = (str: string): string => {
	if (!str) return '';
	const words = extractWords(str);
	return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
};

export const toSnakeCase = (str: string): string => {
	if (!str) return '';
	return extractWords(str).join('_');
};

export const toKebabCase = (str: string): string => {
	if (!str) return '';
	return extractWords(str).join('-');
};

export const toConstantCase = (str: string): string => {
	if (!str) return '';
	return extractWords(str).join('_').toUpperCase();
};

export const toCapitalize = (str: string): string => {
	if (!str) return '';
	const words = extractWords(str);
	return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const toSwapCase = (str: string): string => {
	if (!str) return '';
	return str
		.split('')
		.map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
		.join('');
};

export const toDotCase = (str: string): string => {
	if (!str) return '';
	return extractWords(str).join('.');
};

export const toPathCase = (str: string): string => {
	if (!str) return '';
	return extractWords(str).join('/');
};

export const capitalizeFirstLetter = (str: string): string => {
	if (!str) return '';
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Se corrige el bug del guion bajo inicial en PascalCase
export const camelToSnake = (str: string): string => {
	if (!str) return '';
	return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
};

export const snakeToCamel = (str: string): string => {
	if (!str) return '';
	return str.toLowerCase().replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
};

export const slugify = (str: string): string => {
	if (!str) return '';
	return str
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
};

export const removeSpaces = (str: string): string => {
	if (!str) return '';
	return str.replace(/\s+/g, '');
};

export const removeSpecialChars = (str: string): string => {
	if (!str) return '';
	return str.replace(/[^a-zA-Z0-9\s]/g, '');
};

export const toSlug = slugify; // Alias para compatibilidad

/**
 * Convierte un string a diferentes formatos/casos
 */
export const formatString = (str: string | null | undefined, format: StringCase = 'camel'): string | undefined => {
	if (str == null || str === '') return undefined;

	switch (format) {
		case 'camel':
			return toCamelCase(str);
		case 'pascal':
			return toPascalCase(str);
		case 'snake':
			return toSnakeCase(str);
		case 'kebab':
		case 'kebab-case':
		case 'dash-case':
		case 'slug-case':
			return toKebabCase(str);
		case 'constant':
			return toConstantCase(str);
		case 'lower':
			return str.toLowerCase();
		case 'upper':
			return str.toUpperCase();
		case 'capitalize':
			return toCapitalize(str);
		case 'dot':
			return toDotCase(str);
		case 'path':
			return toPathCase(str);
		case 'trim':
			return str.trim();
		case 'no-space':
			return removeSpaces(str);
		case 'no-special':
			return removeSpecialChars(str);
		case 'slug':
			return slugify(str);
		default:
			return str;
	}
};

/**
 * Convierte entre diferentes casos manteniendo la firma original
 */
export const convertCase = (str: string, from: StringCase | 'auto' = 'auto', to: StringCase): string => {
	return formatString(str, to) || '';
};

/**
 * Formatea un string según un patrón (ej. teléfonos, cédulas)
 */
export const formatPattern = (str: string, pattern: string = '***-***-****'): string => {
	if (!str) return '';
	const cleanStr = str.replace(/\D/g, '');
	let result = '';
	let strIndex = 0;

	for (let i = 0; i < pattern.length; i++) {
		if (strIndex >= cleanStr.length) break;
		if (pattern[i] === '*') {
			result += cleanStr[strIndex];
			strIndex++;
		} else {
			result += pattern[i];
		}
	}
	return result;
};

export const abbreviate = (str: string, maxLength: number = 50, suffix: string = '...'): string => {
	if (!str) return '';
	if (str.length <= maxLength) return str;
	return str.substring(0, Math.max(0, maxLength - suffix.length)) + suffix;
};

/**
 * Formatea números aprovechando Intl.NumberFormat para mayor seguridad nativa
 */
export const formatNumber = (
	num: number | string,
	decimals: number = 0,
	decimalSeparator: string = '.',
	thousandSeparator: string = ',',
): string => {
	const number = typeof num === 'string' ? parseFloat(num) : num;
	if (isNaN(number)) return '0';

	// Convertimos a string y separamos la parte entera de los decimales
	const parts = number.toFixed(decimals).split('.');

	// Aplicamos el Regex ÚNICAMENTE a la parte entera (índice 0 del arreglo)
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

	// Si hay parte decimal y se solicitaron decimales, unimos con el separador deseado
	if (parts.length > 1 && decimals > 0) return parts.join(decimalSeparator);

	// Si no, retornamos solo la parte entera
	return parts[0];
};

export default formatString;
