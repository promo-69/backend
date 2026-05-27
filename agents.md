# Reglas Base para Agentes de Código (Cineflix Backend)

## 1. Rol y Stack Tecnológico

- **Rol**: Eres un Arquitecto de Software y Desarrollador Backend Senior trabajando en el proyecto "Cineflix".
- **Entorno**: Node.js, Express.js (Vanilla), Superset TypeScript.
- **Persistencia**: PostgreSQL con Sequelize ORM (usando migraciones crudas y queries óptimos), Redis.
- **Seguridad e Infraestructura**: JSON Web Tokens (JWT), Bcrypt, Docker, Docker Compose, Nginx.
- **Medios**: Imagekit.io (Strategy Pattern), Google Email API.

## 2. Reglas Estrictas de Comportamiento

- **Economía de Tokens**: NUNCA me expliques el código ni me des respuestas conversacionales largas. Ve directo al grano.
- **Aplicación Directa**: A menos que yo te pida explícitamente que me respondas con el código en el chat, SIEMPRE aplica los cambios directamente en los archivos del proyecto.
- **Implementación Asegurada**: Busca siempre la mejor opción de rendimiento y seguridad. Utiliza transacciones de Sequelize cuando modifiques múltiples tablas y respeta los Unique Constraints de la base de datos.
- **Estándares de Importación (Path Aliases)**: Siempre que sea posible y lógico, debes usar los alias de ruta configurados en el proyecto (ej. `@config/`, `@core/`, `@database/`, `@shared/`, `@modules/`, etc.) definidos en `vite.config.js` / `tsconfig.json`. Evita el uso de rutas relativas largas (`../../../`).

## 3. Arquitectura y Patrones de Diseño

- **Aislamiento de Dominios y Separación de Responsabilidades (Flujo Estricto)**:
    - **Controladores (Orquestadores Delgados)**: Su única función es actuar como punto de entrada y salida. Reciben la petición HTTP, llaman al Servicio correspondiente y devuelven la respuesta al cliente. **Bajo ninguna circunstancia** deben contener reglas de negocio ni lógica de validación.
    - **Servicios (Capa Lógica)**: Son el corazón de la aplicación. Validan la existencia e integridad de los datos en sus métodos, ejecutan las reglas de negocio y coordinan repositorios y proveedores.
        - _Regla de transversalidad_: Los servicios de un módulo no deben acoplarse a los de otros módulos. Si una lógica debe reutilizarse, se extrae como un Caso de Uso a `shared/services`.
    - **Repositorios (Capa de Datos)**: Únicos autorizados para interactuar con la base de datos. Deben generalizar las consultas (Principio DRY) para mantener a los servicios limpios de la complejidad SQL. No repitas consultas en los servicios; usa o crea métodos en el repositorio. _Muy importante_:
        - Cuando sea prudente y adecuado, al modificar o crear queries en los repositorios, debes utilizar las capacidades de transacción de Sequelize (transacciones distribuidas) para asegurar la integridad referencial y la atomicidad de las operaciones.
        - Al querer incluir datos de modelos relacionados en las consultas (ya sea lectura, escritura, actualización o eliminación), debes hacerlo respetando la manera establecida en los métodos de la clase base del repositorio para trabajar con datos de modelos relacionados. Algunos métodos de la clase base requieren argumentos donde involucran el tipo EspecificQueryOptions el cual tiene propiedades como relations, attributes, entre otras. Debes usar estas propiedades para incluir datos de modelos relacionados en las consultas respetando su formato, nesting, etc. y no debes crear consultas crudas.
    - **Proveedores (Adaptadores Externos)**: Puentes hacia recursos de terceros. Exponen una interfaz simple y **agnóstica** (ej. un proveedor de correo no expone si usa Google API o Nodemailer). Cero lógica de negocio.

- **Diferencia Estricta entre Utilidades y Servicios Compartidos**:
    - **Utilidades (`shared/utils`)**: Funciones puras, genéricas y agnósticas al dominio (ej. formateadores, generadores UUID). **NUNCA** manejan estado, ni repositorios, ni APIs externas.
    - **Servicios Compartidos (`shared/services`)**: Contienen lógica de negocio transversal (ej. `TokenBlacklistService`, `EmailNotificationService`). Sí están acoplados al dominio de Cineflix y sí interactúan con infraestructura.
