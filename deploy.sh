#!/bin/bash
set -e  # Exit on any error

# Configuration
PROJECT_NAME="dashboard"

echo "=========================================="
echo "  React Frontend Deployment Script"
echo "=========================================="
echo "Environment: $BITBUCKET_DEPLOYMENT_ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo ""

# Verify required environment variables are set
if [ -z "$AWS_ROLE_ARN" ] || [ -z "$AWS_WEB_IDENTITY_TOKEN_FILE" ] || [ -z "$AWS_REGION" ]; then
  echo "❌ Error: OIDC authentication variables not set"
  echo "Required: AWS_ROLE_ARN, AWS_WEB_IDENTITY_TOKEN_FILE, AWS_REGION"
  exit 1
fi

# Configure AWS CLI for OIDC authentication
echo "Configuring AWS CLI for OIDC authentication..."
aws configure set region $AWS_REGION
aws configure set output json

# Set up native OIDC authentication - AWS CLI will handle the role assumption automatically
echo "Setting up native OIDC authentication..."
export AWS_ROLE_SESSION_NAME="bitbucket-pipeline-${BITBUCKET_BUILD_NUMBER}"

echo "✓ OIDC authentication configured"
echo "✓ Role ARN: $AWS_ROLE_ARN"
echo "✓ Session Name: $AWS_ROLE_SESSION_NAME"

# Verify AWS configuration and get account ID
echo "Verifying assumed role credentials..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ASSUMED_ROLE=$(aws sts get-caller-identity --query Arn --output text)
echo "✓ AWS Account ID: $AWS_ACCOUNT_ID"
echo "✓ Assumed Role: $ASSUMED_ROLE"

# Get S3 bucket and CloudFront distribution ID from SSM
echo ""
echo "Fetching configuration from SSM Parameter Store..."
BUCKET_NAME=$(aws ssm get-parameter --name "/${PROJECT_NAME}/webapp/bucketName" --query 'Parameter.Value' --output text)
echo "✓ S3 Bucket: $BUCKET_NAME"

DISTRIBUTION_ID=$(aws ssm get-parameter --name "/${PROJECT_NAME}/webapp/distributionId" --query 'Parameter.Value' --output text)
echo "✓ CloudFront Distribution ID: $DISTRIBUTION_ID"

# Fetch Cognito configuration from SSM
echo ""
echo "Fetching Cognito configuration from SSM Parameter Store..."
COGNITO_ISSUER_URL=$(aws ssm get-parameter --name "/chat/shared/cognito/issuerUrl" --query 'Parameter.Value' --output text)
echo "✓ Cognito Issuer URL: $COGNITO_ISSUER_URL"

COGNITO_CLIENT_ID=$(aws ssm get-parameter --name "/chat/shared/cognito/userPoolClientId" --query 'Parameter.Value' --output text)
echo "✓ Cognito Client ID: $COGNITO_CLIENT_ID"

# Configure .env file from template
echo ""
echo "Configuring .env file from template..."
if [ ! -f ".env.template" ]; then
  echo "❌ Error: .env.template file not found"
  exit 1
fi

# Copy template to .env
cp .env.template .env
echo "✓ Copied .env.template to .env"

# Replace placeholders with actual values
sed -i "s|<VITE_ENVIRONMENT>|${BITBUCKET_DEPLOYMENT_ENVIRONMENT}|g" .env
sed -i "s|<VITE_COGNITO_ISSUER_URL>|${COGNITO_ISSUER_URL}|g" .env
sed -i "s|<VITE_COGNITO_APP_CLIENT_ID>|${COGNITO_CLIENT_ID}|g" .env
echo "✓ Environment variables configured"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm ci
echo "✓ Dependencies installed"

# Build React application
echo ""
echo "=========================================="
echo "  Building React Application"
echo "=========================================="

# Build React application
echo "Building React application..."
CI=false npm run build

echo "✓ Build completed"

# Verify build output exists
echo ""
if [ ! -d "build" ]; then
  echo "❌ Build directory 'build' not found"
  exit 1
fi
echo "✓ Build directory verified"

# Sync to S3 bucket
echo ""
echo "=========================================="
echo "  Syncing to S3"
echo "=========================================="

# Single sync: All files with NO caching (until fingerprinting is implemented)
# TODO: This is critical performance issue to fix later
# Implement cache busting via file fingerprinting and set long-term caching headers
echo "Syncing all files with no cache..."
echo "Note: This is not optimal for performance. Implement file fingerprinting for better caching."
aws s3 sync build/ s3://${BUCKET_NAME}/ \
  --delete \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "test/**" \
  --exclude "**/*.test.*"

echo ""
echo "✓ Files synced to S3"

# Create CloudFront invalidation
echo ""
echo "=========================================="
echo "  Invalidating CloudFront Cache"
echo "=========================================="

INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "✓ CloudFront invalidation created: $INVALIDATION_ID"
echo ""
echo "   View invalidation status in AWS Console:"
echo "   https://${AWS_REGION}.console.aws.amazon.com/cloudfront/v3/home#/distributions/${DISTRIBUTION_ID}"

# Summary
echo ""
echo "=========================================="
echo "  ✅ Frontend Deployment Completed!"
echo "=========================================="
echo "Environment: $BITBUCKET_DEPLOYMENT_ENVIRONMENT"
echo "S3 Bucket: $BUCKET_NAME"
echo "CloudFront Distribution: $DISTRIBUTION_ID"
echo "Region: $AWS_REGION"
echo "=========================================="