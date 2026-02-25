'use strict';

const { spa, spaFormatted, formatTime, init, SPA_ZA, SPA_ALL } = require('./dist/index.cjs');

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

async function run() {
  console.log('CJS smoke test\n');

  // Verify all exports are available
  assert(typeof spa === 'function', 'spa is a function');
  assert(typeof spaFormatted === 'function', 'spaFormatted is a function');
  assert(typeof formatTime === 'function', 'formatTime is a function');
  assert(typeof init === 'function', 'init is a function');
  assert(SPA_ZA === 0, 'SPA_ZA constant is 0');
  assert(SPA_ALL === 3, 'SPA_ALL constant is 3');

  // Core calculation
  const result = await spa(
    new Date(2023, 3, 1, 0, 0, 0),
    40.7128, -74.006,
    { timezone: -4, elevation: 10 },
  );
  assert(result.error_code === 0, 'calculation succeeds');
  assert(result.zenith > 0, 'zenith is positive');
  assert(result.azimuth > 0, 'azimuth is positive');
  assert(result.sunrise > 0, 'sunrise is positive');

  // Formatted output
  const fmt = await spaFormatted(
    new Date(2023, 3, 1, 12, 0, 0),
    40.7128, -74.006,
    { timezone: -4 },
  );
  assert(typeof fmt.sunrise === 'string', 'formatted sunrise is a string');
  assert(/^\d{2}:\d{2}:\d{2}$/.test(fmt.sunrise), 'sunrise matches HH:MM:SS');

  // formatTime
  assert(formatTime(6.5) === '06:30:00', 'formatTime works');

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
