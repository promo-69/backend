import { type NextFunction as ExpressNextFunction } from 'express';
import { type PaginationMetadata, type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type JWTPayload } from '@utils/jwt.util.js';

/**
 * Datos comunes para todas las solicitudes
 */
export interface RequestContext {
    requestId?: string;
    userId?: string;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
}

/**
 * Opciones para enviar respuestas
 */
export interface ResponseOptions {
    message?: string;
    statusCode?: number;
    metadata?: PaginationMetadata;
}

/**
 * Tipos para el payload del token de sesión
 */

export interface UserSession {
    userId: string;
    cinemaId?: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    permissions?: string[];
    roleCode?: string;
    roleDesc?: string;
    email?: string;
    personalEmail?: string;
    phoneNumber?: string;
    // Customer-only fields
    // FIX #4.4: customerId (customers.id) distinto de userId (users.id)
    customerId?: number;
    loyaltyLevelId?: number;
    loyaltyLevelName?: string;
    loyaltyPoints?: number;
    hasFavoriteGenres?: boolean | null;
}

/**
 * Extensión de tipos de Express para nuestra API
 * Esto permite TypeScript reconocer nuestras propiedades personalizadas
 */
declare global {
    namespace Express {
        // Extender la interfaz Request original
        interface Request {
            /**
             * Filtros de query procesados
             * Se agrega automáticamente por ControllerBase
             */
            filters?: ProcessedQueryFilters | null;

            /**
             * Contexto de la solicitud
             */
            context?: RequestContext;

            /**
             * Usuario autenticado (si aplica)
             */
            session?: UserSession;

            /**
             * Token de acceso
             */
            token?: string;
        }

        // Extender la interfaz Response original
        interface Response {
            /**
             * Método para enviar respuestas formateadas
             * Se agrega automáticamente y ControllerBase maneja todo internamente
             */
            sendResult?: (
                data?: any,
                options?: ResponseOptions & {
                    prevCallback?: () => void;
                    nextCallback?: () => void;
                },
            ) => void;

            /**
             * Método alternativo para respuestas exitosas
             * Mantenido para compatibilidad pero ControllerBase usa métodos internos
             */
            sendSuccess?: <T = any>(
                data: T,
                message?: string,
                statusCode?: number,
                metadata?: PaginationMetadata,
            ) => void;
        }

        // Extender la interfaz Locals original
        interface Locals {
            /**
             * Datos locales específicos de la aplicación
             */
            requestStartTime?: number;
            cacheKey?: string;
            [key: string]: any;
        }

        type NextFunction = ExpressNextFunction;
    }
}

/**
 * Tipo para funciones asíncronas de controlador
 */
export type ControllerHandler = (
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction,
) => Promise<any> | any;

/**
 * Tipo para funciones de middleware
 */
export type MiddlewareHandler = (
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction,
) => void | Promise<void>;
