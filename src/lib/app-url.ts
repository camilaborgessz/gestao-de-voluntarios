import { headers } from "next/headers";

const LOCAL_HOST = /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;

export interface AppUrlSources {
  /** `APP_URL` from the environment. */
  appUrl?: string;
  /** True when running on Vercel (the variable `VERCEL` is set there). */
  onVercel: boolean;
  /** Vercel's own variable with the production domain, without protocol (e.g. "adkoinonia.vercel.app"). */
  productionHost?: string;
  /** Host of the current request, when there is one. */
  requestHost?: string | null;
  requestProto?: string | null;
}

const trimSlash = (value: string) => value.trim().replace(/\/+$/, "");

/**
 * The address to use in links inside emails. `APP_URL` wins, except when it points at localhost while the app is
 * running online (a copied development `.env`): a link to localhost is useless to anyone but the developer, so the
 * production domain (or the address of the current request) is used instead. Returns null when nothing is known.
 */
export function resolveAppUrl({ appUrl, onVercel, productionHost, requestHost, requestProto }: AppUrlSources) {
  const configured = appUrl?.trim();
  if (configured && !(onVercel && LOCAL_HOST.test(configured))) return trimSlash(configured);

  if (onVercel && productionHost?.trim()) return `https://${trimSlash(productionHost).replace(/^https?:\/\//, "")}`;

  if (requestHost) {
    const protocol = requestProto ?? (LOCAL_HOST.test(requestHost) ? "http" : "https");
    return `${protocol}://${requestHost}`;
  }
  return null;
}

/** Same as `resolveAppUrl`, reading the environment and (when inside a request) the request headers. */
export async function appBaseUrl() {
  let requestHost: string | null = null;
  let requestProto: string | null = null;
  try {
    const requestHeaders = await headers();
    requestHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    requestProto = requestHeaders.get("x-forwarded-proto");
  } catch {
    // not inside a request (script or test): fine
  }
  return resolveAppUrl({
    appUrl: process.env.APP_URL,
    onVercel: Boolean(process.env.VERCEL),
    productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    requestHost,
    requestProto,
  });
}
