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
    | 'slug'; // URL-friendly slug;

/**
 * Convierte un string a diferentes formatos/casos
 */
export const formatString = (str: string | null | undefined, format: StringCase = 'camel'): string | undefined => {
    if (str == null || str === '') return undefined;

    const cleanStr = str.toString().trim();

    switch (format) {
        case 'camel':
            return toCamelCase(cleanStr);

        case 'pascal':
            return toPascalCase(cleanStr);

        case 'snake':
            return toSnakeCase(cleanStr);

        case 'kebab':
            return toKebabCase(cleanStr);

        case 'constant':
            return toConstantCase(cleanStr);

        case 'lower':
            return cleanStr.toLowerCase();

        case 'upper':
            return cleanStr.toUpperCase();

        case 'capitalize':
            return toCapitalize(cleanStr);

        case 'dot':
            return toDotCase(cleanStr);

        case 'path':
            return toPathCase(cleanStr);

        case 'trim':
            return cleanStr.trim();

        case 'no-space':
            return removeSpaces(cleanStr);

        case 'no-special':
            return removeSpecialChars(cleanStr);

        case 'slug':
            return toSlug(cleanStr);

        default:
            return cleanStr;
    }
};

// Función específica que mencionaste
export const toCamelCase = (str: string): string => {
    if (!str) return '';

    return str
        .toLowerCase()
        .replace(/[-_\s](.)/g, (_, group1) => group1.toUpperCase())
        .replace(/^(.)/, (_, group1) => group1.toLowerCase());
};

export const toPascalCase = (str: string): string => {
    if (!str) return '';

    return str
        .toLowerCase()
        .replace(/[-_\s](.)/g, (_, group1) => group1.toUpperCase())
        .replace(/^(.)/, (_, group1) => group1.toUpperCase());
};

export const toSnakeCase = (str: string): string => {
    if (!str) return '';

    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-\s]/g, '_')
        .toLowerCase();
};

export const toKebabCase = (str: string): string => {
    if (!str) return '';

    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[_\s]/g, '-')
        .toLowerCase();
};

export const toConstantCase = (str: string): string => {
    if (!str) return '';

    return toSnakeCase(str).toUpperCase();
};

export const toCapitalize = (str: string): string => {
    if (!str) return '';

    return str
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const toSwapCase = (str: string): string => {
    if (!str) return '';

    return str
        .split('')
        .map((char) => {
            if (char === char.toUpperCase()) {
                return char.toLowerCase();
            } else {
                return char.toUpperCase();
            }
        })
        .join('');
};

export const toDotCase = (str: string): string => {
    if (!str) return '';

    return str
        .replace(/([a-z])([A-Z])/g, '$1.$2')
        .replace(/[-\s_]/g, '.')
        .toLowerCase();
};

export const toPathCase = (str: string): string => {
    if (!str) return '';

    return str
        .replace(/([a-z])([A-Z])/g, '$1/$2')
        .replace(/[-\s_]/g, '/')
        .toLowerCase();
};

export const capitalizeFirstLetter = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const camelToSnake = (str: string): string => {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

export const snakeToCamel = (str: string): string => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const slugify = (str: string): string => {
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

    // Mantiene letras, números, espacios y algunos caracteres básicos
    return str.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ\-_]/gi, '');
};

export const toSlug = (str: string): string => {
    if (!str) return '';

    return str
        .toLowerCase()
        .normalize('NFD') // Separar acentos
        .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
        .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/--+/g, '-') // Eliminar múltiples guiones
        .trim();
};

/**
 * Detecta el caso de un string
 */
