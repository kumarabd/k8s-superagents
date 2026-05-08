import { describe, it, expect } from "vitest";
import { detectTier, isAuthorized } from "../guardrails.js";

describe("detectTier", () => {
  it("returns readonly for a read-only query", () => {
    expect(detectTier("show me all pods in the cluster")).toBe("readonly");
  });

  it("returns readonly for a describe query", () => {
    expect(detectTier("describe the failing pod")).toBe("readonly");
  });

  it("returns controlled-write for apply", () => {
    expect(detectTier("apply this manifest to the cluster")).toBe("controlled-write");
  });

  it("returns controlled-write for scale", () => {
    expect(detectTier("scale the deployment to 3 replicas")).toBe("controlled-write");
  });

  it("returns controlled-write for restart", () => {
    expect(detectTier("restart the deployment")).toBe("controlled-write");
  });

  it("returns controlled-write for cordon", () => {
    expect(detectTier("cordon the node before maintenance")).toBe("controlled-write");
  });

  it("returns privileged for delete", () => {
    expect(detectTier("delete the namespace")).toBe("privileged");
  });

  it("returns privileged for drain", () => {
    expect(detectTier("drain the node for maintenance")).toBe("privileged");
  });

  it("returns privileged for force", () => {
    expect(detectTier("force delete the stuck pod")).toBe("privileged");
  });

  it("privileged takes precedence over write keywords", () => {
    expect(detectTier("delete and apply the resource")).toBe("privileged");
  });
});

describe("isAuthorized", () => {
  it("authorizes readonly without confirm", () => {
    expect(isAuthorized("readonly", undefined)).toBe(true);
  });

  it("authorizes controlled-write when confirm is any string", () => {
    expect(isAuthorized("controlled-write", "CONFIRM: apply reviewed manifest")).toBe(true);
  });

  it("blocks controlled-write when confirm is absent", () => {
    expect(isAuthorized("controlled-write", undefined)).toBe(false);
  });

  it("authorizes privileged when confirm starts with CONFIRM:", () => {
    expect(isAuthorized("privileged", "CONFIRM: draining node-1 for maintenance window")).toBe(true);
  });

  it("blocks privileged when confirm is absent", () => {
    expect(isAuthorized("privileged", undefined)).toBe(false);
  });

  it("blocks privileged when confirm does not start with CONFIRM:", () => {
    expect(isAuthorized("privileged", "yes please go ahead")).toBe(false);
  });

  it("blocks privileged for empty confirm string", () => {
    expect(isAuthorized("privileged", "")).toBe(false);
  });
});
