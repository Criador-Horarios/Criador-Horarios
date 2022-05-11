#!/bin/sh
set -e

docker login -u="${DOCKER_USERNAME}" -p="${DOCKER_PASSWORD}"

# docker pull $CONTAINER_CACHE_IMAGE

docker build -t $CONTAINER_IMAGE \
	-f $DOCKERFILE_PATH .
	# --cache-from $CONTAINER_CACHE_IMAGE \
  # --build-arg CONTAINER_CACHE_IMAGE=$CONTAINER_CACHE_IMAGE \

docker push $CONTAINER_IMAGE