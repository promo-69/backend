import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { AppConfig, type IAppConfig } from '@config/app.config.js';
import { AppError, NotFoundError } from '@errors';
import { ANSI } from '@utils/ansi.util.js';
import { Logger } from '@utils/logger.util.js';
import { Database } from '@database/index.js';
import { RequestContext } from '@utils/request-context.util.js';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSwaggerDocs } from './docs/swagger.bundler.js';

const __dirnameApp = path.dirname(fileURLToPath(import.meta.url));

export class App {
	private app: Express;
	private appConfig: IAppConfig;
	private httpServer?: http.Server;

	constructor(config: IAppConfig) {
		this.app = express();
		this.appConfig = config;

		Logger.natural(ANSI.success(`[+] Configuration loaded (${config.nodeEnv})`), { sepEnd: true });
	}

	async start(): Promise<http.Server> {
		const serverApp = await this.initialize();

		return new Promise((resolve, reject) => {
			this.httpServer = http.createServer(serverApp);

			this.httpServer.on('error', (err) => {
				reject(err);
			});

			this.httpServer.listen(this.appConfig.port, this.appConfig.host, () => {
				Logger.natural(
					ANSI.info(`Server running on ${ANSI.link(this.appConfig.apiBaseUrl)}${ANSI.getCode('reset')}`),
				);
				Logger.natural(ANSI.info('Waiting for requests...\n'));

				resolve(this.httpServer as http.Server);
			});

			this.httpServer.setTimeout(30000);
			this.httpServer.keepAliveTimeout = 65000;
			this.httpServer.headersTimeout = 66000;
		});
	}

	async initialize(): Promise<Express> {
		// 1. Conexión a las bases de datos y manejo de los datos
		await this.setupDatabase();

		// 2. Middlewares básicos
		this.setupMiddlewares();

		// 3. Rutas de la API
		await this.setupRoutes();

		// 4. Manejo de errores
		this.setupErrorHandling();

		Logger.natural(ANSI.success('[+] Application initialized successfully'), { sepStart: true, sepEnd: true });

		return this.app;
	}

	private setupMiddlewares(): void {
		Logger.natural(ANSI.info('-------- [ Setting up Middlewares ] --------'));

		// 1. Favicon handler (evita 404 innecesarios)
		this.app.get('/favicon.ico', (req, res) => res.status(204).end());

		// 2. Seguridad básica
		this.app.disable('x-powered-by');

		// 3. CORS
		if (this.appConfig.enableCors) {
			this.app.use(cors(this.appConfig.corsOptions));
			Logger.natural(ANSI.success('[+] CORS middleware loaded'));
		}

		// 4. Seguridad avanzada con Helmet
		if (this.appConfig.enableHelmet) {
			this.app.use(
				helmet({
					contentSecurityPolicy: AppConfig.isProduction(),
					crossOriginEmbedderPolicy: AppConfig.isProduction(),
					hsts: AppConfig.isProduction(),
				}),
			);
			Logger.natural(ANSI.success('[+] Helmet middleware loaded'));
		}

		// 5. Logging de requests
		if (this.appConfig.enableMorgan) {
			const format = AppConfig.isDevelopment() ? 'dev' : 'combined';
			this.app.use(morgan(format));
			Logger.natural(ANSI.success('[+] Morgan middleware loaded'));
		}

		// 6. Body parsing
		this.app.use(
			express.json({
				limit: '10mb',
				verify: (req: any, res, buf) => {
					req.rawBody = buf.toString();
				},
			}),
		);
		Logger.natural(ANSI.success('[+] Body Parsing middleware loaded'));

		// 7. URL encoded parsing (para formularios)
		this.app.use(
			express.urlencoded({
				extended: true,
				limit: '10mb',
			}),
		);
		Logger.natural(ANSI.success('[+] URL Encoding Parsing middleware loaded'));

		// 8. Cookie parsing
		this.app.use(cookieParser());
		Logger.natural(ANSI.success('[+] Cookie Parsing middleware loaded'));

		// 9. Static files
		this.app.use(
			express.static('public', {
				maxAge: AppConfig.isProduction() ? '1d' : 0,
			}),
		);
		Logger.natural(ANSI.success('[+] Static Files middleware loaded'));

		// 10. Trust proxy
		this.app.set('trust proxy', 1);
		Logger.natural(ANSI.success('[+] Trust Proxy middleware loaded'));

		Logger.natural(ANSI.info(''.padEnd(44, '-')), { sepEnd: true });
	}

