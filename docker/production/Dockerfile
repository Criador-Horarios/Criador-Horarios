ARG CONTAINER_CACHE_IMAGE
FROM $CONTAINER_CACHE_IMAGE AS cache

FROM arm32v7/node:lts-alpine

ENV APP_PATH "/project"

WORKDIR $APP_PATH

RUN yarn config set network-timeout 300000

COPY --from=cache $APP_PATH/node_modules $APP_PATH/node_modules
COPY package.json yarn.lock $APP_PATH/
RUN yarn install --production --frozen-lockfile

COPY . $APP_PATH
RUN yarn build

CMD [ "yarn", "run", "run-prod" ]