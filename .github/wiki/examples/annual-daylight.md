# Example: Annual Daylight Hours

Compute total daylight hours for every day of a year and find the longest and shortest days.

```js
import { init, spa } from 'solar-spa';

const LAT = 51.5074; // London
const LON = -0.1278;
const TZ = 0;

await init();

const year = 2025;
const results = [];

for (let doy = 0; doy < 365; doy++) {
  const date = new Date(Date.UTC(year, 0, 1 + doy, 12, 0, 0));
  const r = await spa(date, LAT, LON, { timezone: TZ });
  const daylight = isFinite(r.sunrise) ? r.sunset - r.sunrise : 0;
  results.push({ date, daylight, sunrise: r.sunrise, sunset: r.sunset });
}

const longest = results.reduce((a, b) => a.daylight > b.daylight ? a : b);
const shortest = results.reduce((a, b) => a.daylight < b.daylight ? a : b);

console.log('London 2025');
console.log(`Longest day:  ${longest.date.toISOString().slice(0, 10)} — ${longest.daylight.toFixed(2)} hours`);
console.log(`Shortest day: ${shortest.date.toISOString().slice(0, 10)} — ${shortest.daylight.toFixed(2)} hours`);

const total = results.reduce((sum, r) => sum + r.daylight, 0);
console.log(`Annual total: ${total.toFixed(0)} hours of daylight`);
```

Sample output:

```
London 2025
Longest day:  2025-06-21 — 16.44 hours
Shortest day: 2025-12-21 — 7.69 hours
Annual total: 4466 hours of daylight
```
