import { normalizeBaseUrl } from "@/_assets/utils/seo.utils";

function buildRobotsTxt(baseUrl) {
  return `User-agent: *
Allow: /

Disallow: /404
Disallow: /reservations/waitlist-offer/
Disallow: /reservations/*/manage
Disallow: /reservations/*/bank-hold

Sitemap: ${baseUrl}/sitemap.xml
`;
}

export async function getServerSideProps({ res }) {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
  const text = buildRobotsTxt(baseUrl);

  res.setHeader("Content-Type", "text/plain");
  res.write(text);
  res.end();

  return {
    props: {},
  };
}

export default function RobotsPage() {
  return null;
}
