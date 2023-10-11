# syntax=docker/dockerfile:1

FROM node:18-alpine
RUN apk add --no-cache bash
RUN wget -O /bin/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
RUN chmod +x /bin/wait-for-it.sh
RUN mkdir /code
WORKDIR /code
COPY ["package.json", "package-lock.json*", "./"]
RUN npm i
COPY . .
RUN npm run build