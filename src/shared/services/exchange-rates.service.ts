import { Logger } from '@utils/logger.util.js';
import * as cheerio from 'cheerio';
import https from 'https';
import { Database } from '@database/index.js';

export class ExchangeRateService {
	/**
	 * Extrae las tasas de cambio oficiales del Banco Central de Venezuela
	 */
	static async fetchExchangeRates(): Promise<void> {
		try {
			// Usamos https.get nativo para tener control total sobre el agente TLS y evitar problemas con fetch(undici)
			const html = await new Promise<string>((resolve, reject) => {
				const req = https.get('https://www.bcv.org.ve/', {
					agent: new https.Agent({ rejectUnauthorized: false }),
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
						'Accept': 'text/html'
					}
				}, (res) => {
					if (res.statusCode !== 200) return reject(new Error(`BCV respondió con status: ${res.statusCode}`));

					let data = '';
					res.on('data', (chunk) => { data += chunk; });
					res.on('end', () => { resolve(data); });
				});

				req.on('error', (e) => reject(e));
			});
			const $ = cheerio.load(html);

			const extractRate = (selector: string): string => {
				const text = $(selector).text();
				const cleanText = text.replace(/\s+/g, '').replace(',', '.');
				const numberValue = Number(cleanText);

				if (Number.isNaN(numberValue)) return '0.00';

				return numberValue.toFixed(2);
			};

			const eurRate = extractRate('#euro .strong-tb');
			const usdRate = extractRate('#dolar .strong-tb');

			// Persistir tasas en base de datos si las monedas están registradas
			const currenciesRepo = Database.repository('main', 'currencies') as any;
			const exchangeRatesRepo = Database.repository('main', 'exchange-rates') as any;
			const currenciesResult = await currenciesRepo.getAll({ count: false }, { code: ['USD', 'EUR'] });
			const existingCurrencies = currenciesResult;

			if (Array.isArray(existingCurrencies) && existingCurrencies.length > 0) {
				const bulkPayload: any[] = [];
				for (const currency of existingCurrencies) {
					if (currency.code === 'USD' && usdRate !== '0.00') {
						bulkPayload.push({
							currency: currency.id,
							rate: Number(usdRate),
							user: 1 // Usuario SA
						});
					} else if (currency.code === 'EUR' && eurRate !== '0.00') {
						bulkPayload.push({
							currency: currency.id,
							rate: Number(eurRate),
							user: 1
						});
					}
				}

				if (bulkPayload.length > 0) {
					await exchangeRatesRepo.bulkCreate(bulkPayload);
					Logger.info(`[ExchangeRates] ${bulkPayload.length} nuevas tasas registradas en la base de datos.`);
				}
			}

		} catch (error: any) {
			Logger.error(`[ExchangeRates] Error extrayendo las tasas`, error);
			throw error;
		}
	}
}
