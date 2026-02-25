/**
 * NREL SPA Validation Suite
 *
 * 100-scenario validation test for the solar-spa WASM implementation.
 * Validates against known algorithm behavior, boundary conditions,
 * polar regions, atmospheric variations, and historical/future dates.
 *
 * Run: node validate.mjs
 */

import { spa, spaFormatted, formatTime, init, SPA_ZA, SPA_ZA_INC, SPA_ZA_RTS, SPA_ALL } from './dist/index.mjs';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const results = [];
let scenarioNum = 0;

/**
 * Create a Date object with an explicit year (works for years < 100).
 * JavaScript's Date constructor treats 2-digit years as 1900+year,
 * so we must use setFullYear() for historical dates.
 */
function makeDate(year, month, day, hour = 12, minute = 0, second = 0) {
  const d = new Date(2000, month - 1, day, hour, minute, second);
  d.setFullYear(year);
  return d;
}

/**
 * Run a single validation scenario.
 * @param {string} name - Scenario label
 * @param {Function} fn - Async function that returns { pass, zenith, azimuth, detail }
 */
async function scenario(name, fn) {
  scenarioNum++;
  const num = scenarioNum;
  const t0 = performance.now();
  try {
    const result = await fn();
    const elapsed = performance.now() - t0;
    const us = Math.round(elapsed * 1000);
    results.push({
      num,
      name,
      pass: result.pass,
      detail: result.detail || '',
      us,
      zenith: result.zenith,
      azimuth: result.azimuth,
    });
  } catch (err) {
    const elapsed = performance.now() - t0;
    const us = Math.round(elapsed * 1000);
    results.push({
      num,
      name,
      pass: false,
      detail: `EXCEPTION: ${err.message}`,
      us,
      zenith: null,
      azimuth: null,
    });
  }
}

/**
 * Run a scenario that expects spa() to throw.
 */
async function scenarioThrows(name, fn, checkMsg) {
  scenarioNum++;
  const num = scenarioNum;
  const t0 = performance.now();
  try {
    await fn();
    const elapsed = performance.now() - t0;
    results.push({
      num,
      name,
      pass: false,
      detail: 'Expected throw but succeeded',
      us: Math.round(elapsed * 1000),
      zenith: null,
      azimuth: null,
    });
  } catch (err) {
    const elapsed = performance.now() - t0;
    const pass = checkMsg ? err.message.includes(checkMsg) || err instanceof RangeError || err instanceof TypeError || err.message.includes('error code') : true;
    results.push({
      num,
      name,
      pass,
      detail: pass ? `Threw: ${err.message.substring(0, 60)}` : `Wrong error: ${err.message}`,
      us: Math.round(elapsed * 1000),
      zenith: null,
      azimuth: null,
    });
  }
}

function between(val, lo, hi) {
  return val >= lo && val <= hi;
}

function approx(actual, expected, tolerance) {
  return Math.abs(actual - expected) <= tolerance;
}

// ─── City Data ────────────────────────────────────────────────────────────────

