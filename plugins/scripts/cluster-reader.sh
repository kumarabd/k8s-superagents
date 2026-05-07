#!/usr/bin/env bash
# Read-only cluster inspection. No mutations.
# Usage: ./cluster-reader.sh <command> [args]
#
# Commands:
#   nodes              — list all nodes with status and version
#   pods [namespace]   — list all pods (or pods in a namespace)
#   top-pods           — resource usage sorted by memory
#   top-nodes          — node resource usage
#   events [namespace] — recent warning events
#   hpa                — all HPAs with current/target replicas
#   pvc                — all PVCs with status
#   endpoints          — all services and their endpoint counts

set -euo pipefail

COMMAND=${1:-"help"}
NAMESPACE=${2:-""}

case "$COMMAND" in
  nodes)
    kubectl get nodes -o wide
    ;;
  pods)
    if [ -n "$NAMESPACE" ]; then
      kubectl get pods -n "$NAMESPACE" -o wide
    else
      kubectl get pods -A -o wide
    fi
    ;;
  top-pods)
    kubectl top pods -A --sort-by=memory 2>/dev/null || echo "Metrics server not available"
    ;;
  top-nodes)
    kubectl top nodes 2>/dev/null || echo "Metrics server not available"
    ;;
  events)
    if [ -n "$NAMESPACE" ]; then
      kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp | grep -E "Warning|Error" | tail -30
    else
      kubectl get events -A --sort-by=.lastTimestamp | grep -E "Warning|Error" | tail -30
    fi
    ;;
  hpa)
    kubectl get hpa -A -o wide
    ;;
  pvc)
    kubectl get pvc -A
    ;;
  endpoints)
    kubectl get endpoints -A
    ;;
  help|*)
    echo "Usage: $0 <command> [namespace]"
    echo "Commands: nodes, pods, top-pods, top-nodes, events, hpa, pvc, endpoints"
    ;;
esac
