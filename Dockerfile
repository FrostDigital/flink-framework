FROM node:12.6.0

WORKDIR /app
COPY . ./

RUN \
    cd website \
    npm install \    
    npm run build;

CMD npm run serve