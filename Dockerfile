FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8081

CMD ["npx", "react-native", "start", "--host", "0.0.0.0"]