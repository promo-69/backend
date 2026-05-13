#!/bin/sh
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/localhost.pem"
KEY_FILE="$CERT_DIR/localhost-key.pem"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "================================================="
    echo "Certificados SSL no encontrados."
    echo "Generando certificados locales con mkcert..."
    echo "================================================="

    mkdir -p "$CERT_DIR"

    mkcert -install
    mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" localhost 127.0.0.1 ::1

    echo "Certificados locales generados exitosamente."
else
    echo "Certificados SSL locales ya existen. Saltando generacion."
fi

exit 0
