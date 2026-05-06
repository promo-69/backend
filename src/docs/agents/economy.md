# Arquitectura del Motor Económico y Lógica Transaccional (Cineflix)

Este documento define las reglas estrictas de negocio para cualquier operación financiera dentro del sistema. Todo agente o desarrollador que modifique flujos de órdenes o pagos debe acatar estos lineamientos.

## 1. Reglas Financieras Base

- **Seguridad Financiera**: Nunca confíes en datos financieros (precios, tasas, montos totales) que provengan en el payload del Frontend. El Backend es la única fuente de la verdad para el cálculo monetario.
- **Ledger Inmutable**: Todas las transacciones se consolidan bajo una moneda base. La tabla `exchange_rates` funciona bajo una estrategia append-only (solo inserts, cero updates) para preservar la trazabilidad y auditoría histórica absoluta.

## 2. Motor de Cotización y Flujo en Tiempo Real

La lógica de pago y cotización opera bajo un patrón **"Time-to-Live Quote"** para asegurar los precios durante el proceso de pago del usuario.

- **Generación del Quote**: El servidor genera un `quote_id` con un TTL (Time-To-Live) almacenado en **Redis**. Este registro contiene la tasa de cambio congelada y el monto exacto a cobrar.
- **Flujo WebSocket (Real-time)**: A la par de la generación del `quote_id`, el backend debe establecer un flujo bidireccional vía WebSocket con el frontend, estrictamente atado a este ID. Este canal se utilizará para emitir actualizaciones sobre el estado de la transacción.
- **Limpieza Automática (Garbage Collection)**: El flujo WebSocket debe cerrarse y destruirse automáticamente al expirar el TTL del `quote_id` en Redis, previniendo conexiones residuales (zombies) y fugas de memoria en el servidor.

## 3. Prevención de Colisiones e Idempotencia

Se deben aplicar medidas anti-doble-gasto (Double-Spending) en dos capas de la infraestructura:

- **Capa 1 (Redis)**: Se debe verificar y actualizar atómicamente el estado del `quote_id` en Redis. Si un estado cambia a "processing", se debe bloquear cualquier petición concurrente inmediata con el mismo ID, retornando un error HTTP `409 Conflict`.
- **Capa 2 (Base de Datos)**: Se deben implementar y respetar los _Unique Constraints_ en la base de datos (por ejemplo, evitar que se asigne la misma butaca a dos facturas distintas en un mismo showtime).
