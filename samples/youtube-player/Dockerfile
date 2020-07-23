FROM node:10.16-alpine
WORKDIR /opt/mre

ENV PORT=80
ENV BASE_URL=http://mre-video-player.openode.io/

COPY package*.json ./
RUN ["npm", "install", "--unsafe-perm"]

COPY tsconfig.json ./
COPY src ./src/
RUN ["npm", "run", "build-only"]

COPY public ./public/

EXPOSE 80/tcp
CMD ["npm", "start"]