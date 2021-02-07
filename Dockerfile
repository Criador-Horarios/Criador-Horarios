FROM node:12-alpine

WORKDIR /app
COPY package.json /app/package.json

RUN npm install --only=prod

COPY . /app

RUN npm run build

EXPOSE 5000
CMD ["npm", "run", "run-prod"]