import { describe, it, expect } from "vitest";
import { generateId } from "./generateId";

describe("generateId", () => {
  it("UUID形式の文字列を返す", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("毎回異なるIDを返す", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
