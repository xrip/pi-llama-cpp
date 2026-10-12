import { getApiProvider } from "@earendil-works/pi-ai/compat";
import type { ProviderConfig } from "@earendil-works/pi-coding-agent";
import { API_TYPE } from "../constants";

type StreamSimple = NonNullable<ProviderConfig["streamSimple"]>;

/**
 * Wraps a stream function so that requests Pi marks as one-off
 * (`cacheRetention: "none"`, used for compaction and branch summaries)
 * send `cache_prompt: false`, telling llama-server not to cache the prompt.
 * Other requests are left unchanged.
 *
 * @param stream The stream function to wrap
 * @returns The wrapped stream function
 */
export const withCachePrompt =
  (stream: StreamSimple): StreamSimple =>
  (model, context, options) => {
    if (options?.cacheRetention !== "none")
      return stream(model, context, options);

    const { onPayload } = options;
    return stream(model, context, {
      ...options,
      onPayload: async (payload, model) => {
        const next = { ...(payload as object), cache_prompt: false };
        return (await onPayload?.(next, model)) ?? next;
      },
    });
  };

/**
 * Pi's built-in OpenAI-completions stream, with {@link withCachePrompt}.
 */
export const streamSimple = withCachePrompt((model, context, options) => {
  const api = getApiProvider(API_TYPE);
  if (!api) throw new Error(`No API provider registered for api: ${API_TYPE}`);
  return api.streamSimple(model, context, options);
});
