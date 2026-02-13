/**
 * Format adapters: convert between JSON ↔ XML at system boundaries.
 * Internally the pipeline always works with plain JSON objects.
 */

/**
 * Serialize a JSON object to an XML string.
 * Wraps under a root element (default: "Request").
 */
export function jsonToXml(data: Record<string, any>, rootElement = 'Request'): string {
  function buildXml(obj: any, tag: string): string {
    if (obj === null || obj === undefined) return `<${tag}/>`;
    if (typeof obj !== 'object') {
      const escaped = String(obj)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<${tag}>${escaped}</${tag}>`;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => buildXml(item, tag)).join('');
    }
    const children = Object.entries(obj)
      .map(([k, v]) => buildXml(v, k))
      .join('');
    return `<${tag}>${children}</${tag}>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>${buildXml(data, rootElement)}`;
}

/**
 * Parse an XML string back to a plain JSON object.
 * Uses fast-xml-parser when available, falls back to a simple regex approach.
 */
export function xmlToJson(xml: string): Record<string, any> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { XMLParser } = require('fast-xml-parser');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    return parser.parse(xml) as Record<string, any>;
  } catch {
    // Minimal fallback — strips tags and returns raw text under 'raw'
    const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return { raw: text };
  }
}

/**
 * Wrap a JSON body in a SOAP 1.1 envelope.
 * The body is first converted to XML (rootElement = 'Body').
 */
export function jsonToSoap(data: Record<string, any>, operationName = 'RateRequest'): string {
  const bodyXml = jsonToXml(data, operationName);
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:rat="http://ratabase.cgi.com/rating">
  <soapenv:Header/>
  <soapenv:Body>
    ${bodyXml.replace(/<\?xml[^?]*\?>\s*/, '')}
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Extract the SOAP body content and parse it to JSON.
 */
export function soapToJson(soapXml: string): Record<string, any> {
  // Extract <soapenv:Body> or <soap:Body> content
  const bodyMatch = soapXml.match(/<(?:soapenv|soap):Body[^>]*>([\s\S]*?)<\/(?:soapenv|soap):Body>/i);
  const innerXml = bodyMatch ? bodyMatch[1].trim() : soapXml;
  return xmlToJson(innerXml);
}