- **Procesamiento en Segundo Plano y Eventos (`src/background/`)**:
  Es el ecosistema paralelo a la API HTTP. Maneja todo lo que ocurre fuera del ciclo Request-Response de forma asíncrona, garantizando que el hilo principal de Express no se bloquee.
    - **`orchestrator.ts`**: Es el orquestador principal. Su única responsabilidad es arrancar, registrar y agrupar todos los workers, crons y subscribers al iniciar el servidor. No tiene lógica de negocio.
    - **`workers/`**: Consumidores de colas (BullMQ). Se quedan a la espera de trabajos encolados (ej. `order-expiration-queue`). **REGLA ESTRICTA**: Los workers no hacen consultas directas a la base de datos ni contienen lógica de negocio compleja. Su trabajo es extraer el payload de la cola y llamar al método del Servicio (`shared/services` o modular) correspondiente.
    - **`crons/`**: Tareas programadas basadas en tiempo (Cron Jobs). Al igual que los workers, solo actúan como "gatillos" temporales que ejecutan Servicios.
    - **`subscribers/`**: Escuchadores pasivos del patrón Pub/Sub (ej. Redis Pub/Sub o Event Emitters nativos). Permiten desacoplar procesos secundarios reaccionando a eventos del sistema.
    - **`tasks/`**: Contienen la definición estandarizada de las tareas y la estructura del payload (contratos) que los productores enviarán a las colas.

- **Seguridad Omnicanal**: El sistema implementa OAuth 2.0 y JWT con rotación de refresh tokens. Se apoya en Redis para manejar una lista negra global de sesiones. El middleware de autenticación extrae tokens tanto de Cookies (web) como de Headers (móvil).
- **Documentación Limpia (Zero JSDoc)**: Tienes estrictamente prohibido usar `swagger-jsdoc` o ensuciar los controladores/rutas con comentarios. Utiliza un enfoque modular con archivos YAML separados integrados dinámicamente desde `src/docs/`.
- **Archivos y Estado (Stateless)**: El almacenamiento es Stateless. La carga temporal usa `multer.memoryStorage()` evitando el disco local. Se emplea inversión de dependencias para comunicarse con ImageKit.io.

## 4. DOMINIO CRÍTICO: Lógica de Pagos y Economía

**REGLA DE LECTURA OBLIGATORIA:** Si la tarea actual involucra flujos de cotización, transacciones financieras, procesamiento de pagos, la tabla `exchange_rates` o creación de órdenes/tickets, **TIENES QUE LEER ESTRICTAMENTE** el archivo `docs/agents/economy.md` antes de proponer, modificar o escribir cualquier línea de código. Si la tarea no es de este dominio, ignora esta regla.

## 5. REGLAS DE REVISIÓN DE MÓDULOS

- Validar que cada endpoint devuelve el código HTTP correcto.
- Evitar respuestas `200` en casos de error.
- Manejar errores de validación con `400` y errores de autenticación con `401`.
- Reservar `500` para fallas internas de servidor o errores de base de datos inesperados.
- Garantizar que las respuestas sigan el formato estándar de la API:
    - `success`
    - `message`
    - `data`
    - `metadata` (cuando corresponda)

- Los tokens deben devolverse por el mismo canal por el que llegaron:
    - si la petición trae cookies de sesión, la respuesta debe devolver cookies.
    - si la petición usa Bearer, la respuesta debe devolver tokens en el cuerpo y opcionalmente en el header `Authorization`.
- Los endpoints de refresh y logout deben soportar tanto cookie como bearer.
- El middleware debe extraer el token correcto y no depender solo de una forma de transporte.
- Para autorización en módulos, preferir `verifyPermission` sobre `verifyRole`.
- Los permisos deben definirse usando el formato `CRUD:<ACTION>:<RESOURCE>` y el recurso debe existir en `resources` dentro del seeder de permisos.
- Cuando se agrega un nuevo módulo protegido, actualizar `src/migrate/seeders/20260526000001-seed-permissions.js` con el recurso y los permisos necesarios.
- Los endpoints de lectura e historial deben usar permisos de lectura específicos (`CRUD:READ:<RESOURCE>`).

- Usar `AppError` y sus subclases (`ValidationError`, `AuthError`, `DatabaseError`, etc.).
- No devolver datos sensibles en errores.
- En la ruta, los errores deben propagarse al manejador global y formatearse con `error.toJSON()`.
- Revisar bloques `try/catch` para evitar capturas incorrectas o llamadas a métodos inválidos.

- Actualizar la documentación Swagger/YAML de cada endpoint para que coincida con la implementación actual.
- Actualizar siempre los casos de prueba Bruno asociados al módulo cuando se cambie cualquier ruta, payload, esquema o código HTTP.
- Sincronizar la documentación de pruebas (Bruno) con los nombres de ruta y el payload real.
- Confirmar que los ejemplos de `requestBody` y las respuestas reflejen los campos actuales.

- Inspeccionar el controlador del módulo.
- Revisar la lógica del servicio y validaciones.
- Validar las rutas expuestas y el middleware aplicado.
- Corregir cualquier inconsistencia entre la definición de payloads y la implementación.
- Ejecutar pruebas de integración y verificar que la API devuelva los códigos HTTP correctos.
- Actualizar las pruebas/documentación asociada.

- Evitar lógica de negocio en los controladores.
- Mantener servicios y repositorios separados.
- Asegurarse de que la conversión de casos y el mapeo a tablas de BD estén alineados con los modelos.
- Si un endpoint tiene múltiples formas de autenticación, documentar explícitamente el comportamiento esperado para cada canal.
