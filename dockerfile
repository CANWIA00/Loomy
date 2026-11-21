FROM node:20-alpine

WORKDIR /app

# Sadece backend bağımlılıkları (lock dosyasına birebir uygun, tekrar üretilebilir kurulum)
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

RUN cd backend && npm ci

# Backend kaynak kodlarını kopyala (.dockerignore node_modules/dist/.env'i dışarıda tutar)
COPY backend ./backend

# Backend build
RUN cd backend && npx prisma generate && npm run build

EXPOSE 8080

WORKDIR /app/backend
# `npm start` migrate deploy'u zaten çalıştırır; burada tekrar çağırmaya gerek yok.
CMD ["npm", "start"]
