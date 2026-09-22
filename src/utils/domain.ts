// Multi-part ccTLDs to correctly extract apex/root domain and brand
const TWO_PART_TLDS = new Set([
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'asn.au', 'id.au',
  'co.uk', 'org.uk', 'me.uk', 'net.uk', 'ac.uk', 'gov.uk', 'ltd.uk', 'plc.uk',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz',
  'co.za', 'org.za', 'net.za', 'gov.za',
  'co.jp', 'ne.jp', 'or.jp', 'go.jp', 'ac.jp',
  'com.br', 'net.br', 'org.br', 'gov.br',
  'com.sg', 'edu.sg', 'gov.sg', 'net.sg', 'org.sg',
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in', 'nic.in', 'gov.in',
  'com.mx', 'org.mx', 'gob.mx', 'edu.mx', 'net.mx',
  'co.kr', 'ne.kr', 'or.kr', 're.kr', 'pe.kr', 'go.kr',
  'com.tw', 'org.tw', 'idv.tw', 'gov.tw', 'edu.tw',
  'co.id', 'web.id', 'or.id', 'go.id',
  'com.tr', 'org.tr', 'net.tr', 'gov.tr', 'edu.tr',
  'com.ar', 'org.ar', 'gob.ar',
  'com.hk', 'org.hk', 'edu.hk', 'gov.hk',
  'com.my', 'org.my', 'gov.my', 'edu.my',
  'com.ph', 'org.ph', 'gov.ph', 'edu.ph',
  'co.th', 'or.th', 'go.th', 'ac.th'
]);

/**
 * Extracts the actual domain (root/apex domain) from any URL or hostname.
 * Example: 'ibs.bankwest.com.au' -> 'bankwest.com.au'
 * Example: 'https://ibs.bankwest.com.au/BWLogin/rib.aspx' -> 'bankwest.com.au'
 * Example: 'www.bankwest.com.au' -> 'bankwest.com.au'
 * Example: 'subdomain.example.com' -> 'example.com'
 */
export function getActualDomain(urlOrHostname: string): string {
  if (!urlOrHostname) return '';
  try {
    let host = urlOrHostname.trim();
    if (host.includes('://')) {
      host = new URL(host).hostname;
    } else {
      host = host.split('/')[0].split('?')[0].split('#')[0];
    }
    host = host.toLowerCase().replace(/:\d+$/, '');
    host = host.replace(/^\.+|\.+$/g, '');

    const parts = host.split('.');
    if (parts.length <= 2) {
      return host;
    }

    const lastTwo = parts.slice(-2).join('.');
    if (TWO_PART_TLDS.has(lastTwo)) {
      if (parts.length >= 3) {
        return parts.slice(-3).join('.');
      }
      return host;
    }

    return parts.slice(-2).join('.');
  } catch {
    return urlOrHostname;
  }
}

/**
 * Extracts the brand name / primary slug from a domain or URL.
 * Example: 'ibs.bankwest.com.au' -> 'bankwest'
 * Example: 'www.bankwest.com.au' -> 'bankwest'
 * Example: 'app.slack.com' -> 'slack'
 */
export function getDomainBrand(urlOrHostname: string): string {
  const actualDomain = getActualDomain(urlOrHostname);
  if (!actualDomain) return '';
  const parts = actualDomain.split('.');
  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join('.');
    if (TWO_PART_TLDS.has(lastTwo)) {
      return parts[parts.length - 3] || parts[0];
    }
  }
  return parts[0] || '';
}
