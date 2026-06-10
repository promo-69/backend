const IORedis = require('ioredis');

async function resetCache() {
	try {
		const redisConfig = {
			host: process.env.CACHE_DATABASE_HOST,
			port: process.env.CACHE_DATABASE_PORT || 6379,
		};

		if (process.env.CACHE_DATABASE_USERNAME && process.env.CACHE_DATABASE_PASSWORD) {
			redisConfig.username = process.env.CACHE_DATABASE_USERNAME;
			redisConfig.password = process.env.CACHE_DATABASE_PASSWORD;
		}

		console.log(`\n▶ Conectando a Redis en ${redisConfig.host}:${redisConfig.port}...`);
		const redis = new IORedis(redisConfig);
		
		await redis.flushall();
		
		console.log('✅ Caché de Redis reseteada correctamente (FLUSHALL).\n');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error reseteando la caché de Redis:', error);
		process.exit(1);
	}
}

resetCache();
