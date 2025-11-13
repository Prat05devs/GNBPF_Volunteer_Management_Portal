import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges class names conditionally", () => {
    expect(cn("flex", false && "hidden", "items-center")).toBe("flex items-center");
  });

  it("resolves conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