	private async setupRoutes(): Promise<void> {
		Logger.natural(ANSI.info('----------- [ Setting up Routes ] ----------'));
		const routerEssentialApi = express.Router();
		const router = express.Router();
		const apiPrefix = `/api/v1`;

		// Health check global
		routerEssentialApi.get('/health', (req: Request, res: Response) => {
			const health: Record<string, any> = {
				status: 'healthy',
				timestamp: new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
			};

			if (this.appConfig.nodeEnv == 'development') {
				health.uptime = process.uptime();
				health.memoryUsage = process.memoryUsage();
				health.environment = this.appConfig.nodeEnv;
			}

			res.json(health);
		});

		// Ruta raíz con información de la API
		routerEssentialApi.get('/', (req: Request, res: Response) => {
			const interfaceIp = req.headers.host;
			const welcome = {
				message: 'Welcome to the API',
				docs: `See ${this.appConfig.protocol}://${interfaceIp}${this.appConfig.docs?.path} for check the swagger of the API`,
				health: `See ${this.appConfig.protocol}://${interfaceIp}/health for check the health of the API`,
				...(this.appConfig.nodeEnv == 'development'
					? {
							development: {
								routes: `See ${this.appConfig.protocol}://${interfaceIp}/api/v[version-number]/[module]: API endpoints`,
							},
						}
					: {}),
			};

			res.json(welcome);
		});

		this.app.use(routerEssentialApi);

		// Ruta para mostrar todos los endpoints disponibles
		router.get('/endpoints', (req: Request, res: Response) => {
			const routes = this.getRoutes();

			res.json({
				endpoints: routes,
			});
		});

		// Cargar módulos dinámicamente mediante Vite glob import estático o FS híbrido
		try {
			// @ts-ignore
			if (typeof import.meta.env !== 'undefined') {
				// Analiza pasivamente las carpetas y construye el arbol
				// @ts-ignore
				const routeModules = import.meta.glob('./modules/*/_.route.{ts,js}', { eager: false });

				for (const pathRoute in routeModules) {
					const moduleName = pathRoute.split('/')[2]; // Extrae el id de carpeta ./modules/<moduleName>/_.route.ts

					if (moduleName.startsWith('__')) continue;

					try {
						const module = (await routeModules[pathRoute]()) as any;
						const routeHandler = module.default;

						if (!routeHandler || typeof routeHandler !== 'function')
							throw new Error(`Module ${moduleName} does not export a valid router`);

						router.use(`/${moduleName}`, routeHandler);
						Logger.natural(
							`Loaded: ${ANSI.link(`${this.appConfig.apiBaseUrl}${apiPrefix}/${moduleName}`)}${ANSI.getCode('reset')}`,
						);
					} catch (error: any) {
						Logger.error(`Failed to load module ${moduleName}:`, error);
					}
				}
			} else {
				// Entorno nativo Node.js sin Vite (ej. Tests de Integración en Jest VM)
				const fs = await import('fs');
				const path = await import('path');
				const { fileURLToPath, pathToFileURL } = await import('url');

				const __dirname = path.dirname(fileURLToPath(import.meta.url));
				const modulesPath = path.join(__dirname, 'modules');

				try {
					fs.accessSync(modulesPath);
				} catch {
					return;
				}

				const moduleNames = fs
					.readdirSync(modulesPath, { withFileTypes: true })
					.filter((dirent) => dirent.isDirectory())
					.map((dirent) => dirent.name);

				for (const moduleName of moduleNames) {
					if (moduleName.startsWith('__')) continue;

					const possibleRoutes = [
						path.join(modulesPath, moduleName, '_.route.js'),
						path.join(modulesPath, moduleName, '_.route.ts'),
					];

					let routeHandler: any = null;

					for (const routePath of possibleRoutes) {
						try {
							fs.accessSync(routePath);
							const routeUrl = pathToFileURL(routePath);
							const module = await import(routeUrl.toString());
							routeHandler = module.default;
							break;
						} catch {
							// Sigue buscando
						}
					}

					if (routeHandler && typeof routeHandler === 'function') {
						router.use(`/${moduleName}`, routeHandler);
						Logger.natural(
							`Loaded: ${ANSI.link(`${this.appConfig.apiBaseUrl}${apiPrefix}/${moduleName}`)}${ANSI.getCode('reset')}`,
						);
					}
				}
			}
		} catch (error: any) {
			Logger.error(`Loading modules macro`, error);
		}

		this.app.use((req: Request, res: Response, next: NextFunction) => {
			const isTestingRequest = /^\/api\/v\d+\/test\//.test(req.originalUrl);
			RequestContext.run({ isTestingRequest }, () => next());
		});

		this.app.use(apiPrefix, router);
		this.app.use(`${apiPrefix}/test`, router);

		// Swagger initialization
		if (this.appConfig.enableDocs) {
			try {
				let bundledDoc;

				// @ts-ignore
				if (typeof import.meta.env !== 'undefined') {
					// Importamos el base directamente como string
					// @ts-ignore
					const baseYamlRaw = (await import('./docs/swagger.yaml?raw')).default;
					// @ts-ignore
					const yamlRawModules = import.meta.glob('./modules/**/docs/*.yaml', {
						query: '?raw',
						import: 'default',
						eager: true,
					});

					// Pasamos el base y luego los modulares
					bundledDoc = await buildSwaggerDocs(baseYamlRaw, Object.values(yamlRawModules) as string[]);
				} else {
					bundledDoc = await buildSwaggerDocs();
				}

				this.app.use(
					this.appConfig.docs?.path || '',
					swaggerUi.serve,
					(req: Request, res: Response, next: NextFunction) => {
						const interfaceIp = req.headers.host;
						const dynamicSwaggerDoc = { ...bundledDoc };
						dynamicSwaggerDoc.servers = [
							{
								url: `${this.appConfig.protocol}://${interfaceIp}/api/v1`,
								description: this.appConfig.docs?.description,
							},
						];
						swaggerUi.setup(dynamicSwaggerDoc)(req, res, next);
					},
				);

				Logger.natural(
					ANSI.success(
						`[+] Swagger UI loaded at ${ANSI.link(`${this.appConfig.apiBaseUrl}${this.appConfig.docs?.path}`)}${ANSI.getCode('reset')}`,
					),
				);
			} catch (error: any) {
				new AppError({ ...error, message: `Failed to load Swagger UI: ${error.message}` });
			}
		}

		Logger.natural(ANSI.success(`[+] All routes loaded`));
		Logger.natural(ANSI.info(''.padEnd(44, '-')));
	}

