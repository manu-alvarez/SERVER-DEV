# UIEP Execution Sandbox (Misión 14) — runtime aislado de artefactos.
#
# Intérprete SIN dependencias npm (node:http/node:crypto): imagen mínima,
# sin build, sin volúmenes, read-only, sin caps, red interna sin salida.
# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /srv
COPY sandbox/server.mjs /srv/server.mjs

# Usuario no privilegiado (node existe en la imagen alpine)
USER node

EXPOSE 4100
CMD ["node", "/srv/server.mjs"]
