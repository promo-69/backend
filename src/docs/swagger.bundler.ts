import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SwaggerParser from '@apidevtools/swagger-parser';
import YAML from 'yamljs';

const __dirnameApp = path.dirname(fileURLToPath(import.meta.url));

function deepMerge(target: any, source: any) {
	for (const key of Object.keys(source)) {
		if (source[key] instanceof Object && key in target) {
			Object.assign(source[key], deepMerge(target[key], source[key]));
		}
	}
	Object.assign(target || {}, source);
	return target;
}

function findYamlFiles(dir: string, fileList: string[] = []) {
	if (!fs.existsSync(dir)) return fileList;
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) findYamlFiles(filePath, fileList);
		else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) fileList.push(filePath);
	}
	return fileList;
}

export async function buildSwaggerDocs(yamlRawModules?: string[]) {
	const mainYamlPath = path.join(__dirnameApp, 'swagger.yaml');
	let baseDoc: any = {};

	try {
		baseDoc = YAML.load(mainYamlPath) || {};
	} catch (e) {
		console.warn('Could not load base swagger.yaml file, proceeding with empty base');
	}

	baseDoc.paths = baseDoc.paths || {};

	if (yamlRawModules && Array.isArray(yamlRawModules)) {
		// 1. Vite Environment (raw strings provided)
		for (const rawYaml of yamlRawModules) {
			try {
				const docContent: any = YAML.parse(rawYaml);
				if (docContent && typeof docContent === 'object')
					deepMerge(baseDoc.paths, docContent?.paths ? docContent.paths : docContent);
			} catch (e) {
				console.error(`Error parsing raw YAML module:`, e);
			}
		}
	} else {
		// 2. Node.js Native Environment (use fs and glob)
		const modulesDir = path.join(__dirnameApp, '../modules');
		const docsFiles = findYamlFiles(modulesDir).filter((f) => f.includes('/docs/') || f.includes('\\docs\\'));

		for (const docFile of docsFiles) {
			try {
				const docContent: any = YAML.load(docFile);
				if (docContent && typeof docContent === 'object')
					deepMerge(baseDoc.paths, docContent?.paths ? docContent.paths : docContent);
			} catch (e) {
				console.error(`Error parsing YAML file ${docFile}:`, e);
			}
		}
	}

	const bundledDoc = await SwaggerParser.dereference(baseDoc);
	return bundledDoc;
}
