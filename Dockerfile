FROM node:16.13.0-alpine

WORKDIR /bot

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build \
  && npm prune --production \
  && npm cache clean --force

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

CMD ["npm", "start"]
