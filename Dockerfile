FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install --prefix backend && npm install --prefix frontend

COPY backend ./backend
COPY frontend ./frontend

RUN npm run build --prefix frontend

ENV NODE_ENV=production
ENV PORT=5000
ENV UPLOAD_DIR=/app/backend/uploads

RUN mkdir -p /app/backend/uploads

EXPOSE 5000

CMD ["npm", "start", "--prefix", "backend"]
