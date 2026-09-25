import { describe, it, expect } from "vitest";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";

describe("Foundation Infrastructure", () => {
  it("formats currency correctly", () => {
    expect(formatCurrency(65432.1)).toBe("$65,432.10");
  });

  it("formats percent with sign", () => {
    expect(formatPercent(5.2)).toBe("+5.20%");
    expect(formatPercent(-3.14)).toBe("-3.14%");
  });
});
