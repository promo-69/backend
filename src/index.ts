import { App } from './app.js';
import { AppConfig } from '@config/app.config.js';
import { Database } from '@database/index.js';
import { Logger } from '@utils/logger.util.js';

import http from 'http';

async function bootstrap() {
    try {
        // Cargar configuración
        const config = AppConfig.load();

        // Crear aplicación
        const app = new App(config);

        // Iniciar servidor http
        const server = await app.start();

        // Manejar shutdown con el servidor adjunto
        setupGracefulShutdown(server);

        // Si existe un IPC de padre (ej. PM2/Vite), enviar señal
        if (typeof process.send === 'function') process.send('ready');
    } catch (error: any) {
        Logger.error(`Failed to start application`, error);
        process.exit(1);
    }
}

function setupGracefulShutdown(server: http.Server) {
    const connections = new Set<any>();
    let isShuttingDown = false;

    // Registrar conexiones activas
    server.on('connection', (socket) => {
        connections.add(socket);
        socket.on('close', () => connections.delete(socket));
    });

    const gracefulShutdown = (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`\n${signal} recibido. Iniciando proxy cierre controlado...\n`);

        // Timer de seguridad (30s)
        const forceShutdownTimer = setTimeout(() => {
            console.warn('Forzando cierre de conexiones HTTP activas...');
            connections.forEach((socket) => socket.destroy());
            process.exit(1);
        }, 30000);

        server.close(async (err) => {
            clearTimeout(forceShutdownTimer);
            if (err) {
                console.error('Error cerrando el servidor orgánico:', err);
                return process.exit(1);
            }

            console.log('Servidor HTTP detenido correctamente.');

            try {
                if (['SIGTERM', 'SIGINT', 'SIGHUP'].includes(signal)) {
                    await Database.shutdown();
                }
                process.exit(0);
            } catch (error) {
                console.error('Failure en cierre de la db:', error);
                process.exit(1);
            }
        });
    };

    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];

    signals.forEach((signal) => {
        process.on(signal, () => gracefulShutdown(signal));
    });

    // Reinicio en modo desarrollo mediante Vite HMR (SSR)
    if (import.meta.hot) {
        import.meta.hot.on('vite:beforeFullReload', () => {
            console.log('\n[Vite HMR] Cerrando micro-servidor para reload caliente...\n');
            server.close();
        });
    }

    // Errores no capturados
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}

// Iniciar la aplicación
bootstrap();
