# syntax=docker/dockerfile:1

FROM node:18-alpine
RUN mkdir /code
WORKDIR /code
COPY ["package.json", "package-lock.json*", "./"]
RUN npm i
COPY . .
RUN npm run build
CMD ["npm", "start"]