	private setupErrorHandling(): void {
		// 2. Middleware para capturar 404 de ruta
		this.app.use((req: Request, res: Response, next: NextFunction) => {
			const error = new NotFoundError('Route', req.originalUrl);
			next(error); // Pasamos el error al manejador global
		});

		// 3. Manejador de errores global
		this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
			const error = err instanceof AppError ? err : new AppError({ statusCode: err.statusCode, cause: err });

			Logger.natural(
				`${ANSI.error('Error Devuelto:')} ${ANSI.getCode('error')}${error.traceId}${ANSI.getCode('reset')}`,
				{
					sepEnd: true,
				},
			);

			res.status(error.statusCode || 500).json(error.toJSON());
		});
	}

	private async setupDatabase(): Promise<void> {
		Logger.natural(ANSI.info('--------- [ Setting up Databases ] ---------'));

		if (!AppConfig.load().enableDatabase) {
			Logger.natural(ANSI.warning(`Database feature is not enabled`));
			Logger.natural(ANSI.info(''.padEnd(44, '-')), { sepEnd: true });

			return;
		}

		await Database.initializeConnectors();

		Logger.natural(ANSI.info(''.padEnd(44, '-')), { sepEnd: true });
		Logger.natural(ANSI.info('------- [ Setting up Repositories ] --------'));

		await Database.initializeRepositories();

		Logger.natural(ANSI.info(''.padEnd(44, '-')), { sepEnd: true });
	}

	getExpressApp(): Express {
		return this.app;
	}

	private getRoutes(): any[] {
		const routes: any[] = [];

		// Helper para extraer rutas del stack
		const extractRoutes = (layer: any, path: string = '') => {
			if (layer.route) {
				// Es una ruta directa
				const methods = Object.keys(layer.route.methods)
					.filter((method) => layer.route.methods[method])
					.map((method) => method.toUpperCase());

				routes.push({
					path: path + layer.route.path,
					methods,
					type: 'route',
				});
			} else if (layer.name === 'router' || layer.regexp) {
				// Es un router montado
				const routerPath = path + (layer.regexp?.source?.replace(/\\\//g, '/').replace(/[^\/]*$/, '') || '');

				if (layer.handle?.stack) {
					layer.handle.stack.forEach((sublayer: any) => {
						extractRoutes(sublayer, routerPath);
					});
				}
			}
		};

		// Extraer rutas del stack de Express
		(this.app as any).router?.stack?.forEach((layer: any) => {
			extractRoutes(layer);
		});

		return routes;
	}
}
