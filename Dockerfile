FROM node:15.4.0

WORKDIR /app
COPY . ./

WORKDIR /app/website

RUN \
    npm install \    
    npm run build;

CMD npm run serve