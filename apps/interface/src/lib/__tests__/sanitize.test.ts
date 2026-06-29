import {
  sanitizeText,
  sanitizeComment,
  sanitizeUpdateTitle,
  sanitizeUpdateBody,
} from "../sanitize";

describe("sanitizeText", () => {
  it("strips script tags", () => {
    expect(sanitizeText("<script>alert(1)</script>hello")).toBe("hello");
  });

  it("strips inline event attributes inside tags", () => {
    expect(sanitizeText("hello<img onerror=alert(1) src=x>world")).toBe(
      "helloworld",
    );
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("normalizes internal whitespace", () => {
    expect(sanitizeText("hello   world")).toBe("hello world");
  });

  it("enforces maxLength", () => {
    expect(sanitizeText("abcdef", 3)).toBe("abc");
  });

  it("passes through normal text unchanged", () => {
    expect(sanitizeText("Hello & World")).toBe("Hello & World");
  });
});

describe("sanitizeComment", () => {
  it("passes through normal text unchanged", () => {
    expect(sanitizeComment("Great project!")).toBe("Great project!");
  });

  it("blocks XSS script tags", () => {
    expect(sanitizeComment('<script>alert("xss")</script>')).toBe("");
  });

  it("blocks img injection", () => {
    expect(sanitizeComment("<img src=x onerror=alert(1)>")).toBe("");
  });

  it("enforces 1000 char limit", () => {
    const long = "a".repeat(1500);
    expect(sanitizeComment(long)).toHaveLength(1000);
  });
});

describe("sanitizeUpdateTitle", () => {
  it("strips newlines", () => {
    expect(sanitizeUpdateTitle("line1\nline2")).toBe("line1 line2");
  });

  it("strips carriage returns", () => {
    expect(sanitizeUpdateTitle("line1\r\nline2")).toBe("line1 line2");
  });

  it("enforces 200 char limit", () => {
    expect(sanitizeUpdateTitle("a".repeat(300))).toHaveLength(200);
  });

  it("strips HTML tags", () => {
    expect(sanitizeUpdateTitle("<b>Title</b>")).toBe("Title");
  });
});

describe("sanitizeUpdateBody", () => {
  it("enforces 5000 char limit", () => {
    expect(sanitizeUpdateBody("a".repeat(6000))).toHaveLength(5000);
  });

  it("strips HTML tags", () => {
    expect(sanitizeUpdateBody("<p>body</p>")).toBe("body");
  });
});
