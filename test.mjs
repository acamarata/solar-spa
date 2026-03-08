import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spa, spaFormatted, formatTime, init, SPA_ZA, SPA_ZA_INC, SPA_ZA_RTS, SPA_ALL } from './dist/index.mjs';

function approx(actual, expected, tolerance, label) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tolerance, `${label}: expected ${expected}, got ${actual} (diff: ${diff.toFixed(6)})`);
}

describe('spa()', () => {
  it('NYC, April 1 2023, midnight local (UTC-4)', async () => {
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
    assert.equal(nyc.error_code, 0);
  });

  it('London, June 21 2025, noon UTC', async () => {
    const london = await spa(
      new Date(2025, 5, 21, 12, 0, 0),
      51.5074, -0.1278,
      { timezone: 0, elevation: 11, temperature: 18 },
    );
    assert.ok(london.zenith < 30, 'zenith near noon is below 30 degrees');
    assert.ok(london.azimuth > 170 && london.azimuth < 200, 'azimuth roughly south at noon');
    assert.ok(london.sunrise > 3 && london.sunrise < 6, 'sunrise between 3 and 6');
    assert.ok(london.sunset > 19 && london.sunset < 23, 'sunset between 19 and 23');
    assert.equal(london.error_code, 0);
  });

  it('Quito (equator), March 20 2025, noon UTC-5', async () => {
    const quito = await spa(
      new Date(2025, 2, 20, 12, 0, 0),
      -0.1807, -78.4678,
      { timezone: -5, elevation: 2850 },
    );
    assert.ok(quito.zenith < 20, 'near-overhead sun at equinox on equator');
    assert.equal(quito.error_code, 0);
  });

  it('Sydney, June 21 2025 (winter), noon AEST', async () => {
    const sydney = await spa(
      new Date(2025, 5, 21, 12, 0, 0),
      -33.8688, 151.2093,
      { timezone: 10 },
    );
    assert.ok(sydney.zenith > 50, 'low sun in southern winter');
    assert.ok(sydney.sunrise > 6 && sydney.sunrise < 8, 'winter sunrise after 6');
    assert.equal(sydney.error_code, 0);
  });

  it('repeated calls produce different results', async () => {
    const a = await spa(new Date(2023, 0, 1, 12, 0, 0), 40, -74, { timezone: -5 });
    const b = await spa(new Date(2023, 6, 1, 12, 0, 0), 40, -74, { timezone: -4 });
    assert.notEqual(a.zenith, b.zenith);
    assert.equal(a.error_code, 0);
    assert.equal(b.error_code, 0);
  });

  it('concurrent calls all succeed', async () => {
    const [c1, c2, c3] = await Promise.all([
      spa(new Date(2023, 0, 1, 12, 0, 0), 40, -74, { timezone: -5 }),
      spa(new Date(2023, 3, 1, 12, 0, 0), 40, -74, { timezone: -4 }),
      spa(new Date(2023, 6, 1, 12, 0, 0), 40, -74, { timezone: -4 }),
    ]);
    assert.equal(c1.error_code, 0);
    assert.equal(c2.error_code, 0);
    assert.equal(c3.error_code, 0);
    assert.notEqual(c1.zenith, c2.zenith);
  });

  it('boundary coordinates (poles and date line)', async () => {
    const northPole = await spa(new Date(2025, 5, 21, 12, 0, 0), 90, 0, { timezone: 0 });
    assert.equal(northPole.error_code, 0);
    const southPole = await spa(new Date(2025, 5, 21, 12, 0, 0), -90, 0, { timezone: 0 });
    assert.equal(southPole.error_code, 0);
    const dateLine = await spa(new Date(2025, 5, 21, 12, 0, 0), 0, 180, { timezone: 12 });
    assert.equal(dateLine.error_code, 0);
    const dateLineNeg = await spa(new Date(2025, 5, 21, 12, 0, 0), 0, -180, { timezone: -12 });
    assert.equal(dateLineNeg.error_code, 0);
  });

  it('arctic polar day', async () => {
    const tromso = await spa(
      new Date(2025, 5, 21, 12, 0, 0),
      69.6496, 18.9560,
      { timezone: 2 },
    );
    assert.equal(tromso.error_code, 0);
    assert.ok(tromso.zenith < 50, 'sun is high at Tromso in summer');
  });

  it('historical date (year 1000)', async () => {
    const historical = await spa(
      new Date(1000, 5, 21, 12, 0, 0),
      40.7128, -74.006,
      { timezone: -5, delta_t: 1574 },
    );
    assert.equal(historical.error_code, 0);
    assert.ok(historical.zenith > 0 && historical.zenith < 90, 'historical zenith is reasonable');
  });
});

