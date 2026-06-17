const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const templateName = args[0];
const templateArgs = args.slice(1);

if (!templateName) {
    console.error("=========================================");
    console.error("❌ Error: Debes especificar el nombre del template.");
    console.error("📝 Uso: yarn node test-email.cjs <templateName> [arg1] [arg2] ...");
    console.error("💡 Ejemplo: yarn node test-email.cjs welcome 'Juan Perez'");
    console.error("=========================================");
    process.exit(1);
}

// Cargamos dotenv aquí para validar que la variable esté seteada
require('dotenv').config();
if (!process.env.EMAIL_TEST) {
    console.error("=========================================");
    console.error("❌ Error: La variable de entorno EMAIL_TEST no está definida.");
    console.error("Asegúrate de haberla agregado a tu archivo .env");
    console.error("=========================================");
    process.exit(1);
}

// Construimos el contenido del archivo temporal TypeScript
const scriptContent = `
import * as dotenv from 'dotenv';
dotenv.config();

import { EmailProvider } from '@providers/email.provider.js';

async function main() {
    const emailTo = process.env.EMAIL_TEST;
    if (!emailTo) {
        console.error("❌ Error: La variable de entorno EMAIL_TEST no está definida.");
        process.exit(1);
    }

    try {
        // Se hace import dinámico del template exacto
        const module = await import('@templates/emails/${templateName}.template.ts');
        
        // Buscamos la primera función exportada
        const exportName = Object.keys(module).find(key => typeof module[key] === 'function');
        
        if (!exportName) {
            console.error(\`❌ Error: No se encontró una función exportada en el template \${'${templateName}'}\`);
            process.exit(1);
        }

        const templateFn = module[exportName];
        
        // Utilizamos los argumentos inyectados directamente desde el script padre
        const rawArgs = ${JSON.stringify(templateArgs)};
        // Convertimos los argumentos (parseamos booleanos y números)
        const args = rawArgs.map(arg => {
            if (String(arg).toLowerCase() === 'true') return true;
            if (String(arg).toLowerCase() === 'false') return false;
            if (!isNaN(Number(arg)) && String(arg).trim() !== '') return Number(arg);
            return arg;
        });

        // Generamos el HTML usando la función del template
        const html = templateFn(...args);
        
        const provider = EmailProvider.getInstance();
        console.log(\`=========================================\`);
        console.log(\`📧 Enviando correo a: \${emailTo}\`);
        console.log(\`📄 Usando template: ${templateName}\`);
        console.log(\`⚙️ Argumentos: \`, args);
        console.log(\`=========================================\\n\`);
        
        const success = await provider.sendMail(emailTo, \`Prueba de Template: ${templateName}\`, html);
        
        if (success) {
            console.log(\`\\n=========================================\`);
            console.log("✅ ¡Correo enviado exitosamente!");
            console.log(\`=========================================\`);
        } else {
            console.error(\`\\n=========================================\`);
            console.error("❌ No se pudo enviar el correo. Revisa los logs.");
            console.error(\`=========================================\`);
        }
        process.exit(0);
    } catch (error) {
        console.error(\`\\n=========================================\`);
        console.error("❌ Hubo un problema al cargar el template o al enviar el correo:");
        console.error(error);
        console.error(\`=========================================\`);
        process.exit(1);
    }
}

main();
`;

const tempFilePath = path.join(__dirname, '.temp-test-email.ts');

try {
    fs.writeFileSync(tempFilePath, scriptContent, 'utf8');
} catch (err) {
    console.error("❌ Error al crear el archivo temporal:", err);
    process.exit(1);
}

// Ejecutamos vite-node con el archivo temporal
const child = spawn('yarn', ['vite-node', tempFilePath], {
    stdio: 'inherit',
    shell: true
});

const cleanUp = () => {
    if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
    }
};

child.on('close', (code) => {
    cleanUp();
    process.exit(code);
});

// Asegurarse de borrar el temporal en caso de cancelación (Ctrl+C)
process.on('SIGINT', () => {
    cleanUp();
    process.exit(1);
});
process.on('SIGTERM', () => {
    cleanUp();
    process.exit(1);
});
