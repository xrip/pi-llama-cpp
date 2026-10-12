import type { SimpleStreamOptions } from "@earendil-works/pi-ai";
import { describe, expect, it, vi } from "vitest";
import { withCachePrompt } from "../../src/utils/cachePrompt";

/** Runs the wrapped stream and returns the payload it would send. */
const sentPayload = async (options?: SimpleStreamOptions) => {
  const inner = vi.fn();
  withCachePrompt(inner)({} as any, {} as any, options);
  const sent = inner.mock.calls[0][2] as SimpleStreamOptions | undefined;
  const payload = { model: "m" };
  return (await sent?.onPayload?.(payload, {} as any)) ?? payload;
};

describe("withCachePrompt", () => {
  it("sends cache_prompt: false when cacheRetention is none", async () => {
    expect(await sentPayload({ cacheRetention: "none" })).toEqual({
      model: "m",
      cache_prompt: false,
    });
  });

  it("leaves the payload unchanged otherwise", async () => {
    expect(await sentPayload()).toEqual({ model: "m" });
    expect(await sentPayload({ cacheRetention: "short" })).toEqual({
      model: "m",
    });
  });

  it("keeps the caller's onPayload result", async () => {
    const onPayload = vi.fn(async (p: unknown) => ({
      ...(p as object),
      extra: 1,
    }));
    expect(await sentPayload({ cacheRetention: "none", onPayload })).toEqual({
      model: "m",
      cache_prompt: false,
      extra: 1,
    });
    expect(onPayload).toHaveBeenCalledWith(
      { model: "m", cache_prompt: false },
      {},
    );
  });
});
