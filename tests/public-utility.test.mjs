import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { buildMapsDirectionsUrl, normalizeExternalUrl } from '../lib/public-utility.mjs';

test('external links accept only HTTP and HTTPS protocols', () => {
  assert.equal(normalizeExternalUrl('javascript:alert(1)'), null);
  assert.equal(normalizeExternalUrl('data:text/html,test'), null);
  assert.equal(normalizeExternalUrl('prefeitura.sp.gov.br'), 'https://prefeitura.sp.gov.br/');
});

test('directions use the address when coordinates are missing', () => {
  const url = buildMapsDirectionsUrl({
    latitude: 0,
    longitude: 0,
    address: 'Praça da Sé',
    city_name: 'São Paulo',
    state_id: 'SP',
  });

  assert.match(url, /Pra%C3%A7a%20da%20S%C3%A9/);
  assert.equal(url.includes('destination=0%2C0'), false);
});

test('places migration supports the complete catalog and protected writes', async () => {
  const migration = await readFile(
    new URL('../supabase/migrations/006_align_places_schema_and_security.sql', import.meta.url),
    'utf8'
  );

  assert.match(migration, /'esporte'/);
  assert.match(migration, /'turismo'/);
  assert.match(migration, /source_name TEXT/);
  assert.match(migration, /tags TEXT\[\]/);
  assert.match(migration, /TO authenticated/);
  assert.doesNotMatch(migration, /auth\.role\(\)/);
});
