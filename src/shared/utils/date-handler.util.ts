export type DateInput = Date | string | null;
export type DateHandlerResult = HandleredDate | undefined;
export type TimeUnit = 'ms' | 's' | 'm' | 'min' | 'h';
export type OutputTimeUnit = 'ms' | 's' | 'm' | 'h';

const UNIT_TO_MS: Record<TimeUnit, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    min: 60 * 1000,
    h: 60 * 60 * 1000,
};

export class HandleredDate {
    year: number;
    month: string;
    day: string;
    iso: string;
    dmy: string;
    __raw: Date;

    constructor(handler: Date) {
        this.year = handler.getFullYear();
        this.month = String(handler.getMonth() + 1).padStart(2, '0');
        this.day = String(handler.getDate()).padStart(2, '0');
        this.iso = `${this.year}-${this.month}-${this.day}`;
        this.dmy = `${this.day}/${this.month}/${this.year}`;
        this.__raw = handler;
    }

    isEqual(other: HandleredDate | Date | string | null, verificationType: 'date' | 'datetime' = 'date'): boolean {
        const _other = other instanceof HandleredDate ? other : dateHandler(other);

        if (!_other) return false;

        if (verificationType === 'date') return this.iso === _other.iso;

        return this.__raw.getTime() === _other.__raw.getTime();
    }

    isGreater(other: HandleredDate | Date | string | null): boolean {
        const _other = other instanceof HandleredDate ? other : dateHandler(other);

        if (!_other) return false;

        return this.__raw.getTime() > _other.__raw.getTime();
    }

    isLess(other: HandleredDate | Date | string | null): boolean {
        const _other = other instanceof HandleredDate ? other : dateHandler(other);

        if (!_other) return false;

        return this.__raw.getTime() < _other.__raw.getTime();
    }

    isGreaterOrEqual(other: HandleredDate | Date | string | null): boolean {
        const _other = other instanceof HandleredDate ? other : dateHandler(other);

        if (!_other) return false;

        return this.__raw.getTime() >= _other.__raw.getTime();
    }

    isLessOrEqual(other: HandleredDate | Date | string | null): boolean {
        const _other = other instanceof HandleredDate ? other : dateHandler(other);

        if (!_other) return false;

        return this.__raw.getTime() <= _other.__raw.getTime();
    }

    addDays(days: number): HandleredDate {
        const newDate = new Date(this.__raw);
        newDate.setDate(newDate.getDate() + days);
        return new HandleredDate(newDate);
    }

    subtractDays(days: number): HandleredDate {
        return this.addDays(-days);
    }

    toDate(): Date {
        return new Date(this.__raw);
    }

    toString(format: 'iso' | 'dmy' = 'iso'): string {
        return format === 'iso' ? this.iso : this.dmy;
    }

    // Métodos estáticos
    static now(): HandleredDate {
        const result = dateHandler();
        return result!;
    }

    static parse(anyDate: DateInput): HandleredDate | undefined {
        return dateHandler(anyDate);
    }

    static today(): HandleredDate {
        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return new HandleredDate(todayDate);
    }
}

export const getTimeIn = (time: string, outputUnit: OutputTimeUnit = 'ms'): number => {
    const timeStr = time.trim();

    // Detectar el valor y unidad de entrada (similar a tu lógica original)
    const msMatch = timeStr.match(/^(\d+(?:\.\d+)?)(?:ms)?$/);
    const mMatch = timeStr.match(/^(\d+(?:\.\d+)?)(?:m|min)$/);
    const sMatch = timeStr.match(/^(\d+(?:\.\d+)?)s$/);
    const hMatch = timeStr.match(/^(\d+(?:\.\d+)?)h$/);

    let valueInMs: number;

    if (hMatch && hMatch[1]) {
        valueInMs = parseFloat(hMatch[1]) * UNIT_TO_MS['h'];
    } else if (mMatch && mMatch[1]) {
        valueInMs = parseFloat(mMatch[1]) * UNIT_TO_MS['m'];
    } else if (sMatch && sMatch[1]) {
        valueInMs = parseFloat(sMatch[1]) * UNIT_TO_MS['s'];
    } else if (msMatch && msMatch[1]) {
        valueInMs = parseFloat(msMatch[1]);
    } else {
        throw new Error(
            `Formato de tiempo inválido: "${time}". ` + `Formatos: "100", "100ms", "10s", "5m", "5min", "2h", "1.5h"`,
        );
    }

    // Convertir a la unidad de salida deseada
    return valueInMs / UNIT_TO_MS[outputUnit];
};

