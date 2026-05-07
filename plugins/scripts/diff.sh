#!/usr/bin/env bash
# kubectl diff wrapper with colored output and summary.
# Read-only — shows what WOULD change, does not apply.
# Usage: ./diff.sh -f <manifest.yaml>
#        ./diff.sh -k <kustomize-dir>
#        ./diff.sh -r <release> (Helm, requires helm diff plugin)

set -euo pipefail

MODE=${1:-"-f"}
TARGET=${2:-""}

if [ -z "$TARGET" ]; then
  echo "Usage: $0 -f <manifest.yaml> | -k <kustomize-dir> | -r <helm-release>"
  exit 1
fi

case "$MODE" in
  -f)
    echo "--- kubectl diff: $TARGET ---"
    kubectl diff -f "$TARGET" && echo "No changes." || true
    ;;
  -k)
    echo "--- kubectl diff (kustomize): $TARGET ---"
    kubectl diff -k "$TARGET" && echo "No changes." || true
    ;;
  -r)
    echo "--- helm diff: $TARGET ---"
    if ! helm plugin list | grep -q diff; then
      echo "helm-diff plugin not installed. Run: helm plugin install https://github.com/databus23/helm-diff"
      exit 1
    fi
    NAMESPACE=${3:-"default"}
    helm diff upgrade "$TARGET" . -n "$NAMESPACE" 2>/dev/null || true
    ;;
  *)
    echo "Unknown mode: $MODE. Use -f, -k, or -r"
    exit 1
    ;;
esac