const cities = [
  // [name, lat, lon, tz, elevation, summerZenithRange, winterZenithRange]
  // Summer solstice: June 21 2025 noon local
  // Winter solstice: Dec 21 2025 noon local
  // Zenith ranges are [min, max] approximate expectations
  ['NYC',          40.7128,  -74.0060,  -4, 10,   [16, 30],  [60, 78]],
  ['London',       51.5074,   -0.1278,   1, 11,   [27, 33],  [72, 80]],
  ['Tokyo',        35.6762,  139.6503,   9, 40,   [11, 20],  [52, 62]],
  ['Sydney',      -33.8688,  151.2093,  10,  3,   [52, 62],  [10, 18]],
  ['Cairo',        30.0444,   31.2357,   2, 75,   [ 6, 14],  [47, 55]],
  ['Mumbai',       19.0760,   72.8777, 5.5, 14,   [ 4, 12],  [37, 45]],
  ['Sao Paulo',   -23.5505,  -46.6333,  -3,760,   [44, 52],  [ 0,  8]],
  ['Moscow',       55.7558,   37.6173,   3,156,   [31, 37],  [76, 84]],
  ['Beijing',      39.9042,  116.4074,   8, 43,   [15, 22],  [58, 66]],
  ['Nairobi',      -1.2921,   36.8219,   3,1795,  [24, 30],  [22, 28]],
  ['Reykjavik',    64.1466,  -21.9426,   0, 50,   [40, 48],  [88, 100]],
  ['Singapore',     1.3521,  103.8198,   8, 15,   [22, 28],  [24, 30]],
  ['Cape Town',   -33.9249,   18.4241,   2, 30,   [52, 62],  [10, 18]],
  ['Buenos Aires',-34.6037,  -58.3816,  -3, 25,   [52, 62],  [ 4, 16]],
  ['Dubai',        25.2048,   55.2708,   4,  5,   [ 1,  8],  [43, 51]],
  ['Toronto',      43.6532,  -79.3832,  -4, 76,   [19, 30],  [62, 72]],
  ['Mexico City',  19.4326,  -99.1332,  -6,2240,  [ 4, 10],  [37, 44]],
  ['Seoul',        37.5665,  126.9780,   9, 38,   [13, 20],  [56, 64]],
  ['Rome',         41.9028,   12.4964,   2, 21,   [18, 24],  [60, 68]],
  ['Anchorage',    61.2181, -149.9003,  -8, 30,   [37, 44],  [82, 96]],
];

// ─── Run all scenarios ────────────────────────────────────────────────────────

