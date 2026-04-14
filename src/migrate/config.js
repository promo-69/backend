require('dotenv').config();

const dbId = process.env.MIGRATE_DB_ID;
const isTest = process.env.MIGRATE_IS_TEST === 'true';

if (!dbId) {
    console.error('\n❌ ERROR: Falta proveer el ID de conector.\n');
    process.exit(1);
}

const targetId = dbId.toUpperCase();

// Fase 1: Autodescubrimiento del Dialecto mediante Regex
// Compilamos el patrón: Empieza con "DB_", seguido de letras (Dialecto), seguido del ID.
const regex = new RegExp(`^DB_([A-Z]+)_${targetId}_`);
let detectedDialect = null;

for (const key of Object.keys(process.env)) {
    const match = key.match(regex);
    if (match) {
        // match[1] captura exactamente el grupo ([A-Z]+), por ejemplo: "POSTGRESQL"
        detectedDialect = match[1];
        break; // Optimizacion: nos detenemos al primer hallazgo exitoso
    }
}

if (!detectedDialect) {
    console.error(
        `\nERROR: No se encontro ninguna configuracion en el entorno que coincida con el patron DB_DIALECT_${targetId}_...\n`,
    );
    process.exit(1);
}

// Fase 2: Construccion del Prefijo Dinamico
const prefix = `DB_${detectedDialect}_${targetId}`;

// Fase 3: Resolucion de Variables y Ensamblaje
const rawDatabase = process.env[`${prefix}_DATABASE`];

if (!rawDatabase) {
    console.error(
        `\nERROR: No se encontro el nombre de la base de datos para "${dbId}". La variable ${prefix}_DATABASE esta vacia o no existe.\n`,
    );
    process.exit(1);
}

const targetDatabase = rawDatabase + (isTest ? '-test' : '');

module.exports = {
    username: process.env[`${prefix}_USERNAME`],
    password: process.env[`${prefix}_PASSWORD`],
    database: targetDatabase,
    host: process.env[`${prefix}_HOST`] || 'db',
    port: process.env[`${prefix}_PORT`],
    dialect: 'postgres',
    logging: true,
    ...(process.env[`${prefix}_SSL`] === 'true'
        ? {
              dialectOptions: {
                  ssl: {
                      require: true,
                      rejectUnauthorized: false,
                  },
              },
          }
        : {}),
};
