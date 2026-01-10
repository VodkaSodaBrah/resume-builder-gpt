#!/bin/bash
set -e

# ==============================================================================
# Azure Resume Builder GPT - Teardown Script
# ==============================================================================
# This script removes all Azure resources for the Resume Builder app
#
# WARNING: This will permanently delete all resources and data!
#
# Usage:
#   ./scripts/azure-teardown.sh [environment]
# ==============================================================================

ENVIRONMENT="${1:-dev}"
CONFIG_FILE=".azure-config-${ENVIRONMENT}.json"

echo "=============================================="
echo "Resume Builder GPT - Teardown"
echo "=============================================="
echo "Environment: ${ENVIRONMENT}"
echo "=============================================="
echo ""
echo "WARNING: This will permanently delete all resources and data!"
echo ""

# Check if config file exists
if [ ! -f "${CONFIG_FILE}" ]; then
    echo "Error: Configuration file not found: ${CONFIG_FILE}"
    exit 1
fi

# Load configuration
RESOURCE_GROUP=$(jq -r '.resourceGroup' "${CONFIG_FILE}")

echo "This will delete the resource group: ${RESOURCE_GROUP}"
echo "All resources within will be permanently removed."
echo ""
read -p "Are you sure? Type 'DELETE' to confirm: " CONFIRM

if [ "${CONFIRM}" != "DELETE" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Deleting resource group: ${RESOURCE_GROUP}..."
az group delete \
    --name "${RESOURCE_GROUP}" \
    --yes \
    --no-wait

echo ""
echo "Resource group deletion initiated."
echo "This may take a few minutes to complete."
echo ""

# Remove config file
rm -f "${CONFIG_FILE}"
echo "Removed configuration file: ${CONFIG_FILE}"
echo ""
echo "Teardown complete."
