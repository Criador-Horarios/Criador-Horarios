FROM node:14-alpine3.15

# GENERAL ENVS #
ENV APP_PATH /project
ENV APP_BIN_PATH "$APP_PATH/bin"
ENV PATH "$PATH:$APP_BIN_PATH"
ENV HOME "$APP_PATH/docker/development/home"
ENV USER "criador"

# NODE ENVS #
ENV NODE_ENV development

WORKDIR $APP_PATH

COPY ./docker/bin/install-system-dependencies $APP_BIN_PATH/install-system-dependencies
RUN install-system-dependencies

# TODO: Container should use this user and not root
# USER criador 

ENTRYPOINT [ "docker/development/entrypoint" ]

EXPOSE 3000
