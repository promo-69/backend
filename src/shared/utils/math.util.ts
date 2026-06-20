export class MathUtil {
	/**
	 * Redondea un número monetario a dos decimales de forma segura
	 */
	static roundMoney(value: number): number {
		return Math.round(value * 100) / 100;
	}

	/**
	 * Calcula un porcentaje y lo redondea a dos decimales
	 * Ejemplo: 0.12345 => 12.35 (12.35%)
	 */
	static roundPercentage(value: number): number {
		return Math.round(value * 10000) / 100;
	}
}
