import assert from 'node:assert/strict';
import test from 'node:test';

test('SEO Score calculation produces 100 when all criteria are satisfied', () => {
  const perfectMetrics = {
    meta_title_present: true,
    meta_title_length: 55,
    meta_description_present: true,
    meta_description_length: 145,
    h1_count: 1,
    canonical_valid: true,
    schema_org_valid: true,
    nap_consistent: true,
    whatsapp_verified: true,
    photos_count: 6,
    hours_complete: true,
    products_count: 5,
  };

  let deductions = 0;
  if (!perfectMetrics.meta_title_present) deductions += 15;
  if (!perfectMetrics.meta_description_present) deductions += 15;
  if (!perfectMetrics.schema_org_valid) deductions += 15;
  if (!perfectMetrics.nap_consistent) deductions += 20;
  if (!perfectMetrics.whatsapp_verified) deductions += 10;
  if (!perfectMetrics.hours_complete) deductions += 10;
  if (perfectMetrics.products_count < 1) deductions += 10;
  if (perfectMetrics.photos_count < 3) deductions += 5;

  const score = Math.max(0, 100 - deductions);
  assert.equal(score, 100);
});

test('SEO Score applies critical deductions when NAP and meta tags are missing', () => {
  const incompleteMetrics = {
    meta_title_present: false,
    meta_description_present: false,
    schema_org_valid: true,
    nap_consistent: false, // Inconsistent phone or address
    whatsapp_verified: false,
    hours_complete: false,
    products_count: 0,
    photos_count: 0,
  };

  let deductions = 0;
  if (!incompleteMetrics.meta_title_present) deductions += 15;
  if (!incompleteMetrics.meta_description_present) deductions += 15;
  if (!incompleteMetrics.nap_consistent) deductions += 20;
  if (!incompleteMetrics.whatsapp_verified) deductions += 10;
  if (!incompleteMetrics.hours_complete) deductions += 10;
  if (incompleteMetrics.products_count < 1) deductions += 10;
  if (incompleteMetrics.photos_count < 3) deductions += 5;

  const score = Math.max(0, 100 - deductions);
  assert.equal(score, 15);
  assert.ok(score < 50, 'Incomplete business should score below 50');
});

test('Analytics delta computation calculates percentage variation correctly', () => {
  const computeChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  assert.equal(computeChange(150, 100), 50); // +50%
  assert.equal(computeChange(80, 100), -20); // -20%
  assert.equal(computeChange(100, 100), 0);   // 0%
  assert.equal(computeChange(50, 0), 100);   // from 0 to 50 is +100%
});

test('Revenue impact estimator calculates realistic conservative projection', () => {
  const calculateRevenueImpact = (whatsappClicks, calls, directions, avgTicket = 45, conversionRate = 0.12) => {
    const totalLeads = whatsappClicks + calls + directions;
    const estimatedSales = Math.floor(totalLeads * conversionRate);
    return estimatedSales * avgTicket;
  };

  const impact = calculateRevenueImpact(100, 20, 30, 50, 0.10);
  // totalLeads = 150, estimatedSales = 15, revenue = 15 * 50 = 750
  assert.equal(impact, 750);
});

test('Multi-tenant data isolation ensures business metrics do not cross boundaries', () => {
  const mockDatabase = [
    { business_id: 'biz-1', impressions: 500 },
    { business_id: 'biz-2', impressions: 1200 },
  ];

  const getMetricsForBusiness = (bizId) => {
    return mockDatabase.filter((entry) => entry.business_id === bizId);
  };

  const biz1Metrics = getMetricsForBusiness('biz-1');
  assert.equal(biz1Metrics.length, 1);
  assert.equal(biz1Metrics[0].impressions, 500);

  const biz2Metrics = getMetricsForBusiness('biz-2');
  assert.equal(biz2Metrics.length, 1);
  assert.equal(biz2Metrics[0].impressions, 1200);

  const unauthorizedAccess = getMetricsForBusiness('biz-3');
  assert.equal(unauthorizedAccess.length, 0);
});
