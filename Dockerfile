FROM node:14.15.4-alpine

WORKDIR /bot

RUN npm install -g npm@7.3.0

COPY package*.json ./

RUN npm ci --silent

COPY . .

RUN npm run build \
  && npm prune --production \
  && npm cache clean --force

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

CMD ["node", "build/index.js"]
