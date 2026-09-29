export async function loginRequest<T>(operation: PromiseLike<T>, timeoutMs = 20000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("O login demorou mais que o esperado. Verifique sua conexão e tente novamente.")), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
