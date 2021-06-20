FROM node:12.6.0

WORKDIR /app
COPY . ./

RUN \
    npm install; \    
    npm run build;

CMD npm run serve