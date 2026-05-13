const { spawnSync } = require('child_process');

const originalArgs = process.argv.slice(2);
const cleanArgs = [];
let dbId;
let isTest = false;

for (let i = 0; i < originalArgs.length; i++) {
	const arg = originalArgs[i];
	if (arg === '--id') {
		dbId = originalArgs[++i];
	} else if (arg.startsWith('--id=')) {
		dbId = arg.split('=')[1];
	} else if (arg === '--test') {
		isTest = true;
	} else {
		cleanArgs.push(arg);
	}
}

if (!dbId) {
	console.error(
		'\n❌ ERROR: Debes proveer obligatoriamente un ID de conector usando --id=nombre o "--id nombre". Ej: yarn docker:db:migrate --id=main\n',
	);
	process.exit(1);
}

process.env.MIGRATE_DB_ID = dbId;
if (isTest) {
	process.env.MIGRATE_IS_TEST = 'true';
}

const commandArg = cleanArgs[0];

const metaCommands = {
	setup: ['db:create', 'db:migrate'],
	'setup:full': ['db:create', 'db:migrate', 'db:seed:all'],
	reset: ['db:drop', 'db:create', 'db:migrate'],
	'reset:full': ['db:drop', 'db:create', 'db:migrate', 'db:seed:all'],
};

if (metaCommands[commandArg]) {
	const sequence = metaCommands[commandArg];
	for (const cmd of sequence) {
		console.log(`\n▶ Ejecutando paso: ${cmd} ...`);
		const result = spawnSync('npx', ['sequelize-cli', cmd, ...cleanArgs.slice(1)], {
			stdio: 'inherit',
			env: process.env,
		});

		// Ignoramos el error en db:drop por si la BD no existe aún (comportamiento normal en resets)
		if (result.status !== 0 && cmd !== 'db:drop') {
			process.exit(result.status || 1);
		}
	}
	process.exit(0);
} else {
	const result = spawnSync('npx', ['sequelize-cli', ...cleanArgs], {
		stdio: 'inherit',
		env: process.env,
	});
	process.exit(result.status !== null ? result.status : 1);
}
