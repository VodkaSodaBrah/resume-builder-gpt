#!/bin/bash
set -e

# ==============================================================================
# Azure Resume Builder GPT - Infrastructure Setup Script
# ==============================================================================
# This script creates all required Azure resources for the Resume Builder app
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - jq installed for JSON parsing
#
# Usage:
#   ./scripts/azure-setup.sh [environment]
#
#   environment: dev, staging, or prod (default: dev)
#
# Example:
#   ./scripts/azure-setup.sh prod
# ==============================================================================

# Configuration
ENVIRONMENT="${1:-dev}"
APP_NAME="resumebuilder"
LOCATION="eastus"

# Derived names
RESOURCE_GROUP="rg-${APP_NAME}-${ENVIRONMENT}"
STORAGE_ACCOUNT="st${APP_NAME}${ENVIRONMENT}"
STATIC_WEB_APP="swa-${APP_NAME}-${ENVIRONMENT}"
FUNCTION_APP="func-${APP_NAME}-${ENVIRONMENT}"

echo "=============================================="
echo "Resume Builder GPT - Azure Setup"
echo "=============================================="
echo "Environment: ${ENVIRONMENT}"
echo "Resource Group: ${RESOURCE_GROUP}"
echo "Location: ${LOCATION}"
echo "=============================================="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Error: Not logged into Azure CLI. Please run 'az login' first."
    exit 1
fi

echo "Step 1: Creating Resource Group..."
az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --output none

echo "  Created: ${RESOURCE_GROUP}"

echo ""
echo "Step 2: Creating Storage Account..."
# Storage account names must be lowercase and 3-24 characters
STORAGE_ACCOUNT_CLEAN=$(echo "${STORAGE_ACCOUNT}" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9' | cut -c1-24)

az storage account create \
    --name "${STORAGE_ACCOUNT_CLEAN}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --output none

echo "  Created: ${STORAGE_ACCOUNT_CLEAN}"

# Get storage connection string
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name "${STORAGE_ACCOUNT_CLEAN}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query connectionString \
    --output tsv)

echo ""
echo "Step 3: Creating Storage Tables..."
# Create required tables
for TABLE in users sessions resumes analytics; do
    az storage table create \
        --name "${TABLE}" \
        --account-name "${STORAGE_ACCOUNT_CLEAN}" \
        --output none 2>/dev/null || true
    echo "  Created table: ${TABLE}"
done

echo ""
echo "Step 4: Creating Static Web App..."
az staticwebapp create \
    --name "${STATIC_WEB_APP}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --sku Free \
    --output none

# Get deployment token
SWA_TOKEN=$(az staticwebapp secrets list \
    --name "${STATIC_WEB_APP}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query "properties.apiKey" \
    --output tsv)

echo "  Created: ${STATIC_WEB_APP}"

echo ""
echo "Step 5: Configuring Static Web App Settings..."
# Note: App settings for SWA are configured in the portal or via staticwebapp.config.json
# The API settings come from the linked Azure Functions or can be set via:
# az staticwebapp appsettings set ...

echo ""
echo "=============================================="
echo "Setup Complete!"
echo "=============================================="
echo ""
echo "Resources Created:"
echo "  - Resource Group: ${RESOURCE_GROUP}"
echo "  - Storage Account: ${STORAGE_ACCOUNT_CLEAN}"
echo "  - Static Web App: ${STATIC_WEB_APP}"
echo ""
echo "=============================================="
echo "IMPORTANT: Save these values!"
echo "=============================================="
echo ""
echo "Storage Connection String:"
echo "  ${STORAGE_CONNECTION_STRING}"
echo ""
echo "Static Web App Deployment Token:"
echo "  ${SWA_TOKEN}"
echo ""
echo "=============================================="
echo "Next Steps:"
echo "=============================================="
echo "1. Add the deployment token to GitHub Secrets:"
echo "   Name: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "   Value: (the token above)"
echo ""
echo "2. Configure environment variables in Azure Portal:"
echo "   - JWT_SECRET (generate a secure random string)"
echo "   - OPENAI_API_KEY (your OpenAI API key)"
echo "   - AZURE_STORAGE_CONNECTION_STRING (connection string above)"
echo "   - SENDGRID_API_KEY (for email verification)"
echo "   - APP_URL (your Static Web App URL)"
echo ""
echo "3. Push code to GitHub to trigger deployment:"
echo "   git push origin main"
echo ""

# Save configuration to file
CONFIG_FILE=".azure-config-${ENVIRONMENT}.json"
cat > "${CONFIG_FILE}" << EOF
{
  "environment": "${ENVIRONMENT}",
  "resourceGroup": "${RESOURCE_GROUP}",
  "location": "${LOCATION}",
  "storageAccount": "${STORAGE_ACCOUNT_CLEAN}",
  "staticWebApp": "${STATIC_WEB_APP}",
  "storageConnectionString": "${STORAGE_CONNECTION_STRING}",
  "deploymentToken": "${SWA_TOKEN}"
}
EOF

echo "Configuration saved to: ${CONFIG_FILE}"
echo "(Add this file to .gitignore - it contains sensitive data)"
