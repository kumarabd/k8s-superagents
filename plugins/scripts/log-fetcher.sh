#!/usr/bin/env bash
# Fetch and filter pod/container logs. Read-only.
# Usage: ./log-fetcher.sh <pod> <namespace> [options]
#
# Options:
#   --previous     fetch logs from the previous container instance
#   --tail N       last N lines (default: 100)
#   --grep PATTERN filter lines matching pattern

set -euo pipefail

POD=${1:-""}
NAMESPACE=${2:-"default"}
PREVIOUS=""
TAIL=100
GREP_PATTERN=""

shift 2 2>/dev/null || true

while [[ $# -gt 0 ]]; do
  case $1 in
    --previous) PREVIOUS="--previous"; shift ;;
    --tail) TAIL="$2"; shift 2 ;;
    --grep) GREP_PATTERN="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$POD" ]; then
  echo "Usage: $0 <pod> <namespace> [--previous] [--tail N] [--grep PATTERN]"
  exit 1
fi

CMD="kubectl logs $POD -n $NAMESPACE --tail=$TAIL $PREVIOUS"

if [ -n "$GREP_PATTERN" ]; then
  eval "$CMD" | grep -i "$GREP_PATTERN"
else
  eval "$CMD"
fi
