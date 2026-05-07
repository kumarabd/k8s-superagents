#!/usr/bin/env bash
# Cluster-wide health snapshot. Read-only.
# Produces a structured audit report for the cluster-audit skill.
# Usage: ./audit.sh [--namespace NS]

set -euo pipefail

NAMESPACE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --namespace|-n) NAMESPACE="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

CONTEXT=$(kubectl config current-context)
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "=============================="
echo "Cluster Audit Report"
echo "Context: $CONTEXT"
echo "Date: $DATE"
echo "=============================="
echo ""

echo "## NODES"
kubectl get nodes -o wide
echo ""

echo "## NODE CONDITIONS"
kubectl describe nodes | grep -A8 "Conditions:" | grep -v "^--$"
echo ""

echo "## NON-RUNNING PODS"
if [ -n "$NAMESPACE" ]; then
  kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running,status.phase!=Succeeded 2>/dev/null || echo "None"
else
  kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded 2>/dev/null || echo "None"
fi
echo ""

echo "## HIGH-RESTART PODS (>5 restarts)"
if [ -n "$NAMESPACE" ]; then
  kubectl get pods -n "$NAMESPACE" | awk 'NR>1 && $4+0 > 5 {print}'
else
  kubectl get pods -A | awk 'NR>1 && $5+0 > 5 {print}'
fi
echo ""

echo "## RESOURCE USAGE (top pods by memory)"
kubectl top pods -A --sort-by=memory 2>/dev/null | head -20 || echo "Metrics server not available"
echo ""

echo "## HPA STATUS"
kubectl get hpa -A -o wide 2>/dev/null || echo "No HPAs found"
echo ""

echo "## UNBOUND PVCs"
kubectl get pvc -A | grep -v Bound || echo "All PVCs bound"
echo ""

echo "## RECENT WARNING EVENTS"
if [ -n "$NAMESPACE" ]; then
  kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp | grep Warning | tail -20
else
  kubectl get events -A --sort-by=.lastTimestamp | grep Warning | tail -20
fi
echo ""

echo "## CLUSTER-ADMIN BINDINGS"
kubectl get clusterrolebindings -o json | \
  python3 -c "import json,sys; data=json.load(sys.stdin); [print(i['metadata']['name'], '→', i.get('subjects','')) for i in data['items'] if i['roleRef']['name']=='cluster-admin']"
echo ""

echo "=============================="
echo "Audit complete"
echo "=============================="
