import {
  xlmToStroops,
  stroopsToXlm,
  bpsToPercent,
  unixToDate,
  daysUntil,
  STROOPS_PER_XLM,
} from "./utils";

describe("xlmToStroops", () => {
  it("converts whole XLM amounts", () => {
    expect(xlmToStroops(1)).toBe(10_000_000n);
    expect(xlmToStroops(100)).toBe(1_000_000_000n);
  });
  it("rounds fractional amounts", () => {
    expect(xlmToStroops(1.0000001)).toBe(10_000_001n);
    expect(xlmToStroops(0.5)).toBe(5_000_000n);
  });
  it("handles zero", () => {
    expect(xlmToStroops(0)).toBe(0n);
  });
});

describe("stroopsToXlm", () => {
  it("converts stroops to XLM float", () => {
    expect(stroopsToXlm(10_000_000n)).toBe(1);
    expect(stroopsToXlm(1_000_000_000n)).toBe(100);
  });
  it("handles zero", () => {
    expect(stroopsToXlm(0n)).toBe(0);
  });
  it("is the inverse of xlmToStroops for whole numbers", () => {
    for (const xlm of [1, 10, 50, 100, 9999]) {
      expect(stroopsToXlm(xlmToStroops(xlm))).toBe(xlm);
    }
  });
});

describe("STROOPS_PER_XLM", () => {
  it("equals 10_000_000n", () => {
    expect(STROOPS_PER_XLM).toBe(10_000_000n);
  });
});

describe("bpsToPercent", () => {
  it("formats whole percentages without decimals", () => {
    expect(bpsToPercent(10_000)).toBe("100%");
    expect(bpsToPercent(5_000)).toBe("50%");
    expect(bpsToPercent(0)).toBe("0%");
  });
  it("formats fractional percentages with two decimals", () => {
    expect(bpsToPercent(150)).toBe("1.50%");
    expect(bpsToPercent(333)).toBe("3.33%");
  });
});

describe("unixToDate", () => {
  it("converts a unix timestamp to Date", () => {
    const ts = 1_700_000_000;
    const d = unixToDate(ts);
    expect(d).toBeInstanceOf(Date);
    expect(d.getTime()).toBe(ts * 1000);
  });
  it("accepts bigint", () => {
    expect(unixToDate(1_700_000_000n).getTime()).toBe(1_700_000_000 * 1000);
  });
});

describe("daysUntil", () => {
  it("returns 0 for past dates", () => {
    expect(daysUntil(new Date(Date.now() - 86_400_000))).toBe(0);
  });
  it("returns correct days for future dates", () => {
    const twoDays = new Date(Date.now() + 2 * 86_400_000 + 60_000);
    expect(daysUntil(twoDays)).toBe(2);
  });
});
