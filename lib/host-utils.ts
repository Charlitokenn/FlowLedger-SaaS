export type HostnameParts = {
  hostname: string;
  subdomain: string | null;
  baseHost: string | null;
  isLocalhost: boolean;
};

// Helper to normalize hostname parsing across environments
// - Handles localhost / 127.0.0.1
// - Supports subdomain.localhost patterns
// - Strips port if present in the Host header
export function getHostnameParts(req: { headers: Headers; nextUrl: { hostname: string } }): HostnameParts {
  const hostHeader = req.headers.get('host');
  const rawHost = hostHeader ?? req.nextUrl.hostname;

  // Strip port if present
  const hostname = rawHost.split(':')[0].toLowerCase();

  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost');

  // Localhost and friends
  if (isLocalhost) {
    const parts = hostname.split('.');

    // Plain localhost / 127.0.0.1
    if (parts.length === 1) {
      return {
        hostname,
        subdomain: null,
        baseHost: hostname,
        isLocalhost,
      };
    }

    // *.localhost pattern (e.g. foo.localhost)
    const subdomain = parts.slice(0, -1).join('.') || null;
    return {
      hostname,
      subdomain,
      baseHost: 'localhost',
      isLocalhost,
    };
  }

  const parts = hostname.split('.');

  // Single label host (unlikely in prod, but handle gracefully)
  if (parts.length === 1) {
    return {
      hostname,
      subdomain: null,
      baseHost: hostname,
      isLocalhost,
    };
  }

  // Root domain like example.com -> no subdomain, baseHost is full hostname
  if (parts.length === 2) {
    return {
      hostname,
      subdomain: null,
      baseHost: hostname,
      isLocalhost,
    };
  }

  // Generic case: subdomain.baseHost (e.g. foo.example.com)
  const subdomain = parts[0] || null;
  const baseHost = parts.slice(1).join('.') || null;

  return {
    hostname,
    subdomain,
    baseHost,
    isLocalhost,
  };
}
