#!/bin/sh
set -e

docker login -u="${DOCKER_USERNAME}" -p="${DOCKER_PASSWORD}"

docker tag $CONTAINER_IMAGE $CONTAINER_CACHE_IMAGE

docker push $CONTAINER_CACHE_IMAGE
