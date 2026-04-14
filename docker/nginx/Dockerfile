FROM nginx:alpine

# Conf default para producción como baseline en la imagen (sin SSL, solo redirección API)
# Removemos configuraciones por defecto
RUN rm /etc/nginx/conf.d/default.conf
COPY default.prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]