FROM node:latest

WORKDIR /fapp

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Build production bundle
RUN npm run build

# Keep container running (Nginx serves dist in production)
CMD ["sleep", "infinity"]