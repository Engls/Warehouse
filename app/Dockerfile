FROM node:18-alpine

WORKDIR /usr/src/app

# Копируем package.json из папки src (так как он там находится)
COPY src/package.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем остальной код
COPY src/ ./src/

EXPOSE 3000

CMD ["node", "src/server.js"]