export const detectCase = (str: string): StringCase => {
    if (!str) return 'lower';

    if (/^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/.test(str)) return 'pascal';
    if (/^[a-z]+(?:[A-Z][a-z]+)*$/.test(str)) return 'camel';
    if (/^[a-z]+(?:_[a-z]+)*$/.test(str)) return 'snake';
    if (/^[A-Z]+(?:_[A-Z]+)*$/.test(str)) return 'constant';
    if (/^[a-z]+(?:-[a-z]+)*$/.test(str)) return 'kebab';
    if (/^[a-z\s]+$/.test(str)) return 'lower';
    if (/^[A-Z\s]+$/.test(str)) return 'upper';

    return 'auto' as StringCase;
};
export const determineCase = (str: StringCase): StringCase | undefined => {
    switch (str) {
        case 'camel':
            return 'camel';

        case 'pascal':
            return 'pascal';

        case 'snake':
        case 'snake_case' as StringCase:
            return 'snake';

        case 'kebab':
        case 'dash' as StringCase:
        case 'kebab-case':
        case 'dash-case':
            return 'kebab';

        case 'constant':
        case 'constant_case' as StringCase:
            return 'constant';

        case 'lower':
        case 'lowercase' as StringCase:
            return 'lower';

        case 'upper':
        case 'uppercase' as StringCase:
            return 'upper';

        case 'capitalize':
            return 'capitalize';

        case 'dot':
        case 'dot-case' as StringCase:
            return 'dot';

        case 'path':
        case 'path-case' as StringCase:
            return 'path';

        case 'trim':
            return 'trim';

        case 'no-space':
            return 'no-space';

        case 'no-special':
            return 'no-special';

        case 'slug':
        case 'slug-case':
            return 'slug';

        default:
            return;
    }
};

/**
 * Convierte entre diferentes casos
 */
export const convertCase = (str: string, from: StringCase | 'auto' = 'auto', to: StringCase): string => {
    if (!str) return '';

    const sourceCase = determineCase(from === 'auto' ? detectCase(str) : from);
    const toCase = determineCase(from === 'auto' ? detectCase(to) : to);

    // Primero normalizar a un formato intermedio (separar palabras)
    let words: string[] = [];

    switch (sourceCase) {
        case 'camel':
            words = str.split(/(?=[A-Z])/).map((w) => w.toLowerCase());
            break;
        case 'pascal':
            words = str.split(/(?=[A-Z])/).map((w) => w.toLowerCase());
            break;
        case 'snake':
            words = str.toLowerCase().split('_');
            break;
        case 'kebab':
            words = str.toLowerCase().split('-');
            break;
        case 'constant':
            words = str.toLowerCase().split('_');
            break;
        case 'dot':
            words = str.toLowerCase().split('.');
            break;
        case 'path':
            words = str.toLowerCase().split('/');
            break;
        default:
            words = str.toLowerCase().split(/\s+/);
    }

    // Luego convertir al formato deseado
    switch (toCase) {
        case 'camel':
            return words.map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))).join('');

        case 'pascal':
            return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');

        case 'snake':
            return words.join('_');

        case 'kebab':
            return words.join('-');

        case 'constant':
            return words.join('_').toUpperCase();

        case 'lower':
            return words.join(' ').toLowerCase();

        case 'upper':
            return words.join(' ').toUpperCase();

        case 'capitalize':
            return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        case 'dot':
            return words.join('.');

        case 'path':
            return words.join('/');

        default:
            return words.join(' ');
    }
};

/**
 * Formatea un string según un patrón
 */
export const formatPattern = (str: string, pattern: string = '***-***-***'): string => {
    if (!str) return '';

    const cleanStr = str.replace(/\D/g, ''); // Solo números para patrones comunes
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

/**
 * Abrevia un string si es muy largo
 */
export const abbreviate = (str: string, maxLength: number = 50, suffix: string = '...'): string => {
    if (!str) return '';

    if (str.length <= maxLength) return str;

    return str.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Formatea números como strings con separadores de miles
 */
export const formatNumber = (
    num: number | string,
    decimals: number = 0,
    decimalSeparator: string = '.',
    thousandSeparator: string = ',',
): string => {
    const number = typeof num === 'string' ? parseFloat(num) : num;

    if (isNaN(number)) return '0';

    const parts = number.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

    if (parts[1] && decimals > 0) {
        return parts.join(decimalSeparator);
    }

    return parts[0];
};

// Exportar por defecto la función principal
export default formatString;
