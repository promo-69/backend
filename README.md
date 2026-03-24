# Promo 69 - Backend API REST

API RESTful y servicios de núcleo lógico para el procesamiento de datos, autenticación y gestión de base de datos del proyecto.

## Descripción
Este repositorio contiene la lógica de servidor, la arquitectura de base de datos y los servicios de integración necesarios para el funcionamiento del sistema. Está construido siguiendo principios de escalabilidad y seguridad.

## Stack Tecnológico
* **Entorno de ejecución:** Node.js
* **Framework:** Express.js
* **Lenguaje:** TypeScript
* **Base de Datos:** PostgreSQL
* **ORM:** Sequelize
* **Seguridad:** JSON Web Tokens (JWT) y Bcrypt

## Requisitos Previos
Antes de iniciar el proyecto, asegúrese de tener instalado:
* Node.js (Versión LTS recomendada)
* Gestor de paquetes yarn
* PostgreSQL

## Instalación

1. Clonar el repositorio:
   ``git clone <[https://github.com/promo-69/backend.git]|[git@github.com:promo-69/backend.git]>``

2. Instalar dependencias:
   ``yarn install``

3. Configurar variables de entorno:
   Crear un archivo *.env* en la raíz del proyecto basándose en el archivo *.env.example*.

4. Ejecutar migraciones de base de datos:
   ``npx sequelize-cli db:migrate``

## Scripts Comunes

* `yarn dev`: Inicia el servidor en modo desarrollo con recarga automática.
* `yarn start`: Inicia el servidor en modo producción.
* `yarn test`: Ejecuta las pruebas unitarias y de integración.