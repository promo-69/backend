const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURACIÓN DE RUTAS
// ==========================================
// Directorio de entrada donde está el archivo de texto
const inputFilePath = path.join(__dirname, 'models.js'); // Asegúrate de que el archivo de texto se llame así o cámbialo a models.txt

// Directorios de salida (Se crearán automáticamente si no existen)
const MODELS_DIR = path.join(__dirname, '..', 'database', 'models', 'main');
const REPOSITORIES_DIR = path.join(__dirname, '..', 'database', 'repositories', 'main');

// ==========================================
// FUNCIONES AUXILIARES (PARSEO Y TRADUCCIÓN)
// ==========================================

// Convierte snake_case o kebab-case a PascalCase (ej. "user-types" o "user_types" -> "UserTypes")
function toPascalCase(str) {
    // Usamos RegEx /[-_]/ para separar tanto por guion medio como por guion bajo
    return str.split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

// Analiza el bloque definition() y extrae los campos con sus tipos
function extractInterfaceFields(modelContent) {
    const fields = [];
    
    // Busca todo el contenido dentro de static definition() { return { ... }; }
    const definitionMatch = modelContent.match(/static definition\(\)\s*\{\s*return\s*\{([\s\S]*?)\};\s*\}/);
    if (!definitionMatch) return fields;

    const definitionBlock = definitionMatch[1];
    
    // RegEx para atrapar cada campo: nombreCampo: { ...propiedades... }
    const fieldRegex = /([a-zA-Z0-9_]+):\s*\{([^}]+)\}/g;
    let match;

    while ((match = fieldRegex.exec(definitionBlock)) !== null) {
        const fieldName = match[1];
        const propsStr = match[2];
        
        // Determinar si es opcional (?)
        const isNullable = propsStr.includes('allowNull: true');
        const isPrimaryKey = propsStr.includes('primaryKey: true');
        const isTimestamp = fieldName === 'created_at' || fieldName === 'updated_at';
        const isOptional = isNullable || isPrimaryKey || isTimestamp;

        // Mapear DataTypes a tipos de TypeScript
        let tsType = 'any';
        if (propsStr.includes('DataTypes.INTEGER') || propsStr.includes('DataTypes.DECIMAL')) {
            tsType = 'number';
        } else if (propsStr.includes('DataTypes.STRING') || propsStr.includes('DataTypes.TEXT') || propsStr.includes('DataTypes.VARCHAR') || propsStr.includes('DataTypes.TIME')) {
            tsType = 'string';
        } else if (propsStr.includes('DataTypes.BOOLEAN')) {
            tsType = 'boolean';
        } else if (propsStr.includes('DataTypes.DATE') || propsStr.includes('DataTypes.DATEONLY')) {
            tsType = 'Date | string';
        }

        fields.push(`    ${fieldName}${isOptional ? '?' : ''}: ${tsType};`);
    }

    return fields.join('\n');
}

// Genera la plantilla de código para el repositorio
function generateRepositoryTemplate(baseName, modelContent) {
    const pascalName = toPascalCase(baseName);
    const interfaceFields = extractInterfaceFields(modelContent);

    return `import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ${pascalName}Model from '@database/models/main/${baseName}.model.js';

export interface ${pascalName}Attributes {
${interfaceFields}
}

class ${pascalName}Repository extends SequelizeRepositoryBase<${pascalName}Attributes, number> {
    constructor() {
        super(${pascalName}Model);
    }
}

export default new ${pascalName}Repository();
`;
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================
function procesarGeneracion() {
    try {
        if (!fs.existsSync(inputFilePath)) {
            console.error(`Error: No se encontró el archivo de entrada en la ruta: ${inputFilePath}`);
            return;
        }

        // Crear carpetas de salida si no existen
        if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });
        if (!fs.existsSync(REPOSITORIES_DIR)) fs.mkdirSync(REPOSITORIES_DIR, { recursive: true });

        const contenido = fs.readFileSync(inputFilePath, 'utf-8');
        const bloques = contenido.split(':------------:');
        
        let modelsCount = 0;
        let reposCount = 0;

        console.log('Iniciando la Generación de Código (Modelos & Repositorios)...\n');

        bloques.forEach((bloque) => {
            const bloqueLimpio = bloque.trim();
            if (!bloqueLimpio) return;

            const lineas = bloqueLimpio.split('\n');
            const primeraLinea = lineas[0].trim();

            if (primeraLinea.startsWith('//')) {
                // Nombre del archivo modelo en kebab-case (ej. audience-categories.model.ts)
                const modelFileName = primeraLinea.replace('//', '').trim().replaceAll('_', '-');
                // Nombre base (ej. audience-categories)
                const baseName = modelFileName.replace('.model.ts', '');
                // Nombre del archivo repositorio (ej. audience-categories.repository.ts)
                const repoFileName = `${baseName}.repository.ts`;

                const modelContent = lineas.slice(1).join('\n').trim() + '\n';
                const repoContent = generateRepositoryTemplate(baseName, modelContent);

                // Rutas finales
                const modelPath = path.join(MODELS_DIR, modelFileName);
                const repoPath = path.join(REPOSITORIES_DIR, repoFileName);

                // Escribir Modelo
                fs.writeFileSync(modelPath, modelContent, 'utf-8');
                console.log(`Modelo creado: \t ${modelFileName}`);
                modelsCount++;

                // Escribir Repositorio
                fs.writeFileSync(repoPath, repoContent, 'utf-8');
                console.log(`Repositorio creado: \t ${repoFileName}`);
                reposCount++;
                console.log('---------------------------------------------------');
            }
        });

        console.log(`\n¡Generación finalizada exitosamente!`);
        console.log(`Total Modelos: ${modelsCount} | Total Repositorios: ${reposCount}`);

    } catch (error) {
        console.error('Ocurrió un error inesperado:', error);
    }
}

// Ejecutar
procesarGeneracion();