#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$SCRIPT_DIR"
RELEASE_NAME="patient-care-ui-vue"
NAMESPACE="nc-k3s"

# Optional: pass an image tag as the first argument (defaults to "latest")
IMAGE_TAG="${1:-latest}"

echo "Deploying $RELEASE_NAME (image tag: $IMAGE_TAG) to namespace $NAMESPACE..."

helm upgrade --install "$RELEASE_NAME" "$CHART_DIR" \
  --namespace "$NAMESPACE" \
  --set image.tag="$IMAGE_TAG"

echo "Done. Run 'kubectl get pods -n $NAMESPACE' to check status."