describe('function codes', () => {
  it('SPA_ZA computes zenith and azimuth', async () => {
    const res = await spa(new Date(2023, 3, 1, 12, 0, 0), 40, -74, { timezone: -4, function: SPA_ZA });
    assert.ok(res.zenith > 0);
    assert.ok(res.azimuth > 0);
    assert.equal(res.error_code, 0);
  });

  it('all function codes succeed with consistent zenith', async () => {
    const args = [new Date(2023, 3, 1, 12, 0, 0), 40, -74];
    const opts = { timezone: -4 };
    const zaRes = await spa(...args, { ...opts, function: SPA_ZA });
    const zaIncRes = await spa(...args, { ...opts, function: SPA_ZA_INC });
    const zaRtsRes = await spa(...args, { ...opts, function: SPA_ZA_RTS });
    const allRes = await spa(...args, { ...opts, function: SPA_ALL });
    assert.equal(zaRes.error_code, 0);
    assert.equal(zaIncRes.error_code, 0);
    assert.equal(zaRtsRes.error_code, 0);
    assert.equal(allRes.error_code, 0);
    approx(zaRes.zenith, allRes.zenith, 0.001, 'zenith consistent across function codes');
  });
});

describe('spaFormatted()', () => {
  it('returns formatted time strings', async () => {
    const fmt = await spaFormatted(
      new Date(2023, 3, 1, 0, 0, 0),
      40.7128, -74.006,
      { timezone: -4, elevation: 10, temperature: 20, pressure: 1013.25 },
    );
    assert.equal(typeof fmt.sunrise, 'string');
    assert.equal(typeof fmt.sunset, 'string');
    assert.equal(typeof fmt.suntransit, 'string');
    assert.match(fmt.sunrise, /^\d{2}:\d{2}:\d{2}$/);
    assert.equal(typeof fmt.zenith, 'number');
    assert.equal(typeof fmt.error_code, 'number');
  });
});

describe('formatTime()', () => {
  it('formats standard values', () => {
    assert.equal(formatTime(0), '00:00:00');
    assert.equal(formatTime(12), '12:00:00');
    assert.equal(formatTime(6.5), '06:30:00');
    assert.equal(formatTime(23.9997), '23:59:59');
  });

  it('wraps at 24h', () => {
    assert.equal(formatTime(24.0), '00:00:00');
    assert.equal(formatTime(24.5), '00:30:00');
  });

  it('returns N/A for invalid inputs', () => {
    assert.equal(formatTime(Infinity), 'N/A');
    assert.equal(formatTime(-Infinity), 'N/A');
    assert.equal(formatTime(NaN), 'N/A');
    assert.equal(formatTime(-1), 'N/A');
    assert.equal(formatTime(-0.5), 'N/A');
  });
});

describe('input validation', () => {
  it('rejects null date', async () => {
    await assert.rejects(() => spa(null, 40, -74), TypeError);
  });

  it('rejects invalid date', async () => {
    await assert.rejects(() => spa(new Date('invalid'), 40, -74), TypeError);
  });

  it('rejects string latitude', async () => {
    await assert.rejects(() => spa(new Date(), 'forty', -74), TypeError);
  });

  it('rejects undefined longitude', async () => {
    await assert.rejects(() => spa(new Date(), 40, undefined), TypeError);
  });

  it('rejects latitude > 90', async () => {
    await assert.rejects(() => spa(new Date(), 91, -74), RangeError);
  });

  it('rejects latitude < -90', async () => {
    await assert.rejects(() => spa(new Date(), -91, -74), RangeError);
  });

  it('rejects longitude > 180', async () => {
    await assert.rejects(() => spa(new Date(), 40, 181), RangeError);
  });

  it('rejects longitude < -180', async () => {
    await assert.rejects(() => spa(new Date(), 40, -181), RangeError);
  });

  it('rejects invalid timezone in SPA engine', async () => {
    await assert.rejects(
      () => spa(new Date(2023, 0, 1), 40, -74, { timezone: 100 }),
      (err) => err.message.includes('error code'),
    );
  });
});

describe('option validation', () => {
  it('rejects non-number elevation', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { elevation: 'high' }), TypeError);
  });

  it('rejects Infinity pressure', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { pressure: Infinity }), RangeError);
  });

  it('rejects NaN temperature', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { temperature: NaN }), RangeError);
  });

  it('rejects non-number delta_t', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { delta_t: true }), TypeError);
  });

  it('rejects non-number slope', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { slope: null }), TypeError);
  });

  it('rejects Infinity azm_rotation', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { azm_rotation: -Infinity }), RangeError);
  });

  it('rejects non-number atmos_refract', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { atmos_refract: '0.5667' }), TypeError);
  });

  it('accepts valid numeric options', async () => {
    const result = await spa(new Date(2023, 3, 1, 12, 0, 0), 40, -74, {
      timezone: -4,
      elevation: 100,
      pressure: 1000,
      temperature: 25,
      delta_t: 69,
      slope: 10,
      azm_rotation: 180,
      atmos_refract: 0.5,
    });
    assert.equal(result.error_code, 0);
  });
});

describe('init()', () => {
  it('explicit init is a no-op after module is loaded', async () => {
    await init();
    const result = await spa(new Date(2023, 0, 1, 12, 0, 0), 40, -74, { timezone: -5 });
    assert.equal(result.error_code, 0);
  });
});

describe('constants', () => {
  it('SPA_ZA is 0', () => assert.equal(SPA_ZA, 0));
  it('SPA_ZA_INC is 1', () => assert.equal(SPA_ZA_INC, 1));
  it('SPA_ZA_RTS is 2', () => assert.equal(SPA_ZA_RTS, 2));
  it('SPA_ALL is 3', () => assert.equal(SPA_ALL, 3));
});
