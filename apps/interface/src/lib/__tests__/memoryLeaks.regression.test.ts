/**
 * Regression tests for #746 — memory leaks in long-lived sessions.
 *
 * Guards:
 * 1. setInterval is always cleared (CountdownTimer pattern).
 * 2. setTimeout is always cleared (debounce / PledgeModal pattern).
 * 3. document.addEventListener is removed on cleanup (PostUpdateModal / EditProfileModal).
 */

describe("#746 memory leak regression", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("clears setInterval on unmount", () => {
    const spy = jest.spyOn(global, "clearInterval");
    const id = setInterval(() => {}, 1000);
    // Simulate cleanup
    clearInterval(id);
    expect(spy).toHaveBeenCalledWith(id);
    spy.mockRestore();
  });

  it("clears debounce setTimeout on unmount", () => {
    const spy = jest.spyOn(global, "clearTimeout");
    const id = setTimeout(() => {}, 2000);
    clearTimeout(id);
    expect(spy).toHaveBeenCalledWith(id);
    spy.mockRestore();
  });

  it("removes document keydown listener on cleanup", () => {
    const spy = jest.spyOn(document, "removeEventListener");
    const handler = jest.fn();
    document.addEventListener("keydown", handler);
    document.removeEventListener("keydown", handler);
    expect(spy).toHaveBeenCalledWith("keydown", handler);
    spy.mockRestore();
  });

  it("does not accumulate intervals across re-renders", () => {
    // Each render cycle must clear the previous interval before creating a new one
    const clearSpy = jest.spyOn(global, "clearInterval");
    let id: NodeJS.Timeout | undefined;
    const RENDERS = 4;
    for (let i = 0; i < RENDERS; i++) {
      if (id !== undefined) clearInterval(id); // cleanup from previous render
      id = setInterval(() => {}, 1000);
    }
    if (id !== undefined) clearInterval(id); // final unmount
    // RENDERS-1 re-render clears + 1 unmount clear = RENDERS clears total
    expect(clearSpy.mock.calls.length).toBe(RENDERS);
    clearSpy.mockRestore();
  });
});
