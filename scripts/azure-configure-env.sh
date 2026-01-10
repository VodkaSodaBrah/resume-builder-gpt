#!/bin/bash
set -e

# ==============================================================================
# Azure Resume Builder GPT - Environment Configuration Script
# ==============================================================================
# This script configures environment variables for the Static Web App
#
# Usage:
#   ./scripts/azure-configure-env.sh [environment]
# ==============================================================================

ENVIRONMENT="${1:-dev}"
CONFIG_FILE=".azure-config-${ENVIRONMENT}.json"

echo "=============================================="
echo "Resume Builder GPT - Configure Environment"
echo "=============================================="
echo ""

# Check if config file exists
if [ ! -f "${CONFIG_FILE}" ]; then
    echo "Error: Configuration file not found: ${CONFIG_FILE}"
    echo "Run ./scripts/azure-setup.sh ${ENVIRONMENT} first."
    exit 1
fi

# Load configuration
RESOURCE_GROUP=$(jq -r '.resourceGroup' "${CONFIG_FILE}")
STATIC_WEB_APP=$(jq -r '.staticWebApp' "${CONFIG_FILE}")
STORAGE_CONNECTION_STRING=$(jq -r '.storageConnectionString' "${CONFIG_FILE}")

# Prompt for secrets
echo "Enter the following values (or press Enter to skip):"
echo ""

read -p "JWT_SECRET (required for auth): " JWT_SECRET
read -p "OPENAI_API_KEY (required for AI features): " OPENAI_API_KEY
read -p "SENDGRID_API_KEY (optional, for email): " SENDGRID_API_KEY
read -p "APP_URL (leave blank for auto-detect): " APP_URL

# Get app URL if not provided
if [ -z "${APP_URL}" ]; then
    APP_URL="https://$(az staticwebapp show \
        --name "${STATIC_WEB_APP}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query "defaultHostname" \
        --output tsv)"
fi

echo ""
echo "Configuring environment variables..."

# Set application settings
az staticwebapp appsettings set \
    --name "${STATIC_WEB_APP}" \
    --resource-group "${RESOURCE_GROUP}" \
    --setting-names \
        "AZURE_STORAGE_CONNECTION_STRING=${STORAGE_CONNECTION_STRING}" \
        "JWT_SECRET=${JWT_SECRET}" \
        "JWT_EXPIRES_IN=7d" \
        "OPENAI_API_KEY=${OPENAI_API_KEY}" \
        "SENDGRID_API_KEY=${SENDGRID_API_KEY}" \
        "APP_URL=${APP_URL}" \
    --output none

echo ""
echo "=============================================="
echo "Configuration Complete!"
echo "=============================================="
echo ""
echo "Environment variables have been set for: ${STATIC_WEB_APP}"
echo "App URL: ${APP_URL}"
echo ""
