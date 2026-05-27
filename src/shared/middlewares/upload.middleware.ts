import multer from 'multer';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '@errors';

export interface UploadConfig {
    /** Tamaño máximo por archivo en Megabytes */
    maxSizeMB: number;
    /** Lista de tipos MIME permitidos */
    allowedMimeTypes: string[];
}

export interface UploadField {
    name: string;
    maxCount?: number;
}

export class UploadMiddleware {
    private static readonly DEFAULT_CONFIG: UploadConfig = {
        maxSizeMB: 5,
        allowedMimeTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'],
    };

    private static config: UploadConfig = this.DEFAULT_CONFIG;

    /**
     * Configurar globalmente el middleware
     */
    static configure(config: Partial<UploadConfig>): void {
        this.config = { ...this.DEFAULT_CONFIG, ...config };
    }

    /**
     * Crea la instancia de multer con las validaciones dinámicas
     */
    private static createMulterInstance(options?: Partial<UploadConfig>): multer.Multer {
        const finalConfig = { ...this.config, ...options };
        const storage = multer.memoryStorage();

        return multer({
            storage,
            limits: {
                fileSize: finalConfig.maxSizeMB * 1024 * 1024, // Convertir MB a Bytes
            },
            fileFilter: (_req, file, cb) => {
                if (finalConfig.allowedMimeTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(
                        new ValidationError(
                            `Tipo de archivo no permitido. Solo se permiten: ${finalConfig.allowedMimeTypes.join(', ')}`,
                            [],
                            { code: 'INVALID_FILE_TYPE' },
                        ),
                    );
                }
            },
        });
    }

    /**
     * 1. Cargar un solo archivo
     * @param fieldName Nombre del campo en el form-data
     * @param options Opciones para sobreescribir mimes o tamaño en esta ruta específica
     */
    static single(fieldName: string, options?: Partial<UploadConfig>) {
        const upload = this.createMulterInstance(options).single(fieldName);

        return (req: Request, res: Response, next: NextFunction): void => {
            upload(req, res, (err: any) => {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return next(
                            new ValidationError(`El archivo excede el tamaño máximo permitido`, [], {
                                code: 'FILE_TOO_LARGE',
                            }),
                        );
                    }
                    return next(
                        new ValidationError(`Error al procesar el archivo: ${err.message}`, [], {
                            code: 'MULTER_ERROR',
                        }),
                    );
                } else if (err) {
                    return next(err); // Atrapa el ValidationError que lanzamos en el fileFilter
                }

                next();
            });
        };
    }

    /**
     * 2. Cargar múltiples archivos en el mismo campo
     */
    static array(fieldName: string, maxCount: number, options?: Partial<UploadConfig>) {
        const upload = this.createMulterInstance(options).array(fieldName, maxCount);

        return (req: Request, res: Response, next: NextFunction): void => {
            upload(req, res, (err: any) => {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return next(
                            new ValidationError(`Uno o más archivos exceden el tamaño máximo permitido`, [], {
                                code: 'FILE_TOO_LARGE',
                            }),
                        );
                    }
                    return next(
                        new ValidationError(`Error al procesar los archivos: ${err.message}`, [], {
                            code: 'MULTER_ERROR',
                        }),
                    );
                } else if (err) {
                    return next(err);
                }

                next();
            });
        };
    }

    /**
     * 3. Cargar múltiples archivos en campos distintos (multipart con nombres diferentes)
     * @param fields Array de UploadField — igual que multer.fields()
     * @param options Opciones para sobreescribir mimes o tamaño en esta ruta específica
     */
    static fields(fields: UploadField[], options?: Partial<UploadConfig>) {
        const upload = this.createMulterInstance(options).fields(fields);

        return (req: Request, res: Response, next: NextFunction): void => {
            upload(req, res, (err: any) => {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return next(
                            new ValidationError(`Uno o más archivos exceden el tamaño máximo permitido`, [], {
                                code: 'FILE_TOO_LARGE',
                            }),
                        );
                    }
                    return next(
                        new ValidationError(`Error al procesar los archivos: ${err.message}`, [], {
                            code: 'MULTER_ERROR',
                        }),
                    );
                } else if (err) {
                    return next(err);
                }

                next();
            });
        };
    }
}

// Exportar funciones individuales bindeando el contexto de la clase para uso directo en rutas
export const uploadSingle = UploadMiddleware.single.bind(UploadMiddleware);
export const uploadArray = UploadMiddleware.array.bind(UploadMiddleware);
export const uploadFields = UploadMiddleware.fields.bind(UploadMiddleware);

export default UploadMiddleware;
