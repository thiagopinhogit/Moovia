#!/bin/bash

# Quick script to get Google Cloud OAuth2 token for testing
# This token expires in 1 hour

echo "🔐 Getting Google Cloud OAuth2 Token..."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found!"
    echo ""
    echo "Install gcloud CLI:"
    echo "  macOS: brew install google-cloud-sdk"
    echo "  Linux: https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi

# Authenticate
echo "🔑 Authenticating with Google Cloud..."
gcloud auth application-default login

# Get project ID
echo ""
echo "📋 Available projects:"
gcloud projects list

echo ""
read -p "Enter your PROJECT_ID (or press Enter to use current): " PROJECT_ID

if [ -n "$PROJECT_ID" ]; then
    gcloud config set project $PROJECT_ID
fi

# Get token
echo ""
echo "🎫 Generating access token..."
TOKEN=$(gcloud auth application-default print-access-token)

echo ""
echo "✅ Success! Your OAuth2 token:"
echo ""
echo "$TOKEN"
echo ""
echo "⚠️  This token expires in 1 hour!"
echo ""
echo "Add to your .env file:"
echo "GOOGLE_VEO_API_KEY=$TOKEN"
echo "GOOGLE_VEO_PROJECT_ID=$(gcloud config get-value project)"
echo "GOOGLE_VEO_LOCATION=us-central1"
echo ""
echo "Or run:"
echo "echo 'GOOGLE_VEO_API_KEY=$TOKEN' >> lambda/.env"
