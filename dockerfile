FROM node:20-alpine

WORKDIR /app

# Sadece backend bağımlılıkları
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

RUN cd backend && npm install

# Backend kaynak kodlarını kopyala
COPY backend ./backend

# Backend build
RUN cd backend && npx prisma generate && npm run build

EXPOSE 8080

WORKDIR /app/backend
CMD ["npm", "start"]