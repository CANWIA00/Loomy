import { API_URL, MAILPIT_URL } from "./helpers";

/** Backend migration'lari uygulayip ayaga kalkana kadar bekler. */
export default async function globalSetup(): Promise<void> {
  const deadline = Date.now() + 120_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const [api, mail] = await Promise.all([
        fetch(`${API_URL}/health`),
        fetch(`${MAILPIT_URL}/api/v1/info`),
      ]);
      if (api.ok && mail.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `E2E ortami hazir degil. Once 'npm run e2e:up' calistirin. Son hata: ${String(lastError)}`
  );
}
