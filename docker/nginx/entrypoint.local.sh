#!/bin/sh
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/localhost.pem"
KEY_FILE="$CERT_DIR/localhost-key.pem"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "================================================="
    echo "Certificados SSL no encontrados."
    echo "Instalando dependencias mkcert (SOLO DEV)..."
    echo "================================================="
    
    # Instalamos mkcert y dependencias solo en entorno local y solo si faltan certs
    apk update && apk add --no-cache nss-tools mkcert --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing/

    mkdir -p "$CERT_DIR"
    
    echo "Generando certificados con mkcert..."
    mkcert -install
    mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" localhost 127.0.0.1 ::1
    
    echo "Certificados locales generados exitosamente."
else
    echo "Certificados SSL locales ya existen. Saltando generación."
fi

# Exit 0 para permitir que el script principal continúe
exit 0
