import { spa, spaFormatted, formatTime, init, SPA_ZA, SPA_ZA_INC, SPA_ZA_RTS, SPA_ALL } from './dist/index.mjs';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error('  FAIL: ' + message);
  }
}

function approx(actual, expected, tolerance, label) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, label + ': expected ' + expected + ', got ' + actual + ' (diff: ' + diff.toFixed(6) + ')');
}

async function assertThrows(fn, check, label) {
  try {
    await fn();
    assert(false, label + ': should have thrown');
  } catch (e) {
    if (check) {
      assert(check(e), label + ': ' + e.message);
    } else {
      passed++;
    }
  }
}

async function run() {
  console.log('solar-spa test suite\n');

  // ── Test 1: New York City, April 1 2023 ──
  console.log('1. NYC, April 1 2023, midnight local (UTC-4)');
  const nyc = await spa(
    new Date(2023, 3, 1, 0, 0, 0),
    40.7128, -74.006,
    { timezone: -4, elevation: 10, temperature: 20, pressure: 1013.25 },
  );
  approx(nyc.zenith, 132.82, 0.1, 'zenith');
  approx(nyc.azimuth, 339.38, 0.1, 'azimuth');
  approx(nyc.sunrise, 6.665, 0.01, 'sunrise');
  approx(nyc.sunset, 19.343, 0.01, 'sunset');
  approx(nyc.suntransit, 12.998, 0.01, 'solar noon');
  approx(nyc.sun_transit_alt, 53.916, 0.1, 'transit altitude');
  assert(nyc.error_code === 0, 'error_code is 0');

  // ── Test 2: London, Summer Solstice ──
  console.log('2. London, June 21 2025, noon UTC');
  const london = await spa(
    new Date(2025, 5, 21, 12, 0, 0),
    51.5074, -0.1278,
    { timezone: 0, elevation: 11, temperature: 18 },
  );
  assert(london.zenith < 30, 'zenith near noon is below 30 degrees');
  assert(london.azimuth > 170 && london.azimuth < 200, 'azimuth roughly south at noon');
  assert(london.sunrise > 3 && london.sunrise < 6, 'sunrise between 3 and 6');
  assert(london.sunset > 19 && london.sunset < 23, 'sunset between 19 and 23');
  assert(london.error_code === 0, 'error_code is 0');

  // ── Test 3: Equator, Equinox ──
  console.log('3. Quito (equator), March 20 2025, noon UTC-5');
  const quito = await spa(
    new Date(2025, 2, 20, 12, 0, 0),
    -0.1807, -78.4678,
    { timezone: -5, elevation: 2850 },
  );
  assert(quito.zenith < 20, 'near-overhead sun at equinox on equator');
  assert(quito.error_code === 0, 'error_code is 0');

  // ── Test 4: Sydney, Winter ──
  console.log('4. Sydney, June 21 2025 (winter), noon AEST');
  const sydney = await spa(
    new Date(2025, 5, 21, 12, 0, 0),
    -33.8688, 151.2093,
    { timezone: 10 },
  );
  assert(sydney.zenith > 50, 'low sun in southern winter');
  assert(sydney.sunrise > 6 && sydney.sunrise < 8, 'winter sunrise after 6');
  assert(sydney.error_code === 0, 'error_code is 0');

  // ── Test 5: Formatted output ──
  console.log('5. Formatted output (NYC)');
  const fmt = await spaFormatted(
    new Date(2023, 3, 1, 0, 0, 0),
    40.7128, -74.006,
    { timezone: -4, elevation: 10, temperature: 20, pressure: 1013.25 },
  );
  assert(typeof fmt.sunrise === 'string', 'sunrise is a string');
  assert(typeof fmt.sunset === 'string', 'sunset is a string');
  assert(typeof fmt.suntransit === 'string', 'suntransit is a string');
  assert(/^\d{2}:\d{2}:\d{2}$/.test(fmt.sunrise), 'sunrise matches HH:MM:SS');
  assert(typeof fmt.zenith === 'number', 'zenith remains numeric');
  assert(typeof fmt.error_code === 'number', 'error_code is present in formatted result');

  // ── Test 6: formatTime utility ──
  console.log('6. formatTime utility');
  assert(formatTime(0) === '00:00:00', 'midnight');
  assert(formatTime(12) === '12:00:00', 'noon');
  assert(formatTime(6.5) === '06:30:00', '6.5 hours');
  assert(formatTime(23.9997) === '23:59:59', 'end of day');
  assert(formatTime(Infinity) === 'N/A', 'Infinity returns N/A');
  assert(formatTime(-Infinity) === 'N/A', '-Infinity returns N/A');
  assert(formatTime(NaN) === 'N/A', 'NaN returns N/A');
  assert(formatTime(-1) === 'N/A', 'negative returns N/A');
  assert(formatTime(-0.5) === 'N/A', 'negative fractional returns N/A');
  assert(formatTime(24.0) === '00:00:00', '24h wraps to midnight');
  assert(formatTime(24.5) === '00:30:00', '24.5h wraps to 00:30');

  // ── Test 7: SPA error handling ──
  console.log('7. SPA error handling');
  await assertThrows(
    () => spa(new Date(2023, 0, 1), 40, -74, { timezone: 100 }),
    (e) => e.message.includes('error code'),
    'invalid timezone throws with error code',
  );

  // ── Test 8: Input validation ──
  console.log('8. Input validation');
  await assertThrows(
    () => spa(null, 40, -74),
    (e) => e instanceof TypeError,
    'null date throws TypeError',
  );
  await assertThrows(
    () => spa(new Date('invalid'), 40, -74),
    (e) => e instanceof TypeError,
    'invalid date throws TypeError',
  );
  await assertThrows(
    () => spa(new Date(), 'forty', -74),
    (e) => e instanceof TypeError,
    'string latitude throws TypeError',
  );
  await assertThrows(
    () => spa(new Date(), 40, undefined),
    (e) => e instanceof TypeError,
    'undefined longitude throws TypeError',
  );
  await assertThrows(
    () => spa(new Date(), 91, -74),
    (e) => e instanceof RangeError,
    'latitude > 90 throws RangeError',
  );
  await assertThrows(
    () => spa(new Date(), -91, -74),
    (e) => e instanceof RangeError,
    'latitude < -90 throws RangeError',
  );
  await assertThrows(
    () => spa(new Date(), 40, 181),
    (e) => e instanceof RangeError,
    'longitude > 180 throws RangeError',
  );
  await assertThrows(
    () => spa(new Date(), 40, -181),
    (e) => e instanceof RangeError,
    'longitude < -180 throws RangeError',
  );

  // ── Test 9: Function code selection ──
  console.log('9. Function code SPA_ZA (zenith/azimuth only)');
  const za = await spa(
    new Date(2023, 3, 1, 12, 0, 0),
    40.7128, -74.006,
    { timezone: -4, function: SPA_ZA },
  );
  assert(za.zenith > 0, 'zenith computed');
  assert(za.azimuth > 0, 'azimuth computed');
  assert(za.error_code === 0, 'error_code is 0');

  // ── Test 10: Repeated calls (verify singleton init) ──
  console.log('10. Repeated calls');
  const a = await spa(new Date(2023, 0, 1, 12, 0, 0), 40, -74, { timezone: -5 });
  const b = await spa(new Date(2023, 6, 1, 12, 0, 0), 40, -74, { timezone: -4 });
  assert(a.zenith !== b.zenith, 'different dates produce different results');
  assert(a.error_code === 0 && b.error_code === 0, 'both succeed');

  // ── Test 11: Concurrent calls (verify init dedup) ──
  console.log('11. Concurrent calls');
  const [c1, c2, c3] = await Promise.all([
    spa(new Date(2023, 0, 1, 12, 0, 0), 40, -74, { timezone: -5 }),
    spa(new Date(2023, 3, 1, 12, 0, 0), 40, -74, { timezone: -4 }),
    spa(new Date(2023, 6, 1, 12, 0, 0), 40, -74, { timezone: -4 }),
  ]);
  assert(c1.error_code === 0 && c2.error_code === 0 && c3.error_code === 0, 'all three concurrent calls succeed');
  assert(c1.zenith !== c2.zenith, 'concurrent results differ by date');

  // ── Test 12: Boundary coordinates ──
  console.log('12. Boundary coordinates');
  const northPole = await spa(new Date(2025, 5, 21, 12, 0, 0), 90, 0, { timezone: 0 });
  assert(northPole.error_code === 0, 'north pole succeeds');
  const southPole = await spa(new Date(2025, 5, 21, 12, 0, 0), -90, 0, { timezone: 0 });
  assert(southPole.error_code === 0, 'south pole succeeds');
  const dateLine = await spa(new Date(2025, 5, 21, 12, 0, 0), 0, 180, { timezone: 12 });
  assert(dateLine.error_code === 0, 'date line (180) succeeds');
  const dateLineNeg = await spa(new Date(2025, 5, 21, 12, 0, 0), 0, -180, { timezone: -12 });
  assert(dateLineNeg.error_code === 0, 'date line (-180) succeeds');

  // ── Test 13: Arctic polar day (sun never sets) ──
  console.log('13. Arctic polar day');
  const tromso = await spa(
    new Date(2025, 5, 21, 12, 0, 0),
    69.6496, 18.9560,
    { timezone: 2 },
  );
  assert(tromso.error_code === 0, 'Tromso summer succeeds');
  // During polar day, sunrise/sunset values from SPA may be non-standard
  // The key is that the computation succeeds and zenith is low (sun is up)
  assert(tromso.zenith < 50, 'sun is high at Tromso in summer');

  // ── Test 14: Explicit init() call ──
  console.log('14. Explicit init()');
  await init(); // should be a no-op since module is already loaded
  const afterInit = await spa(new Date(2023, 0, 1, 12, 0, 0), 40, -74, { timezone: -5 });
  assert(afterInit.error_code === 0, 'spa works after explicit init');

  // ── Test 15: Constants are correct ──
  console.log('15. Constants');
  assert(SPA_ZA === 0, 'SPA_ZA is 0');
  assert(SPA_ZA_INC === 1, 'SPA_ZA_INC is 1');
  assert(SPA_ZA_RTS === 2, 'SPA_ZA_RTS is 2');
  assert(SPA_ALL === 3, 'SPA_ALL is 3');

  // ── Test 16: Historical date ──
  console.log('16. Historical date (year 1000)');
  const historical = await spa(
    new Date(1000, 5, 21, 12, 0, 0),
    40.7128, -74.006,
    { timezone: -5, delta_t: 1574 },
  );
  assert(historical.error_code === 0, 'historical date succeeds');
  assert(historical.zenith > 0 && historical.zenith < 90, 'historical zenith is reasonable');

  // ── Test 17: All function codes ──
  console.log('17. All function codes');
  const zaRes = await spa(new Date(2023, 3, 1, 12, 0, 0), 40, -74, { timezone: -4, function: SPA_ZA });
  const zaIncRes = await spa(new Date(2023, 3, 1, 12, 0, 0), 40, -74, { timezone: -4, function: SPA_ZA_INC });
  const zaRtsRes = await spa(new Date(2023, 3, 1, 12, 0, 0), 40, -74, { timezone: -4, function: SPA_ZA_RTS });
  const allRes = await spa(new Date(2023, 3, 1, 12, 0, 0), 40, -74, { timezone: -4, function: SPA_ALL });
  assert(zaRes.error_code === 0, 'SPA_ZA succeeds');
  assert(zaIncRes.error_code === 0, 'SPA_ZA_INC succeeds');
  assert(zaRtsRes.error_code === 0, 'SPA_ZA_RTS succeeds');
  assert(allRes.error_code === 0, 'SPA_ALL succeeds');
  approx(zaRes.zenith, allRes.zenith, 0.001, 'zenith consistent across function codes');

  // ── Results ──
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

run().catch(function (err) {
  console.error(err);
  process.exit(1);
});
