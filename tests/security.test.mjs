import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeJsonLd } from '../lib/security/json-ld.mjs';
import { checkRateLimit, getRequestIp } from '../lib/security/rate-limit.mjs';

test('JSON-LD serialization cannot terminate the script element', () => {
  const serialized = serializeJsonLd({ name: '</script><script>alert(1)</script>' });

  assert.equal(serialized.includes('</script>'), false);
  assert.match(serialized, /\\u003c\/script\\u003e/);
});

test('rate limiter rejects requests after the configured limit', () => {
  const key = `test-${crypto.randomUUID()}`;

  assert.equal(checkRateLimit(key, 2, 60_000), true);
  assert.equal(checkRateLimit(key, 2, 60_000), true);
  assert.equal(checkRateLimit(key, 2, 60_000), false);
});

test('request IP uses the first forwarded address', () => {
  const headers = new Headers({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' });
  assert.equal(getRequestIp(headers), '203.0.113.10');
});
