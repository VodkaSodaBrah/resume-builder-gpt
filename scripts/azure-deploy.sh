#!/bin/bash
set -e

# ==============================================================================
# Azure Resume Builder GPT - Deployment Script
# ==============================================================================
# This script builds and deploys the application to Azure Static Web Apps
#
# Prerequisites:
#   - Azure CLI installed and logged in
#   - Node.js and npm installed
#   - SWA CLI installed (npm install -g @azure/static-web-apps-cli)
#
# Usage:
#   ./scripts/azure-deploy.sh [environment]
# ==============================================================================

ENVIRONMENT="${1:-dev}"
CONFIG_FILE=".azure-config-${ENVIRONMENT}.json"

echo "=============================================="
echo "Resume Builder GPT - Deployment"
echo "=============================================="
echo "Environment: ${ENVIRONMENT}"
echo "=============================================="
echo ""

# Check if config file exists
if [ ! -f "${CONFIG_FILE}" ]; then
    echo "Error: Configuration file not found: ${CONFIG_FILE}"
    echo "Run ./scripts/azure-setup.sh ${ENVIRONMENT} first."
    exit 1
fi

# Load configuration
STATIC_WEB_APP=$(jq -r '.staticWebApp' "${CONFIG_FILE}")
DEPLOYMENT_TOKEN=$(jq -r '.deploymentToken' "${CONFIG_FILE}")

echo "Step 1: Installing dependencies..."
npm ci
cd api && npm ci && cd ..

echo ""
echo "Step 2: Building application..."
npm run build:all

echo ""
echo "Step 3: Deploying to Azure Static Web Apps..."
npx swa deploy ./dist \
    --deployment-token "${DEPLOYMENT_TOKEN}" \
    --api-location ./api \
    --env production

echo ""
echo "=============================================="
echo "Deployment Complete!"
echo "=============================================="
echo ""
echo "Your app is now live at:"
az staticwebapp show \
    --name "${STATIC_WEB_APP}" \
    --query "defaultHostname" \
    --output tsv | xargs -I {} echo "  https://{}"
echo ""
