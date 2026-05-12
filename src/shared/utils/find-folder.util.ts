import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'fs';

export interface FindParentFolderOptions {
	/** Directorio inicial (opcional) */
	startDir?: string;
	/** Si debe buscar en directorios hermanos (default: false) */
	includeSiblings?: boolean;
	/** Número máximo de niveles a subir (opcional) */
	maxLevels?: number;
}

// Tipos adicionales para uso extendido
export type FolderSearchResult = {
	found: boolean;
	path: string | null;
	depth: number;
};

/**
 * Busca una carpeta específica en directorios padres
 * @param folderName - Nombre de la carpeta a buscar
 * @param options - Opciones de búsqueda
 * @returns Ruta absoluta de la carpeta encontrada o null si no se encuentra
 */
export const findParentFolder = (folderName: string, options: FindParentFolderOptions = {}): string | null => {
	const { startDir, includeSiblings = false, maxLevels = Infinity } = options;

	// Convertir import.meta.url a ruta de archivo si no se proporciona startDir
	const currentFile = fileURLToPath(import.meta.url);
	let currentDir = startDir ? path.resolve(startDir) : path.dirname(currentFile);
	let levelsUp = 0;

	// Buscar hacia arriba en la jerarquía de directorios
	while (currentDir !== path.parse(currentDir).root && levelsUp < maxLevels) {
		// 1. Verificar si existe la carpeta en el directorio actual
		const targetPath = path.join(currentDir, folderName);

		if (existsSync(targetPath)) {
			return targetPath;
		}

		// 2. Verificar hermanos del directorio actual (si está habilitado)
		if (includeSiblings) {
			const parentDir = path.dirname(currentDir);
			try {
				const siblings = readdirSync(parentDir, { withFileTypes: true });
				for (const sibling of siblings) {
					if (sibling.isDirectory() && sibling.name === folderName) {
						const siblingPath = path.join(parentDir, sibling.name);
						return siblingPath;
					}
				}
			} catch (err) {
				// Ignorar errores de lectura de directorio
				console.debug(`No se pudo leer el directorio: ${parentDir}`, err);
			}
		}

		// Subir un nivel
		currentDir = path.dirname(currentDir);
		levelsUp++;
	}

	// 3. Verificar en el directorio raíz como último recurso
	const rootPath = path.join(path.parse(currentDir).root, folderName);
	if (existsSync(rootPath)) {
		return rootPath;
	}

	return null;
};

// Función auxiliar para encontrar múltiples carpetas
export const findMultipleParentFolders = (
	folderNames: string[],
	options: FindParentFolderOptions = {},
): Record<string, string | null> => {
	const results: Record<string, string | null> = {};

	for (const folderName of folderNames) {
		results[folderName] = findParentFolder(folderName, options);
	}

	return results;
};

// Función que retorna una promesa
export const findParentFolderAsync = async (
	folderName: string,
	options: FindParentFolderOptions = {},
): Promise<string | null> => {
	// Para una versión asíncrona real
	return Promise.resolve(findParentFolder(folderName, options));
};

export const findParentFolderDetailed = (
	folderName: string,
	options: FindParentFolderOptions = {},
): FolderSearchResult => {
	const { startDir, includeSiblings = false, maxLevels = Infinity } = options;

	const currentFile = fileURLToPath(import.meta.url);
	let currentDir = startDir ? path.resolve(startDir) : path.dirname(currentFile);
	let levelsUp = 0;
	let depth = 0;

	while (currentDir !== path.parse(currentDir).root && levelsUp < maxLevels) {
		const targetPath = path.join(currentDir, folderName);

		if (existsSync(targetPath)) {
			return {
				found: true,
				path: targetPath,
				depth,
			};
		}

		if (includeSiblings) {
			const parentDir = path.dirname(currentDir);
			try {
				const siblings = readdirSync(parentDir, { withFileTypes: true });
				for (const sibling of siblings) {
					if (sibling.isDirectory() && sibling.name === folderName) {
						const siblingPath = path.join(parentDir, sibling.name);
						return {
							found: true,
							path: siblingPath,
							depth: depth + 0.5, // Indica que está en un hermano
						};
					}
				}
			} catch (err) {
				// Ignorar errores
			}
		}

		currentDir = path.dirname(currentDir);
		levelsUp++;
		depth++;
	}

	const rootPath = path.join(path.parse(currentDir).root, folderName);
	if (existsSync(rootPath)) {
		return {
			found: true,
			path: rootPath,
			depth: depth + 1,
		};
	}

	return {
		found: false,
		path: null,
		depth,
	};
};

// Exportar por defecto
export default findParentFolder;
