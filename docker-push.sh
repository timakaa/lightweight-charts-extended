#!/bin/bash

# Set variables
DOCKER_USERNAME=timakaa
BACKEND_IMAGE_NAME=lightweight-charts-extended-backend
FRONTEND_IMAGE_NAME=lightweight-charts-extended-frontend
VERSION=$(git describe --tags --always --dirty)

# Login to Docker Hub
echo "Logging in to Docker Hub..."
docker login

# Build and push backend
echo "Building backend image..."
docker build -t $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:latest -t $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$VERSION ./backend
echo "Pushing backend image..."
docker push $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:latest
docker push $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$VERSION

# Build and push frontend
echo "Building frontend image..."
docker build -t $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:latest -t $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$VERSION ./client
echo "Pushing frontend image..."
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:latest
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$VERSION

echo "Done! Images have been pushed to Docker Hub" 