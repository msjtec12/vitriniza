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
  const privilegesMigration = await readFile(
    new URL('../supabase/migrations/007_tighten_places_privileges_and_indexes.sql', import.meta.url),
    'utf8'
  );
  const restrictedPrivilegesMigration = await readFile(
    new URL('../supabase/migrations/008_restrict_places_authenticated_privileges.sql', import.meta.url),
    'utf8'
  );

  assert.match(migration, /'esporte'/);
  assert.match(migration, /'turismo'/);
  assert.match(migration, /source_name TEXT/);
  assert.match(migration, /tags TEXT\[\]/);
  assert.match(migration, /TO authenticated/);
  assert.doesNotMatch(migration, /auth\.role\(\)/);
  assert.match(privilegesMigration, /FROM anon/);
  assert.match(privilegesMigration, /CREATE POLICY places_admin_insert/);
  assert.match(privilegesMigration, /CREATE POLICY places_admin_update/);
  assert.match(privilegesMigration, /CREATE POLICY places_admin_delete/);
  assert.match(privilegesMigration, /idx_places_city_id/);
  assert.match(restrictedPrivilegesMigration, /REVOKE ALL PRIVILEGES.*authenticated/);
  assert.match(restrictedPrivilegesMigration, /GRANT SELECT, INSERT, UPDATE, DELETE/);
  assert.doesNotMatch(restrictedPrivilegesMigration, /GRANT .*TRUNCATE/);
});

test('every public utility category has a local default image', async () => {
  const categories = [
    'saude',
    'educacao',
    'lazer',
    'esporte',
    'turismo',
    'religiao',
    'transporte',
    'servicos-publicos',
    'cultura',
    'outros',
  ];
  const placesSource = await readFile(new URL('../lib/places.ts', import.meta.url), 'utf8');

  for (const category of categories) {
    const publicPath = `/images/places/default-${category}.svg`;
    const asset = await readFile(
      new URL(`../public${publicPath}`, import.meta.url),
      'utf8'
    );

    assert.match(placesSource, new RegExp(publicPath.replaceAll('/', '\\/')));
    assert.match(asset, /^<svg/);
    assert.match(asset, /<title/);
  }
});

test('manual public utility changes wait for server-confirmed persistence', async () => {
  const modalSource = await readFile(
    new URL('../components/master/MasterPlaceModal.tsx', import.meta.url),
    'utf8'
  );
  const routeSource = await readFile(
    new URL('../app/api/admin/places/route.ts', import.meta.url),
    'utf8'
  );
  const uploadSource = await readFile(
    new URL('../app/api/merchant/upload/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(modalSource, /await fetch\('\/api\/admin\/places'/);
  assert.match(modalSource, /await store\.fetchPlacesFromCloud\(true\)/);
  assert.doesNotMatch(modalSource, /readAsDataURL/);
  assert.match(routeSource, /requireAdmin\(req\)/);
  assert.match(routeSource, /\.insert\(\{ id, \.\.\.record \}\)/);
  assert.match(routeSource, /ensureLocation/);
  assert.match(routeSource, /source_name: sourceName/);
  assert.match(routeSource, /tags:/);
  assert.match(uploadSource, /'places'/);
});
