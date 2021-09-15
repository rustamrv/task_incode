FROM node:12
# создание директории приложения
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app/

# установка зависимостей
# символ астериск ("*") используется для того чтобы по возможности
# скопировать оба файла: package.json и package-lock.json
COPY package*.json ./

RUN npm install

COPY . /usr/src/app/

# EXPOSE 8080
CMD [ "node", "src/index.js"] 