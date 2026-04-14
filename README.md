# Promo 69 - Backend API REST

API RESTful y servicios de núcleo lógico para el procesamiento de datos, autenticación y gestión de la base de datos del proyecto Cineflix.

## Descripción

Este repositorio contiene la lógica de servidor, la arquitectura de base de datos y los servicios de integración necesarios para el funcionamiento del sistema. Está construido siguiendo principios de escalabilidad y seguridad.

## Stack Tecnológico

- **Entorno de ejecución:** Node.js
- **Framework:** Express.js (Vanilla)
- **Lenguaje:** Superset TypeScript
- **Base de Datos:** PostgreSQL
- **ORM:** Sequelize
- **Caché:** Redis
- **Seguridad:** JSON Web Tokens (JWT) y Bcrypt
- **Infraestructura:** Docker, Docker Compose y Nginx

---

# Guía de Inicio Rápido: Cineflix Backend

Este proyecto está completamente dockerizado, lo que significa que no necesitas instalar Node.js, Redis ni PostgreSQL localmente en tu máquina para correrlo (Aunque puedes hacerlo). Todo funciona dentro de contenedores.

## Requisitos Previos

Antes de empezar, asegúrate de tener en tu sistema:

1. **Docker Engine + Docker Compose** (Si usas Linux, asegúrate de haber agregado tu usuario al grupo `docker` para evitar usar `sudo`. Ejecuta: `sudo usermod -aG docker $USER` y `newgrp docker`).
2. **Git** para clonar el repositorio.
3. Un cliente de base de datos (DBeaver, pgAdmin, DataGrip, Navicat) para explorar PostgreSQL.
4. Un cliente HTTP (recomendamos Bruno) para probar los endpoints.

---

## Fase 1: Preparación del Entorno

**1. Clonar el repositorio**

```bash
git clone [https://github.com/promo-69/backend.git]|[git@github.com:promo-69/backend.git] cineflix
cd cineflix
```

**2. Configurar las Variables de Entorno**
Copia el archivo de ejemplo y crea tu propio archivo `.env` local.

```bash
cp .env.example .env
```

**MUY IMPORTANTE:** Abre tu nuevo archivo `.env` y asegúrate de que el host de la base de datos apunte al nombre del servicio de Docker, **no** a `localhost` ni a `127.0.0.1`.

- Ejemplo correcto: `<VARIABLE_DE_HOST_DE_LA_DB>=db` (o el nombre que tenga el servicio de Postgres en el archivo `.yml`).

---

## Fase 2: Levantar la Infraestructura

Nuestra configuración usa dos archivos:

- `docker-compose.yml` como base.
- `docker-compose.local.yml` para desarrollo o `docker-compose.prod.yml` para producción.

Debemos incluir ambos archivos: el **base** + el **que corresponda al entorno donde correremos**.

**1. Construir y levantar todos los contenedores por primera vez:**
Este comando descarga las imágenes, instala las dependencias (`node_modules`), genera los certificados SSL locales (solo desarrollo) y levanta los servidores en segundo plano (`-d`).

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

**2. Verificar que todo esté corriendo:**

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml ps
```

_Deberías ver los contenedores de la API, la Base de Datos, Redis y Nginx con el estado "Up"._

---

## Fase 3: Configurar la Base de Datos

Las migraciones y la carga de datos (seeders) **siempre se ejecutan dentro del contenedor de la API**, nunca en tu terminal local.

**1. Ejecutar Migraciones (Crear las tablas):**

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml exec api npx sequelize-cli db:migrate
```

**2. Ejecutar Seeders (Poblar con datos):**

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml exec api npx sequelize-cli db:seed:all
```

---

## Fase 4: Cómo probar la API

El proyecto utiliza **Nginx como Reverse Proxy**. Nginx maneja los certificados SSL (HTTPS) y redirige el tráfico de forma invisible hacia la API.

- **URL Base (Bruno):** `https://127.0.0.1/api/v1/...`
- **Importante:** No incluyas el puerto interno de la API (ej. 4000) en tu URL. Deja que Nginx escuche en el puerto estándar 443 por defecto.
- Como el certificado SSL local es autogenerado, tu navegador o cliente HTTP mostrará una advertencia de "Conexión no segura". Simplemente acepta el riesgo o deshabilita la validación SSL en tu cliente HTTP para el entorno local.

---

## Comandos del Día a Día

**Ver los logs de algún servicio en tiempo real:**

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f <nombre del servicio>
```

**Apagar todo el proyecto (Conserva los volúmenes):**

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

**Aplicar un cambio en el archivo `.env`:**

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

**Limpiar toda la caché de Redis:**

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml exec redis redis-cli FLUSHALL
```

**La Opción Nuclear (Reinicio de Cero):**
Si algo se rompe irremediablemente, este comando borra los contenedores, redes, imágenes locales y **vacía la base de datos** para empezar totalmente desde cero.

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v --rmi local
```

---

## Solución de Problemas Comunes (FAQ)

**1. permission denied while trying to connect to the docker daemon socket**

- **Solución:** Tu usuario de Linux no tiene permisos para usar Docker. Ejecuta `sudo usermod -aG docker $USER` y `newgrp docker`, vuelve a entrar e inténtalo sin `sudo`.

**2. bind: address already in use (Puerto 80 o 5432 ocupado)**

- **Solución:** Tienes un servicio corriendo nativamente en tu máquina. Detenlos ejecutando `sudo systemctl stop <nombre del servicio>`.

**3. getaddrinfo EAI_AGAIN db (Error de Sequelize al migrar)**

- **Solución:** Sequelize no encuentra el contenedor de la base de datos. Revisa tu archivo `.env` y asegúrate de que `DEFAULT_DATABASE_HOST` o `DB_POSTGRESQL_MAIN_HOST` sea exactamente el nombre del servicio de la base de datos (ej. `db`), no `localhost` ni `127.0.0.1`. Aplica los cambios con `up -d`.

**4. SSL_ERROR_RX_RECORD_TOO_LONG al hacer una petición**

- **Solución:** Estás apuntando explícitamente al puerto HTTP de la API (ej. `https://127.0.0.1:4000`). Quita el puerto de la URL (`https://127.0.0.1/`) para que la petición pase a través de Nginx (puerto 443).
