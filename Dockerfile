# Imagen de producción de la API en NestJS.

# --- Etapa de construcción ---
FROM node:20-alpine AS build
WORKDIR /app

# Corepack instala la versión de pnpm fijada en el campo packageManager de package.json
RUN npm install -g corepack@latest && corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN pnpm build

# Dependencias de producción
RUN pnpm install --frozen-lockfile --prod --config.node-linker=hoisted

# --- Etapa de producción ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 8000
CMD ["node", "dist/main"]
