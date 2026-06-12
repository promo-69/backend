export class PricingService {
	/**
	 * Calcula el precio final iterando sobre los modificadores aplicables y aplicándolos al precio base.
	 *
	 * @param basePrice - Precio base en la moneda objetivo
	 * @param context - El contexto del ítem (ej. cinemaId, modifier_scope, audienceCategoryId, productId, etc.)
	 * @param itemCurrency - La moneda original del ítem (para filtrar los modificadores)
	 * @param activeModifiers - Todos los modificadores activos precargados
	 * @param opTypesMap - Diccionario de OperationTypes precargados (id -> object)
	 * @param timeContext - Contexto temporal (currentDate, currentTime, currentDay)
	 * @returns Objeto con el precio final calculado y los modificadores que fueron aplicados en la moneda original
	 */
	static calculateFinalPrice(
		basePrice: number,
		context: any,
		itemCurrency: number,
		activeModifiers: any[],
		opTypesMap: Map<number, any>,
		timeContext: { currentDate: string; currentTime: string; currentDay: number },
	) {
		let finalUnitPrice = basePrice;
		const appliedModifiers: any[] = [];

		// Filtra los modificadores aplicables según el contexto
		const applicableModifiers = activeModifiers.filter((m: any) => {
			if (m.modifier_scope && m.modifier_scope !== context.modifier_scope) return false;
			
			// Regla estricta: El modificador DEBE coincidir con la moneda original del ítem,
			// a menos que sea un modificador porcentual, los cuales son agnósticos a la moneda.
			if (!m.is_percentage && m.currency !== itemCurrency) return false;

			// Filtros de tiempo
			if (m.target_currency_condition) return false; // Lógica no manejada aquí
			if (m.start_date && m.start_date > timeContext.currentDate) return false;
			if (m.end_date && m.end_date < timeContext.currentDate) return false;
			if (m.start_time && m.start_time > timeContext.currentTime) return false;
			if (m.end_time && m.end_time <= timeContext.currentTime) return false;
			if (m.week_day && m.week_day !== timeContext.currentDay) return false;

			// Filtros espaciales y de catalogos
			if (m.cinema && m.cinema !== context.cinemaId) return false;

			// Dependiendo del scope aplicamos unos u otros filtros
			if (context.modifier_scope === 1) {
				// Boletería
				if (m.booking_type && m.booking_type !== context.booking_type) return false;
				if (m.movie && m.movie !== context.movie) return false;
				if (m.projection_type && m.projection_type !== context.projection_type) return false;
				if (m.seat_category && m.seat_category !== context.seat_category) return false;
				if (m.room_type && m.room_type !== context.room_type) return false;
				if (m.audience_category && m.audience_category !== context.audienceCategoryId) return false;
			} else if (context.modifier_scope === 2) {
				// Confitería
				if (m.line_type && m.line_type !== context.line_type) return false;
				if (m.product_category && m.product_category !== context.product_category) return false;
				if (m.product && m.product !== context.product) return false;
				if (m.combo && m.combo !== context.combo) return false;
			}

			return true;
		});

		for (const mod of applicableModifiers) {
			const opType =
				(typeof opTypesMap.get === 'function'
					? opTypesMap.get(mod.operation_type)
					: (opTypesMap as any)[mod.operation_type]) || ({} as any);
			let modValue = 0;

			if (mod.is_percentage) {
				modValue = basePrice * (Number(mod.value) / 100);
			} else {
				modValue = Number(mod.value);
			}

			const netChange = opType.is_increment ? modValue : -modValue;
			finalUnitPrice += netChange;

			appliedModifiers.push({
				price_modifier: mod.id,
				applied_amount: netChange, // Cantidad descontada/incrementada en la moneda original
			});
		}

		// El precio no puede ser negativo
		finalUnitPrice = Math.max(0, finalUnitPrice);

		return {
			finalPrice: finalUnitPrice,
			appliedModifiers,
		};
	}
}
