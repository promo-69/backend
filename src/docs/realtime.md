# Realtime / WebSockets

Este proyecto usa `socket.io` para habilitar comunicación en tiempo real. Se ha elegido una estrategia de namespaces por recurso y rooms "per-resource" para mantener el diseño escalable y alineado con el dominio.

## Configuración

Las variables de entorno disponibles son:

- `REALTIME_ENABLED`: `true` para activar Socket.IO.
- `REALTIME_PATH`: ruta del socket server; por defecto `/socket.io`.
- `REALTIME_ADAPTER`: `redis` para múltiples instancias o `memory` para una sola instancia.
- `REALTIME_NAMESPACE_PREFIX`: prefijo opcional para namespaces.
- `REALTIME_PING_INTERVAL`: intervalo de ping en milisegundos.

## Autenticación

Se utiliza `socketAuth`, un middleware de autenticación para Socket.IO que valida tokens JWT en el handshake. El token puede enviarse en:

- `socket.handshake.auth.token`
- `Authorization` header con el formato `Bearer <TOKEN>`
- cookie con el nombre configurado en `JWT_COOKIE_ACCESS_NAME`

Si el token es inválido, expirado o revocado, la conexión se rechaza.

## Convenciones

- Namespace por recurso: cada dominio tiene su propio namespace.
  - Ejemplo: `/movies`, `/cinemas`, `/users`
- Room por entidad o filtro.
  - Ejemplo: `movie:123`, `cinema:456`, `user:789`

Esto permite escalar la lógica con múltiples instancias y usar Redis como adapter para sincronizar emisiones entre servidores.

## Ejemplo básico de cliente

```ts
import { io } from 'socket.io-client';

const socket = io('https://127.0.0.1', {
  path: '/socket.io',
  auth: {
    token: 'Bearer <ACCESS_TOKEN>',
  },
});

socket.on('connect', () => {
  console.log('Connected', socket.id);
});

socket.on('movie:update', (payload) => {
  console.log('Movie update', payload);
});

socket.emit('join-room', { room: 'movie:123' });
```

## Uso recomendado en el backend

- Registrar namespaces en `RealtimeService.registerNamespaceHandler(namespace, factory)`.
- Emitir eventos con `RealtimeService.emitToRoom(namespace, room, event, payload)`.
- Usar `RealtimeService.joinRoom` y `RealtimeService.leaveRoom` para gestionar suscripciones de clientes.

## Cómo funciona el provider

- `RealtimeProvider` crea un servidor `socket.io` adjunto al `http.Server` de Express.
- Si `REALTIME_ADAPTER=redis`, usa `@socket.io/redis-adapter` con los clientes `pubClient` y `subClient` de Redis.
- El provider expone el objeto `io` compartido para los servicios.
