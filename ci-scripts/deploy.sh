#!/bin/sh
set -e

# Fetch image
curl --location --request POST "$PORTAINER_HOST/api/endpoints/1/docker/images/create?tag=latest&fromImage=$CONTAINER_IMAGE" \
  --header "X-API-KEY:$PORTAINER_TOKEN" \
  --header 'X-Registry-Auth: eyJyZWdpc3RyeUlkIjoxfQo=' # THIS X-Registry-Auth points to the first custom registry

# Delete previous container
curl --location --request DELETE "$PORTAINER_HOST/api/endpoints/1/docker/containers/$CONTAINER_NAME?force=true" \
  --header "X-API-KEY:$PORTAINER_TOKEN"

# Create container
curl -q --location --request POST "$PORTAINER_HOST/api/endpoints/1/docker/containers/create?name=$CONTAINER_NAME" \
  --header "X-API-KEY:$PORTAINER_TOKEN" \
  --header 'Content-Type: application/json' \
  --data-raw '{
      "ExposedPorts":{"'$CONTAINER_PORT'/tcp": {}},
      "Image":"'$CONTAINER_IMAGE'",
      "Labels":{"deployed":"auto"},
      "HostConfig": {
        "PortBindings": {
          "'$CONTAINER_PORT'/tcp": [
            {
              "HostPort": "'$CONTAINER_PORT'"
            }
          ]
        }
      },
      "NetworkingConfig": {}
    }' > /dev/null 2>&1

# Connect container to network
curl -q --location --request POST "$PORTAINER_HOST/api/endpoints/1/docker/networks/$CONTAINER_NETWORK/connect" \
  --header "X-API-KEY:$PORTAINER_TOKEN" \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "Container": "'$CONTAINER_NAME'"
  }'

# Start container
curl -q --location --request POST "$PORTAINER_HOST/api/endpoints/1/docker/containers/$CONTAINER_NAME/start" \
  --header "X-API-KEY:$PORTAINER_TOKEN"

