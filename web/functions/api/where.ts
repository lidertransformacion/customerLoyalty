/**
 * Cloudflare Pages Function: where is this request coming from?
 * Cloudflare resolves the visitor's IP to a city at the edge, with no
 * permission prompt and in every browser. Accuracy is city-level, and a VPN
 * or a carrier NAT can place the guest in the wrong city, so the app treats
 * this as a hint and lets GPS or the guest override it.
 *
 * On Vercel the same hint comes from the `x-vercel-ip-city`,
 * `x-vercel-ip-country`, `x-vercel-ip-latitude` and `x-vercel-ip-longitude`
 * request headers.
 */
type CfProperties = {
  city?: string;
  country?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
};

type Context = { request: Request & { cf?: CfProperties } };

export const onRequestGet = async ({ request }: Context): Promise<Response> => {
  const cf = request.cf ?? {};
  const body = {
    city: cf.city ?? null,
    region: cf.region ?? null,
    country: cf.country ?? null,
    lat: cf.latitude ? Number(cf.latitude) : null,
    lng: cf.longitude ? Number(cf.longitude) : null,
    timezone: cf.timezone ?? null,
    source: "cloudflare-ip",
  };
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
    },
  });
};
