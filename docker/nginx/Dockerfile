FROM nginx:alpine

# Instalamos mkcert y las herramientas necesarias de NSS
RUN apk update && \
    apk add --no-cache nss-tools && \
    apk add --no-cache mkcert --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing/

# Copiamos la configuracion de Nginx
COPY default.local.conf /etc/nginx/conf.d/default.conf

# Copiamos el script de entrypoint y le damos permisos de ejecucion
COPY entrypoint.local.sh /docker-entrypoint.d/99-entrypoint.local.sh
RUN chmod +x /docker-entrypoint.d/99-entrypoint.local.sh

# Exponemos los puertos HTTP y HTTPS
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
