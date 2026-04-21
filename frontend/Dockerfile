FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better cache behavior.
COPY package*.json /app/
RUN npm install

# Copy frontend source.
COPY . /app

# CRA dev server host/port so it is reachable from docker-compose.
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
