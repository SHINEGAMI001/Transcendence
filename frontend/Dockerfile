FROM node:latest

WORKDIR /fapp

COPY package.json .

RUN npm install

COPY . .

# EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]