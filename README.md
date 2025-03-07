# solar-spa

The solar-spa package provides a Node.js module for calculating solar position and related parameters using the National Renewable Energy Laboratory (NREL) Solar Position Algorithm (SPA). This implementation uses WebAssembly (WASM) to achieve high performance and accuracy.

The SPA calculates the solar zenith angle, azimuth angle, incidence angle, sunrise time, sunset time, solar noon time, and sun transit altitude for a given date, time, and location.

This is a direct WASM conversion, which has some limitations and bugs in real-world usage, especially when used as an NPM package or within frameworks like Next.js. This repository will remain available for those who need or want it, but it will no longer be maintained by me in favor of the newer **[nrel-spa](https://github.com/acamarata/nrel-spa/)** package going forward.

## Installation

To install the solar-spa package, use the following command:

```sh
npm install solar-spa
```

## Usage

```
const spa = require('solar-spa');

// Define input parameters for a specific date, time, and location
const date = new Date(2023, 3, 1, 0, 0, 0); // April 1, 2023 at Midnight
const latitude = 40.7128; // Latitude of New York City, USA
const longitude = -74.0060; // Longitude of New York City, USA

// Optional input parameters (default values provided if not specified)
const elevation = 10; // Elevation in meters (approximately)
const temperature = 20; // Temperature (degrees Celsius)
const pressure = 1013.25; // Atmospheric pressure (millibars)
const refraction = 0.5667; // Atmospheric refraction (degrees)

// Call the 'spa' function and log the results
spa(date, latitude, longitude, elevation, temperature, pressure, refraction)
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

## Example Output

```
{
  zenith: 132.82035808538367,
  azimuth: 339.3841959764823,
  incidence: 132.82035808538367,
  sun_transit_alt: 53.91557045916343,
  sunrise: 6.665306569794356,
  solar_noon: 12.99818246332967,
  sunset: 19.342862135890314
}
```

## Helper (function not included)

If you would like to translate the sunrise, solar_noon, or sunset to a normal time output you can convert fractional hours to formatted time string like below:

```
function formatTime(hours) {
	const milliseconds = hours * 60 * 60 * 1000;
	const date = new Date(milliseconds);
	return date.toISOString().substr(11, 12);
}
```

# Repository
The source code for this package is available on GitHub: github.com/acamarata/solar-spa

# License
MIT
