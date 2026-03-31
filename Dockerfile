FROM node:20-alpine
WORKDIR /app
# Copiamos solo los archivos de dependencias primero para usar el caché de Docker
COPY package.json yarn.lock ./
RUN yarn install
# Luego copiamos todo lo demás
COPY . .
EXPOSE 5173
# --host es obligatorio para que Vite se hable con Docker
CMD ["yarn", "dev", "--host"]