export const dateHandler = (date: DateInput = null, variable: number | null = null): DateHandlerResult => {
    let handlerDate: Date;

    // 1. Obtenemos el objeto Date correctamente
    if (date instanceof Date) {
        handlerDate = date;
        const offset = handlerDate.getTimezoneOffset();
        handlerDate = new Date(handlerDate.getTime() - offset * 60 * 1000);
    } else if (date !== null && /^(\d{4})-(\d{2})-(\d{2})$/.test(date)) {
        // Formato YYYY-MM-DD
        const [year, month, day] = date.split('-').map(Number);
        handlerDate = new Date(year, month - 1, day);
    } else if (date !== null && /^(\d{2})(-|\/)(\d{2})(-|\/)(\d{4})$/.test(date)) {
        // Formato DD/MM/YYYY o DD-MM-YYYY
        const parts = date.split(/[-/]/);
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        handlerDate = new Date(year, month - 1, day);
    } else if (date === null) {
        // Fecha actual
        handlerDate = new Date();
        const offset = handlerDate.getTimezoneOffset();
        handlerDate = new Date(handlerDate.getTime() - offset * 60 * 1000);
    } else if (typeof date === 'string') {
        // Intentar parsear como fecha genérica
        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) {
            console.warn(`Invalid date format: ${date}`);
            return undefined;
        }

        handlerDate = parsedDate;
        const offset = handlerDate.getTimezoneOffset();
        handlerDate = new Date(handlerDate.getTime() - offset * 60 * 1000);
    } else {
        // Caso por defecto (fecha actual)
        handlerDate = new Date();
        const offset = handlerDate.getTimezoneOffset();
        handlerDate = new Date(handlerDate.getTime() - offset * 60 * 1000);
    }

    if (variable !== null && typeof variable === 'number') handlerDate.setDate(handlerDate.getDate() + variable);

    return new HandleredDate(handlerDate);
};

// Funciones helper adicionales
export const isDateEqual = (
    date1: DateInput,
    date2: DateInput,
    verificationType: 'date' | 'datetime' = 'date',
): boolean => {
    const d1 = dateHandler(date1);
    const d2 = dateHandler(date2);

    if (!d1 || !d2) return false;

    return d1.isEqual(d2, verificationType);
};

export const isDateGreater = (date1: DateInput, date2: DateInput): boolean => {
    const d1 = dateHandler(date1);
    const d2 = dateHandler(date2);

    if (!d1 || !d2) return false;

    return d1.isGreater(d2);
};

export const isDateLess = (date1: DateInput, date2: DateInput): boolean => {
    const d1 = dateHandler(date1);
    const d2 = dateHandler(date2);

    if (!d1 || !d2) return false;

    return d1.isLess(d2);
};

export const isDateGreaterOrEqual = (date1: DateInput, date2: DateInput): boolean => {
    const d1 = dateHandler(date1);
    const d2 = dateHandler(date2);

    if (!d1 || !d2) return false;

    return d1.isGreaterOrEqual(d2);
};

export const isDateLessOrEqual = (date1: DateInput, date2: DateInput): boolean => {
    const d1 = dateHandler(date1);
    const d2 = dateHandler(date2);

    if (!d1 || !d2) return false;

    return d1.isLessOrEqual(d2);
};

// Exportar por defecto
export default dateHandler;
