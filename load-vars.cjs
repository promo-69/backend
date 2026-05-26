const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// El primer argumento es el archivo, el resto es el comando
const [, , configFile, ...commandArgs] = process.argv;

if (!configFile) {
	console.error('Error: Debes especificar un archivo de configuración.');
	process.exit(1);
}

// Leer y cargar el archivo
const filePath = path.join(__dirname, configFile);

if (fs.existsSync(filePath)) {
	const content = fs.readFileSync(filePath, 'utf8');
	content.split(/\r?\n/).forEach((line) => {
		const [key, ...valueParts] = line.split('=');
		if (key && valueParts.length > 0) {
			process.env[key.trim()] = valueParts.join('=').trim();
		}
	});
} else {
	console.error(`Error: No se encontró el archivo ${configFile}`);
	process.exit(1);
}

// Ejecutar el comando
const fullCommand = commandArgs.join(' ');
spawn(fullCommand, { stdio: 'inherit', shell: true });
