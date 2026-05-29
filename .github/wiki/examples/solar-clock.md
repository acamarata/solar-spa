# Example: Solar Clock

A simple Node.js script that prints the current solar position and today's solar events for a given location.

```js
import { spa, spaFormatted, init } from 'solar-spa';

const LAT = 40.7128;  // New York
const LON = -74.0060;
const TZ = -4;        // EDT

await init();

const now = new Date();
const raw = await spa(now, LAT, LON, { timezone: TZ });
const formatted = await spaFormatted(now, LAT, LON, { timezone: TZ });

console.log('Solar position right now');
console.log(`  Zenith:  ${raw.zenith.toFixed(2)}°`);
console.log(`  Azimuth: ${raw.azimuth.toFixed(2)}°`);
console.log('');
console.log('Today\'s solar events');
console.log(`  Sunrise:   ${formatted.sunrise}`);
console.log(`  Solar noon: ${formatted.suntransit}`);
console.log(`  Sunset:    ${formatted.sunset}`);
console.log(`  Day length: ${(raw.sunset - raw.sunrise).toFixed(2)} hours`);
```

Sample output for a summer day in New York:

```
Solar position right now
  Zenith:  28.14°
  Azimuth: 214.33°

Today's solar events
  Sunrise:   05:25:12
  Solar noon: 12:59:58
  Sunset:    20:34:47
  Day length: 15.16 hours
```
