'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { spa, spaFormatted, formatTime, init, SPA_ZA, SPA_ALL } = require('./dist/index.cjs');

describe('CJS exports', () => {
  it('all exports are available', () => {
    assert.equal(typeof spa, 'function');
    assert.equal(typeof spaFormatted, 'function');
    assert.equal(typeof formatTime, 'function');
    assert.equal(typeof init, 'function');
    assert.equal(SPA_ZA, 0);
    assert.equal(SPA_ALL, 3);
  });
});

describe('CJS spa()', () => {
  it('core calculation succeeds', async () => {
    const result = await spa(
      new Date(2023, 3, 1, 0, 0, 0),
      40.7128, -74.006,
      { timezone: -4, elevation: 10 },
    );
    assert.equal(result.error_code, 0);
    assert.ok(result.zenith > 0);
    assert.ok(result.azimuth > 0);
    assert.ok(result.sunrise > 0);
  });
});

describe('CJS spaFormatted()', () => {
  it('returns formatted time strings', async () => {
    const fmt = await spaFormatted(
      new Date(2023, 3, 1, 12, 0, 0),
      40.7128, -74.006,
      { timezone: -4 },
    );
    assert.equal(typeof fmt.sunrise, 'string');
    assert.match(fmt.sunrise, /^\d{2}:\d{2}:\d{2}$/);
  });
});

describe('CJS formatTime()', () => {
  it('formats correctly', () => {
    assert.equal(formatTime(6.5), '06:30:00');
  });
});

describe('CJS option validation', () => {
  it('rejects non-number elevation', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { elevation: 'high' }), TypeError);
  });

  it('rejects Infinity pressure', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { pressure: Infinity }), RangeError);
  });

  it('rejects NaN temperature', async () => {
    await assert.rejects(() => spa(new Date(), 40, -74, { temperature: NaN }), RangeError);
  });

  it('accepts valid numeric options', async () => {
    const result = await spa(new Date(2023, 3, 1, 12, 0, 0), 40, -74, {
      timezone: -4,
      elevation: 100,
      pressure: 1000,
      temperature: 25,
    });
    assert.equal(result.error_code, 0);
  });
});
