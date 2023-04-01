// test.js
// Import the 'solar-spa' module
const spa = require('./solar-spa.js');

// Define input parameters for a specific date, time, and location
const date = new Date(2023, 3, 1, 0, 0, 0); // April 1, 2023 at Midnight
const latitude = 40.7128; // Latitude of New York City, USA
const longitude = -74.0060; // Longitude of New York City, USA
const elevation = 10; // Elevation in meters (approximately)
const pressure = 1013.25; // Optional input: Atmospheric pressure (millibars)
const temperature = 20; // Optional input: Temperature (degrees Celsius)
const refraction = 0.5667; // Optional input: Atmospheric refraction (degrees)

// Convert fractional hours to formatted time string for sunrise, sunset, solar_noon
function formatTime(hours) {
	const milliseconds = hours * 60 * 60 * 1000;
	const date = new Date(milliseconds);
	return date.toISOString().substr(11, 12);
}

// Call the 'spa' function and log the results
spa(date, latitude, longitude, elevation, temperature, pressure, refraction)
	.then(result => {
		console.log({
			zenith: result.zenith,
			azimuth: result.azimuth,
			incidence: result.incidence,
			sun_transit_alt: result.sun_transit_alt,
			sunrise: result.sunrise,
			solar_noon: result.solar_noon,
			sunset: result.sunset
		});
	})
	.catch(error => {
		console.error(error);
	});