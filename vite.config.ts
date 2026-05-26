import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const isDocker = String(env.IS_DOCKER ?? '').toLowerCase() === 'true';

	return {
		server: {
			host: true,
			strictPort: true,
			hmr: {
				protocol: isDocker ? 'wss' : 'ws',
			},
			watch: {
				usePolling: isDocker,
			},
		},
		resolve: {
			alias: {
				'@config': path.resolve(__dirname, 'src/config'),
				'@database': path.resolve(__dirname, 'src/database'),
				'@db-connectors': path.resolve(__dirname, 'src/database/connectors'),
				'@migrations': path.resolve(__dirname, 'src/database/migrations'),
				'@models': path.resolve(__dirname, 'src/database/models'),
				'@repositories': path.resolve(__dirname, 'src/database/repositories'),
				'@modules': path.resolve(__dirname, 'src/modules'),
				'@bases': path.resolve(__dirname, 'src/core/bases'),
				'@rules': path.resolve(__dirname, 'src/core/types'),
				'@errors': path.resolve(__dirname, 'src/shared/errors'),
				'@middlewares': path.resolve(__dirname, 'src/shared/middlewares'),
				'@utils': path.resolve(__dirname, 'src/shared/utils'),
				'@constants': path.resolve(__dirname, 'src/shared/constants'),
				'@services': path.resolve(__dirname, 'src/shared/services'),
				'@providers': path.resolve(__dirname, 'src/shared/providers'),
				'@templates': path.resolve(__dirname, 'src/shared/templates'),
				'@tests': path.resolve(__dirname, 'tests'),
				'@background': path.resolve(__dirname, 'src/background'),
				'@workers': path.resolve(__dirname, 'src/background/workers'),
				'@crons': path.resolve(__dirname, 'src/background/crons'),
				'@subscribers': path.resolve(__dirname, 'src/background/subscribers'),
				'@tasks': path.resolve(__dirname, 'src/background/tasks'),
			},
		},
		define: {
			'process.env.NODE_ENV': JSON.stringify(mode),
		},
		// Build Configuration
		build: {
			outDir: 'build',
			ssr: true, // Output for Node.js Server
			target: 'node18',
			rollupOptions: {
				input: path.resolve(__dirname, 'src/index.ts'),
				external: [
					'pg',
					'sequelize',
					'pg-hstore',
					'pdfmake',
					'pdfmake/src/printer.js',
					'swagger-ui-express',
					'socket.io',
					'@socket.io/redis-adapter',
					'bullmq',
				],
			},
		},
		// SSR Configuration (Force bundle for everything except natively compiled binaries)
		ssr: {
			noExternal: true,
			external: [
				'pg',
				'sequelize',
				'pg-hstore',
				'pdfmake',
				'pdfmake/src/printer.js',
				'swagger-ui-express',
				'socket.io',
				'@socket.io/redis-adapter',
				'bullmq',
			],
			target: 'node',
		},
		// Optimize purely for Dev
		optimizeDeps: {
			include: [
				'cookie-parser',
				'cors',
				'express',
				'helmet',
				'jsonwebtoken',
				'mime-types',
				'morgan',
				'multer',
				'nodemailer',
			],
			exclude: ['pg', 'sequelize'],
		},
	};
});
