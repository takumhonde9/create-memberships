#####################
# DEVELOPMENT BUILD #
#####################

FROM public.ecr.aws/lambda/nodejs:18 AS development
RUN npm install -g yarn
WORKDIR /app
COPY --chown=node:node ["package.json", "yarn.lock", "./"]
RUN yarn
COPY --chown=node:node . .
CMD ["yarn", "start"]

#####################
# PRODUCTION BUILD  #
#####################

FROM public.ecr.aws/lambda/nodejs:18 AS build
RUN npm install -g yarn @nestjs/cli
WORKDIR /app
COPY --chown=node:node ["package.json", "yarn.lock", "prisma", "./"]
COPY --chown=node:node --from=development /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN yarn db:generate
RUN yarn build
ENV NODE_ENV=production
RUN yarn install --frozen-lockfile --production && yarn cache clean


#####################
# PRODUCTION        #
#####################


FROM public.ecr.aws/lambda/nodejs:18 AS production
#WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
CMD [ "dist/main.handler" ]