// Bound network requests as well as the UI wait, including server-rendered pages.
export async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const originalSignal = init?.signal;
  if (originalSignal?.aborted) abort();
  originalSignal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 15000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    originalSignal?.removeEventListener("abort", abort);
  }
}
