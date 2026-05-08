import { describe, it, expect } from "vitest";
import { classifyQuery } from "../router.js";

describe("classifyQuery", () => {
  it("routes crashloop to pod-failure-triage", () => {
    expect(classifyQuery("my pod is in CrashLoopBackOff")).toBe("pod-failure-triage");
  });

  it("routes OOMKill to pod-failure-triage", () => {
    expect(classifyQuery("pod was OOMKilled")).toBe("pod-failure-triage");
  });

  it("routes node NotReady to node-pressure-debug", () => {
    expect(classifyQuery("node is NotReady")).toBe("node-pressure-debug");
  });

  it("routes rbac to rbac-design", () => {
    expect(classifyQuery("design RBAC for my service account")).toBe("rbac-design");
  });

  it("routes canary to release-strategy", () => {
    expect(classifyQuery("set up a canary deployment")).toBe("release-strategy");
  });

  it("routes hpa to capacity-planning", () => {
    expect(classifyQuery("configure HPA for my workload")).toBe("capacity-planning");
  });

  it("routes operator to operator-development", () => {
    expect(classifyQuery("build a Kubernetes operator")).toBe("operator-development");
  });

  it("routes helm to helm-kustomize", () => {
    expect(classifyQuery("structure my helm chart")).toBe("helm-kustomize");
  });

  it("routes deployment to manifest-authoring", () => {
    expect(classifyQuery("write a deployment manifest")).toBe("manifest-authoring");
  });

  it("routes audit to cluster-audit", () => {
    expect(classifyQuery("audit the cluster health")).toBe("cluster-audit");
  });

  it("routes prometheus to observability-investigation", () => {
    expect(classifyQuery("check prometheus metrics for latency spike")).toBe("observability-investigation");
  });

  it("routes kyverno to policy-enforcement", () => {
    expect(classifyQuery("write a kyverno policy")).toBe("policy-enforcement");
  });

  it("routes postmortem to postmortem-writing", () => {
    expect(classifyQuery("write a postmortem for last night's incident")).toBe("postmortem-writing");
  });

  it("routes architecture to architecture-plan", () => {
    expect(classifyQuery("design the architecture for this feature")).toBe("architecture-plan");
  });

  it("routes controller-runtime to controller-runtime-debug", () => {
    expect(classifyQuery("my controller-runtime reconciler is missing events")).toBe("controller-runtime-debug");
  });

  it("routes blast radius to rollout-risk-assessment", () => {
    expect(classifyQuery("assess the blast radius of this change")).toBe("rollout-risk-assessment");
  });

  it("routes breakdown to task-decomposition", () => {
    expect(classifyQuery("break this project down into phases")).toBe("task-decomposition");
  });

  it("returns null for unrecognised queries", () => {
    expect(classifyQuery("what is kubernetes")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(classifyQuery("CRASHLOOP in production")).toBe("pod-failure-triage");
  });

  it("first-match-wins: rbac matched before policy when both keywords present", () => {
    expect(classifyQuery("rbac policy enforcement")).toBe("rbac-design");
  });
});
