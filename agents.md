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

- **Seguridad Omnicanal**: El sistema implementa OAuth 2.0 y JWT con rotación de refresh tokens. Se apoya en Redis para manejar una lista negra global de sesiones. El middleware de autenticación extrae tokens tanto de Cookies (web) como de Headers (móvil).
- **Documentación Limpia (Zero JSDoc)**: Tienes estrictamente prohibido usar `swagger-jsdoc` o ensuciar los controladores/rutas con comentarios. Utiliza un enfoque modular con archivos YAML separados integrados dinámicamente desde `src/docs/`.
- **Archivos y Estado (Stateless)**: El almacenamiento es Stateless. La carga temporal usa `multer.memoryStorage()` evitando el disco local. Se emplea inversión de dependencias para comunicarse con ImageKit.io.

## 4. DOMINIO CRÍTICO: Lógica de Pagos y Economía

**REGLA DE LECTURA OBLIGATORIA:** Si la tarea actual involucra flujos de cotización, transacciones financieras, procesamiento de pagos, la tabla `exchange_rates` o creación de órdenes/tickets, **TIENES QUE LEER ESTRICTAMENTE** el archivo `docs/agents/economy.md` antes de proponer, modificar o escribir cualquier línea de código. Si la tarea no es de este dominio, ignora esta regla.
