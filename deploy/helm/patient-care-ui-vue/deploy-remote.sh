#!/usr/bin/env bash
# deploy-remote.sh — Deploy Patient Care UI via Cloudflare Tunnel (off-LAN)
# Requires remote-connect.sh to be running first.
#
# Usage:
#   ./deploy-remote.sh              # deploy with "latest" tag
#   ./deploy-remote.sh 54-1         # override image tag

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$SCRIPT_DIR"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
RELEASE_NAME="patient-care-ui-vue"
NAMESPACE="nc-k3s"

IMAGE_TAG="${1:-latest}"

# ── Load tunnel config ──────────────────────────────────────────
CONF_FILE="$REPO_ROOT/remote-tunnel.conf"
if [ ! -f "$CONF_FILE" ]; then
  echo "Error: $CONF_FILE not found."
  echo "Copy remote-tunnel.conf.example to remote-tunnel.conf and fill in your values."
  exit 1
fi
source "$CONF_FILE"

# ── Set remote kubeconfig ───────────────────────────────────────
export KUBECONFIG="$KUBECONFIG_REMOTE"

if [ ! -f "$KUBECONFIG" ]; then
  echo "Error: Remote kubeconfig not found at $KUBECONFIG"
  echo "See kubeconfig-remote.template in the repo root."
  exit 1
fi

# ── Verify tunnel is up ─────────────────────────────────────────
echo "Checking K3s connectivity via tunnel..."
if ! kubectl get nodes --request-timeout=10s > /dev/null 2>&1; then
  echo "Error: Cannot reach K3s cluster. Is remote-connect.sh running?"
  exit 1
fi
echo "  K3s cluster reachable."
echo ""

# ── Deploy ───────────────────────────────────────────────────────
echo "============================================================="
echo "BEFORE deployment (remote)"
echo "Namespace: $NAMESPACE"
echo "-------------------------------------------------------------"
kubectl get pods -n "$NAMESPACE" -o wide --no-headers 2>/dev/null | sort || echo "(no pods found or namespace empty)"
echo ""

echo "Deploying $RELEASE_NAME (image tag: $IMAGE_TAG) via tunnel..."

helm upgrade --install "$RELEASE_NAME" "$CHART_DIR" \
  --namespace "$NAMESPACE" \
  --set image.tag="$IMAGE_TAG"

echo ""
echo "Waiting 10 seconds for Kubernetes to start reconciling changes..."
sleep 10

echo ""
echo "============================================================="
echo "AFTER deployment (remote)"
echo "Namespace: $NAMESPACE"
echo "-------------------------------------------------------------"
kubectl get pods -n "$NAMESPACE" -o wide --no-headers 2>/dev/null | sort || echo "(no pods found or namespace empty)"
echo "============================================================="

echo ""
echo "Done. Compare the two lists above."
echo "Tip: run 'kubectl --kubeconfig $KUBECONFIG get pods -n $NAMESPACE -w' to watch live updates."
echo "UI: $CF_HOSTNAME_UI"
