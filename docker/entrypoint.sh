#!/bin/sh
# Entrypoint de Cartelera (se ejecuta como usuario no privilegiado "node").
# Comprueba que el volumen de datos sea escribible y prepara los subdirectorios.
set -eu

DATA_DIR="${DATA_DIR:-/data}"

if [ ! -w "$DATA_DIR" ]; then
  echo "ERROR: el directorio de datos ($DATA_DIR) no es escribible por el usuario $(id -u):$(id -g)." >&2
  echo "Si montaste una carpeta del host (bind mount), ajusta su propietario:" >&2
  echo "  sudo chown -R 1000:1000 <carpeta>" >&2
  exit 1
fi

mkdir -p "$DATA_DIR/media"

exec "$@"