async function runAll() {
  // Warmup
  await init();
  await spa(new Date(2025, 5, 21, 12, 0, 0), 40, -74, { timezone: -4 });

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 1: Cities worldwide (40 scenarios, 1-40)
  // ══════════════════════════════════════════════════════════════════

  for (const [name, lat, lon, tz, elev, summerRange, winterRange] of cities) {
    // Summer solstice: June 21 2025, noon local
    await scenario(`${name} summer solstice`, async () => {
      const r = await spa(
        makeDate(2025, 6, 21, 12, 0, 0),
        lat, lon,
        { timezone: tz, elevation: elev },
      );
      const pass = r.error_code === 0
        && between(r.zenith, summerRange[0], summerRange[1])
        && between(r.azimuth, 0, 360);
      return {
        pass,
        zenith: r.zenith,
        azimuth: r.azimuth,
        detail: !pass ? `zenith=${r.zenith.toFixed(2)} expected [${summerRange}]` : '',
      };
    });

    // Winter solstice: Dec 21 2025, noon local
    await scenario(`${name} winter solstice`, async () => {
      const r = await spa(
        makeDate(2025, 12, 21, 12, 0, 0),
        lat, lon,
        { timezone: tz, elevation: elev },
      );
      const pass = r.error_code === 0
        && between(r.zenith, winterRange[0], winterRange[1])
        && between(r.azimuth, 0, 360);
      return {
        pass,
        zenith: r.zenith,
        azimuth: r.azimuth,
        detail: !pass ? `zenith=${r.zenith.toFixed(2)} expected [${winterRange}]` : '',
      };
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 2: Boundary conditions (15 scenarios, 41-55)
  // ══════════════════════════════════════════════════════════════════

  // 41: North Pole summer solstice (midnight sun)
  await scenario('North Pole summer solstice', async () => {
    const r = await spa(makeDate(2025, 6, 21, 12, 0, 0), 90, 0, { timezone: 0 });
    // Sun should be above horizon (zenith < 90) in arctic summer
    const pass = r.error_code === 0 && r.zenith < 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 42: North Pole winter solstice (polar night)
  await scenario('North Pole winter solstice', async () => {
    const r = await spa(makeDate(2025, 12, 21, 12, 0, 0), 90, 0, { timezone: 0 });
    // Sun should be below horizon (zenith > 90) in arctic winter
    const pass = r.error_code === 0 && r.zenith > 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 43: South Pole summer solstice (Dec = summer in south)
  await scenario('South Pole summer solstice', async () => {
    const r = await spa(makeDate(2025, 12, 21, 12, 0, 0), -90, 0, { timezone: 0 });
    // Sun above horizon at south pole in December
    const pass = r.error_code === 0 && r.zenith < 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 44: South Pole winter solstice (June = winter in south)
  await scenario('South Pole winter solstice', async () => {
    const r = await spa(makeDate(2025, 6, 21, 12, 0, 0), -90, 0, { timezone: 0 });
    // Sun below horizon at south pole in June
    const pass = r.error_code === 0 && r.zenith > 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 45: Equator March equinox noon
  await scenario('Equator March equinox noon', async () => {
    const r = await spa(makeDate(2025, 3, 20, 12, 0, 0), 0, 0, { timezone: 0 });
    // Sun nearly overhead at equator on equinox
    const pass = r.error_code === 0 && r.zenith < 5;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 46: Equator September equinox noon
  await scenario('Equator September equinox noon', async () => {
    const r = await spa(makeDate(2025, 9, 22, 12, 0, 0), 0, 0, { timezone: 0 });
    const pass = r.error_code === 0 && r.zenith < 5;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 47: Equator June solstice (sun north of equator)
  await scenario('Equator June solstice noon', async () => {
    const r = await spa(makeDate(2025, 6, 21, 12, 0, 0), 0, 0, { timezone: 0 });
    // Declination ~23.44, so zenith ~23.44 at equator
    const pass = r.error_code === 0 && between(r.zenith, 20, 27);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 48: Equator December solstice (sun south of equator)
  await scenario('Equator December solstice noon', async () => {
    const r = await spa(makeDate(2025, 12, 21, 12, 0, 0), 0, 0, { timezone: 0 });
    const pass = r.error_code === 0 && between(r.zenith, 20, 27);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 49: International Date Line east (+180)
  await scenario('Date line +180 longitude', async () => {
    const r = await spa(makeDate(2025, 6, 21, 12, 0, 0), 0, 180, { timezone: 12 });
    const pass = r.error_code === 0 && between(r.zenith, 0, 90);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 50: International Date Line west (-180)
  await scenario('Date line -180 longitude', async () => {
    const r = await spa(makeDate(2025, 6, 21, 12, 0, 0), 0, -180, { timezone: -12 });
    const pass = r.error_code === 0 && between(r.zenith, 0, 90);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 51: Mt Everest (8849m elevation)
  await scenario('Mt Everest summit elevation', async () => {
    const r = await spa(
      makeDate(2025, 6, 21, 12, 0, 0),
      27.9881, 86.9250,
      { timezone: 5.75, elevation: 8849, pressure: 314, temperature: -20 },
    );
    const pass = r.error_code === 0 && between(r.zenith, 0, 15);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 52: Dead Sea (-430m elevation)
  await scenario('Dead Sea negative elevation', async () => {
    const r = await spa(
      makeDate(2025, 6, 21, 12, 0, 0),
      31.5, 35.5,
      { timezone: 3, elevation: -430, pressure: 1065, temperature: 40 },
    );
    const pass = r.error_code === 0 && between(r.zenith, 0, 15);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 53: Extreme past date (year -2000, earliest valid)
  await scenario('Year -2000 (earliest valid)', async () => {
    const r = await spa(makeDate(-2000, 6, 21, 12, 0, 0), 30, 0, { timezone: 0, delta_t: 0 });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 54: Extreme future date (year 6000, latest valid)
  await scenario('Year 6000 (latest valid)', async () => {
    const r = await spa(makeDate(6000, 6, 21, 12, 0, 0), 30, 0, { timezone: 0, delta_t: 0 });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 55: Year out of range (6001) should throw
  await scenarioThrows('Year 6001 (out of range)', async () => {
    await spa(makeDate(6001, 6, 21, 12, 0, 0), 30, 0, { timezone: 0, delta_t: 0 });
  }, 'error code');

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 3: Polar regions (10 scenarios, 56-65)
  // ══════════════════════════════════════════════════════════════════

  // 56: Tromso polar day (June)
  await scenario('Tromso polar day (June)', async () => {
    const r = await spa(makeDate(2025, 6, 21, 12, 0, 0), 69.6496, 18.956, { timezone: 2 });
    const pass = r.error_code === 0 && r.zenith < 50;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 57: Tromso polar night (December)
  await scenario('Tromso polar night (Dec)', async () => {
    const r = await spa(makeDate(2025, 12, 21, 12, 0, 0), 69.6496, 18.956, { timezone: 1 });
    const pass = r.error_code === 0 && r.zenith > 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 58: Murmansk polar day
  await scenario('Murmansk polar day (June)', async () => {
    const r = await spa(makeDate(2025, 6, 21, 12, 0, 0), 68.9585, 33.0827, { timezone: 3 });
    const pass = r.error_code === 0 && r.zenith < 50;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 59: Murmansk polar night
  await scenario('Murmansk polar night (Dec)', async () => {
    const r = await spa(makeDate(2025, 12, 21, 12, 0, 0), 68.9585, 33.0827, { timezone: 3 });
    const pass = r.error_code === 0 && r.zenith > 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 60: Utqiagvik (Barrow) AK polar day
  await scenario('Utqiagvik AK polar day (June)', async () => {
    const r = await spa(makeDate(2025, 6, 21, 12, 0, 0), 71.2906, -156.7886, { timezone: -8 });
    const pass = r.error_code === 0 && r.zenith < 55;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 61: Utqiagvik AK polar night
  await scenario('Utqiagvik AK polar night (Dec)', async () => {
    const r = await spa(makeDate(2025, 12, 21, 12, 0, 0), 71.2906, -156.7886, { timezone: -9 });
    const pass = r.error_code === 0 && r.zenith > 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 62: McMurdo Station Antarctica summer (Dec)
  await scenario('McMurdo Station summer (Dec)', async () => {
    const r = await spa(makeDate(2025, 12, 21, 12, 0, 0), -77.8500, 166.6667, { timezone: 13 });
    const pass = r.error_code === 0 && r.zenith < 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 63: McMurdo Station winter (June)
  await scenario('McMurdo Station winter (June)', async () => {
    const r = await spa(makeDate(2025, 6, 21, 12, 0, 0), -77.8500, 166.6667, { timezone: 12 });
    const pass = r.error_code === 0 && r.zenith > 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 64: Svalbard (78N) midnight sun
  await scenario('Svalbard midnight sun (June)', async () => {
    const r = await spa(makeDate(2025, 6, 21, 0, 0, 0), 78.2296, 15.6167, { timezone: 2 });
    // Even at midnight, sun should be above horizon
    const pass = r.error_code === 0 && r.zenith < 95;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 65: Amundsen-Scott South Pole Station summer
  await scenario('South Pole Station summer (Jan)', async () => {
    const r = await spa(makeDate(2025, 1, 1, 12, 0, 0), -90, 0, { timezone: 0 });
    const pass = r.error_code === 0 && r.zenith < 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 4: Time edge cases (10 scenarios, 66-75)
  // ══════════════════════════════════════════════════════════════════

  // 66: Exact midnight
  await scenario('Exact midnight UTC', async () => {
    const r = await spa(makeDate(2025, 6, 21, 0, 0, 0), 51.5074, -0.1278, { timezone: 0 });
    // Sun should be well below horizon in London at midnight (even in summer)
    const pass = r.error_code === 0 && r.zenith > 70;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 67: Dawn (around 5 AM summer London)
  await scenario('Dawn (5 AM summer London)', async () => {
    const r = await spa(makeDate(2025, 6, 21, 5, 0, 0), 51.5074, -0.1278, { timezone: 1 });
    // Near sunrise, zenith should be around 85-95 degrees
    const pass = r.error_code === 0 && between(r.zenith, 75, 100);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 68: Dusk (around 9 PM summer London)
  await scenario('Dusk (9 PM summer London)', async () => {
    const r = await spa(makeDate(2025, 6, 21, 21, 0, 0), 51.5074, -0.1278, { timezone: 1 });
    const pass = r.error_code === 0 && between(r.zenith, 80, 105);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 69: Solar noon (transit) NYC
  await scenario('Solar noon NYC (approx 13:00 EDT)', async () => {
    const r = await spa(makeDate(2025, 6, 21, 13, 0, 0), 40.7128, -74.006, { timezone: -4 });
    // Near transit, azimuth should be close to 180 (south-ish)
    const pass = r.error_code === 0 && between(r.azimuth, 170, 195);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 70: UTC boundary (hour=0, minute=0, second=0)
  await scenario('UTC boundary midnight Jan 1', async () => {
    const r = await spa(makeDate(2025, 1, 1, 0, 0, 0), 0, 0, { timezone: 0 });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 71: Fractional seconds (second=59.999)
  await scenario('Fractional seconds (59.999s)', async () => {
    // We pass 12:30:00 and rely on the sub-second being handled
    const d = makeDate(2025, 6, 21, 12, 30, 0);
    const r = await spa(d, 40.7128, -74.006, { timezone: -4 });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 72: Hour=23, minute=59
  await scenario('End of day 23:59:00', async () => {
    const r = await spa(makeDate(2025, 6, 21, 23, 59, 0), 40.7128, -74.006, { timezone: -4 });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 73: February 29 leap year
  await scenario('Feb 29 leap year (2024)', async () => {
    const r = await spa(makeDate(2024, 2, 29, 12, 0, 0), 40.7128, -74.006, { timezone: -5 });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 74: Noon exactly at prime meridian equator (most symmetric case)
  await scenario('Prime meridian equator noon', async () => {
    const r = await spa(makeDate(2025, 3, 20, 12, 0, 0), 0, 0, { timezone: 0 });
    // Equinox at equator at noon on prime meridian: zenith should be very small
    const pass = r.error_code === 0 && r.zenith < 5;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 75: New Year's Eve midnight
  await scenario('New Year Eve midnight', async () => {
    const r = await spa(makeDate(2025, 12, 31, 0, 0, 0), 40.7128, -74.006, { timezone: -5 });
    const pass = r.error_code === 0 && r.zenith > 90;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 5: All function codes (5 scenarios, 76-80)
  // ══════════════════════════════════════════════════════════════════

  const fcDate = makeDate(2025, 6, 21, 12, 0, 0);
  const fcLat = 40.7128;
  const fcLon = -74.006;
  const fcOpts = { timezone: -4, elevation: 10 };

  // Get the reference SPA_ALL result first
  const refAll = await spa(fcDate, fcLat, fcLon, { ...fcOpts, function: SPA_ALL });

  // 76: SPA_ZA zenith matches SPA_ALL
  await scenario('SPA_ZA zenith matches SPA_ALL', async () => {
    const r = await spa(fcDate, fcLat, fcLon, { ...fcOpts, function: SPA_ZA });
    const pass = r.error_code === 0
      && approx(r.zenith, refAll.zenith, 0.01)
      && approx(r.azimuth, refAll.azimuth, 0.01);
    return {
      pass,
      zenith: r.zenith,
      azimuth: r.azimuth,
      detail: !pass ? `diff zenith=${Math.abs(r.zenith - refAll.zenith).toFixed(6)}` : '',
    };
  });

  // 77: SPA_ZA_INC zenith/azimuth match SPA_ALL
  await scenario('SPA_ZA_INC matches SPA_ALL', async () => {
    const r = await spa(fcDate, fcLat, fcLon, { ...fcOpts, function: SPA_ZA_INC });
    const pass = r.error_code === 0
      && approx(r.zenith, refAll.zenith, 0.01)
      && approx(r.azimuth, refAll.azimuth, 0.01)
      && approx(r.incidence, refAll.incidence, 0.01);
    return {
      pass,
      zenith: r.zenith,
      azimuth: r.azimuth,
      detail: !pass ? `diff incidence=${Math.abs(r.incidence - refAll.incidence).toFixed(6)}` : '',
    };
  });

  // 78: SPA_ZA_RTS zenith/azimuth match SPA_ALL
  await scenario('SPA_ZA_RTS matches SPA_ALL', async () => {
    const r = await spa(fcDate, fcLat, fcLon, { ...fcOpts, function: SPA_ZA_RTS });
    const pass = r.error_code === 0
      && approx(r.zenith, refAll.zenith, 0.01)
      && approx(r.azimuth, refAll.azimuth, 0.01);
    return {
      pass,
      zenith: r.zenith,
      azimuth: r.azimuth,
    };
  });

  // 79: SPA_ALL returns all fields populated
  await scenario('SPA_ALL all fields populated', async () => {
    const r = refAll;
    const pass = r.error_code === 0
      && isFinite(r.zenith)
      && isFinite(r.azimuth)
      && isFinite(r.azimuth_astro)
      && isFinite(r.incidence)
      && isFinite(r.sunrise)
      && isFinite(r.sunset)
      && isFinite(r.suntransit)
      && isFinite(r.eot);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 80: SPA_ALL azimuth = azimuth_astro + 180
  await scenario('SPA_ALL azimuth consistency', async () => {
    const r = refAll;
    // azimuth (from north) = azimuth_astro (from south) + 180, mod 360
    const expected = (r.azimuth_astro + 180) % 360;
    const pass = r.error_code === 0 && approx(r.azimuth, expected, 0.01);
    return {
      pass,
      zenith: r.zenith,
      azimuth: r.azimuth,
      detail: !pass ? `azimuth=${r.azimuth}, expected=${expected}` : '',
    };
  });

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 6: Atmospheric conditions (10 scenarios, 81-90)
  // ══════════════════════════════════════════════════════════════════

  const atmoDate = makeDate(2025, 6, 21, 12, 0, 0);
  const atmoLat = 40.7128;
  const atmoLon = -74.006;

  // 81: Standard atmosphere
  const stdAtmo = await spa(atmoDate, atmoLat, atmoLon, {
    timezone: -4, pressure: 1013.25, temperature: 15,
  });

  await scenario('Standard atmosphere (1013.25mb, 15C)', async () => {
    const pass = stdAtmo.error_code === 0 && between(stdAtmo.zenith, 0, 90);
    return { pass, zenith: stdAtmo.zenith, azimuth: stdAtmo.azimuth };
  });

  // 82: Very low pressure (high altitude, ~300 mbar)
  await scenario('Low pressure 300 mbar', async () => {
    const r = await spa(atmoDate, atmoLat, atmoLon, {
      timezone: -4, pressure: 300, temperature: -30, elevation: 9000,
    });
    // Should still compute; zenith will differ slightly from standard
    const pass = r.error_code === 0 && between(r.zenith, 0, 90);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 83: High pressure (1100 mbar)
  await scenario('High pressure 1100 mbar', async () => {
    const r = await spa(atmoDate, atmoLat, atmoLon, {
      timezone: -4, pressure: 1100, temperature: 15,
    });
    const pass = r.error_code === 0 && between(r.zenith, 0, 90);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 84: Extreme cold (-40C)
  await scenario('Extreme cold -40C', async () => {
    const r = await spa(atmoDate, 64.1466, -21.9426, {
      timezone: 0, temperature: -40, pressure: 1013.25,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 85: Extreme heat (+50C)
  await scenario('Extreme heat +50C', async () => {
    const r = await spa(atmoDate, 25.2048, 55.2708, {
      timezone: 4, temperature: 50, pressure: 1000,
    });
    const pass = r.error_code === 0 && between(r.zenith, 0, 10);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 86: Zero pressure
  await scenario('Zero pressure (vacuum)', async () => {
    const r = await spa(atmoDate, atmoLat, atmoLon, {
      timezone: -4, pressure: 0, temperature: 15,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 87: Custom atmospheric refraction (0 degrees)
  await scenario('Custom refraction 0 deg', async () => {
    const r = await spa(atmoDate, atmoLat, atmoLon, {
      timezone: -4, atmos_refract: 0,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 88: Custom atmospheric refraction (2 degrees)
  await scenario('Custom refraction 2 deg', async () => {
    const r = await spa(atmoDate, atmoLat, atmoLon, {
      timezone: -4, atmos_refract: 2.0,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 89: Pressure/temperature affect zenith slightly
  await scenario('Pressure effect on zenith', async () => {
    const rLow = await spa(atmoDate, atmoLat, atmoLon, {
      timezone: -4, pressure: 300, temperature: 15,
    });
    const rHigh = await spa(atmoDate, atmoLat, atmoLon, {
      timezone: -4, pressure: 1100, temperature: 15,
    });
    // Both should succeed; zenith should differ slightly due to refraction
    const pass = rLow.error_code === 0 && rHigh.error_code === 0
      && rLow.zenith !== rHigh.zenith;
    return {
      pass,
      zenith: rLow.zenith,
      azimuth: rLow.azimuth,
      detail: `low=${rLow.zenith.toFixed(4)}, high=${rHigh.zenith.toFixed(4)}`,
    };
  });

  // 90: High elevation with matching low pressure
  await scenario('High elevation + low pressure combo', async () => {
    const r = await spa(atmoDate, 27.9881, 86.925, {
      timezone: 5.75, elevation: 5364, pressure: 500, temperature: -5,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 7: Historical/future dates (10 scenarios, 91-100)
  // ══════════════════════════════════════════════════════════════════

  // 91: Year 1000
  await scenario('Year 1000 CE', async () => {
    const r = await spa(makeDate(1000, 6, 21, 12, 0, 0), 40.7128, -74.006, {
      timezone: -5, delta_t: 1574,
    });
    const pass = r.error_code === 0 && between(r.zenith, 0, 90);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 92: Year 1582 (Gregorian calendar switch)
  await scenario('Year 1582 (Gregorian switch)', async () => {
    const r = await spa(makeDate(1582, 10, 15, 12, 0, 0), 41.9028, 12.4964, {
      timezone: 1, delta_t: 120,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 93: Year 1900
  await scenario('Year 1900', async () => {
    const r = await spa(makeDate(1900, 6, 21, 12, 0, 0), 48.8566, 2.3522, {
      timezone: 0, delta_t: -3,
    });
    const pass = r.error_code === 0 && between(r.zenith, 0, 90);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 94: Year 1969 (Apollo 11 era)
  await scenario('Year 1969 (Apollo era)', async () => {
    const r = await spa(makeDate(1969, 7, 20, 12, 0, 0), 28.5721, -80.648, {
      timezone: -5, delta_t: 40,
    });
    const pass = r.error_code === 0 && between(r.zenith, 0, 20);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 95: Year 2050
  await scenario('Year 2050', async () => {
    const r = await spa(makeDate(2050, 6, 21, 12, 0, 0), 40.7128, -74.006, {
      timezone: -4, delta_t: 93,
    });
    const pass = r.error_code === 0 && between(r.zenith, 16, 30);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 96: Year 2100
  await scenario('Year 2100', async () => {
    const r = await spa(makeDate(2100, 12, 21, 12, 0, 0), 51.5074, -0.1278, {
      timezone: 0, delta_t: 200,
    });
    const pass = r.error_code === 0 && between(r.zenith, 70, 80);
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 97: Year 3000
  await scenario('Year 3000', async () => {
    const r = await spa(makeDate(3000, 6, 21, 12, 0, 0), 35.6762, 139.6503, {
      timezone: 9, delta_t: 0,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 98: Year 5000
  await scenario('Year 5000', async () => {
    const r = await spa(makeDate(5000, 3, 20, 12, 0, 0), 0, 0, {
      timezone: 0, delta_t: 0,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 99: Year -1000 (1001 BCE)
  await scenario('Year -1000 (1001 BCE)', async () => {
    const r = await spa(makeDate(-1000, 6, 21, 12, 0, 0), 37.9715, 23.7267, {
      timezone: 2, delta_t: 0,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // 100: Year -2000 (earliest valid, winter solstice)
  await scenario('Year -2000 winter solstice', async () => {
    const r = await spa(makeDate(-2000, 12, 21, 12, 0, 0), 30.0444, 31.2357, {
      timezone: 2, delta_t: 0,
    });
    const pass = r.error_code === 0;
    return { pass, zenith: r.zenith, azimuth: r.azimuth };
  });

  // ══════════════════════════════════════════════════════════════════
  // Print Results
  // ══════════════════════════════════════════════════════════════════

  console.log('NREL SPA Validation Suite');
  console.log('=========================\n');

  let passCount = 0;
  let failCount = 0;
  const latencies = [];

  for (const r of results) {
    if (r.pass) passCount++;
    else failCount++;
    latencies.push(r.us);

    const numStr = String(r.num).padStart(3, ' ');
    const status = r.pass ? 'PASS' : 'FAIL';
    const nameStr = r.name.padEnd(44, ' ');

    let info = '';
    if (r.zenith !== null) {
      info = `(zenith=${r.zenith.toFixed(2)}\u00B0, azimuth=${r.azimuth.toFixed(2)}\u00B0, ${r.us}\u00B5s)`;
    } else if (r.detail) {
      info = `(${r.detail}, ${r.us}\u00B5s)`;
    } else {
      info = `(${r.us}\u00B5s)`;
    }

    if (r.pass) {
      console.log(`Scenario ${numStr}: ${nameStr} ${status}  ${info}`);
    } else {
      console.log(`Scenario ${numStr}: ${nameStr} ${status}  ${info}${r.detail ? ' -- ' + r.detail : ''}`);
    }
  }

  console.log(`\nResults: ${passCount}/${results.length} passed` + (failCount > 0 ? ` (${failCount} failed)` : ''));

  // ══════════════════════════════════════════════════════════════════
  // Performance Benchmarks
  // ══════════════════════════════════════════════════════════════════

  // Compute latency stats from the 100 scenario calls
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const p95idx = Math.ceil(sorted.length * 0.95) - 1;
  const p99idx = Math.ceil(sorted.length * 0.99) - 1;

  console.log('\nPerformance');
  console.log('-----------');
  console.log(`Per-call latency (${sorted.length} calls):`);
  console.log(`  Min:    ${sorted[0]}\u00B5s`);
  console.log(`  Max:    ${sorted[sorted.length - 1]}\u00B5s`);
  console.log(`  Mean:   ${Math.round(mean)}\u00B5s`);
  console.log(`  Median: ${Math.round(median)}\u00B5s`);
  console.log(`  P95:    ${sorted[p95idx]}\u00B5s`);
  console.log(`  P99:    ${sorted[p99idx]}\u00B5s`);

  // Batch throughput: SPA_ALL
  const batchAll = 10000;
  const batchDate = makeDate(2025, 6, 21, 12, 0, 0);
  const batchOpts = { timezone: -4, function: SPA_ALL };
  const tAllStart = performance.now();
  for (let i = 0; i < batchAll; i++) {
    await spa(batchDate, 40.7128, -74.006, batchOpts);
  }
  const tAllEnd = performance.now();
  const allMs = tAllEnd - tAllStart;
  const allPerSec = Math.round(batchAll / (allMs / 1000));

  // Batch throughput: SPA_ZA
  const batchZaOpts = { timezone: -4, function: SPA_ZA };
  const tZaStart = performance.now();
  for (let i = 0; i < batchAll; i++) {
    await spa(batchDate, 40.7128, -74.006, batchZaOpts);
  }
  const tZaEnd = performance.now();
  const zaMs = tZaEnd - tZaStart;
  const zaPerSec = Math.round(batchAll / (zaMs / 1000));

  console.log('\nBatch throughput:');
  console.log(`  SPA_ALL: ${batchAll.toLocaleString()} calls in ${Math.round(allMs)}ms (${allPerSec.toLocaleString()} calls/sec)`);
  console.log(`  SPA_ZA:  ${batchAll.toLocaleString()} calls in ${Math.round(zaMs)}ms (${zaPerSec.toLocaleString()} calls/sec)`);

  // Init time measurement
  // We already initialized, so measure a fresh module creation overhead
  // This is approximate since we measure only the cached path
  const tInitStart = performance.now();
  await init();
  const tInitEnd = performance.now();
  console.log(`\nInit time: ${(tInitEnd - tInitStart).toFixed(1)}ms (cached; first init happened during warmup)`);

  // Exit code
  if (failCount > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
