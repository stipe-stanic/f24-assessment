FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# --host flag allows Vite dev server to bind to container interfaces
CMD ["npm", "run", "dev", "--", "--host"]