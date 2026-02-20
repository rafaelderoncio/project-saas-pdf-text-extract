FROM node:22-alpine AS build
WORKDIR /app

COPY app/scan-flow/package*.json ./
RUN npm ci

COPY app/scan-flow/ ./
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 4000
CMD ["node", "dist/scan-flow/server/server.mjs"]
