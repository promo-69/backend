export const REGEX = {
    // Al menos una letra, un número y mínimo 8 caracteres
    PASSWORD: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[a-zA-Z\d\W_]{8,20}$/,

    // Sin símbolos seguidos, empieza y termina en letra/número, 4-20 chars
    USERNAME: /^(?!.*[-_.]{2})[a-zA-Z0-9][a-zA-Z0-9-_.]{2,18}[a-zA-Z0-9]$/,

    // Email estándar
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

    // Teléfono: Opcional +, seguido de 10 a 15 números
    PHONE_NUMBER: /^\+?[0-9]{10,15}$/,

    // Documento: Ajustado para cubrir desde cédulas cortas hasta pasaportes
    DOCUMENT_NUMBER: /^(?:[a-z]{0,2}-?)[0-9]{6,12}$/i,

    // Nombres: Permite tildes, Ñ, espacios internos, pero NO espacios al inicio/final
    PERSON_NAME: /^(?! )[a-zA-ZÀ-ÿ\s']{2,48}(?<! )$/,

    // ID de DB: Entero positivo (1 a 2,147,483,647 para un INT estándar)
    DATABASE_ID: /^[1-9][0-9]{0,10}$/,

    // Fecha: Formato ISO 8601 (YYYY-MM-DD)
    DATE: /^\d{4}-\d{2}-\d{2}$/,
};
