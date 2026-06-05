# ==========================================
# Etapa 1: Base
# ==========================================
FROM node:22-alpine AS base
WORKDIR /app
# Variables comunes
ENV PATH /app/node_modules/.bin:$PATH

# ==========================================
# Etapa 2: Dependencies (Desarrollo/Builder)
# ==========================================
FROM base AS dependencies
COPY package*.json yarn.lock ./
# Instalamos TODO (devDependencies incluidos)
RUN yarn install --frozen-lockfile

# ==========================================
# Etapa 3: Development
# ==========================================
FROM dependencies AS development
# En desarrollo, el código fuente se monta vía volumen, pero lo copiamos igual por si acaso
COPY . .
# La variable de entorno en dev
ENV APP_ENV=development
# El puerto de dev
EXPOSE ${PORT:-4000}
CMD ["yarn", "dev"]

# ==========================================
# Etapa 4: Builder (Compilación)
# ==========================================
FROM dependencies AS builder
COPY . .
# Pasamos APP_ENV a production para optimizaciones en build (si aplica)
ENV APP_ENV=production
RUN yarn build

# ==========================================
# Etapa 5: Production
# ==========================================
FROM base AS production
ENV APP_ENV=production

COPY package*.json yarn.lock ./
# Instalamos SOLO dependencias de producción
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copiamos la build generada
COPY --from=builder /app/build ./build
COPY --from=builder /app/.sequelizerc ./.sequelizerc

EXPOSE ${PORT:-4000}
CMD ["yarn", "start"]
