// solar-spa.js
const path = require('path');
const spaModule = require('./spa.js');

// Set the wasm file path
spaModule.locateFile = (filename) => {
  return path.join(__dirname, filename);
};
module.exports = function spa(
  date,
  latitude,
  longitude,
  elevation = 0,
  temperature = 20,
  pressure = 1013.25,
  refraction = 0.5667
) {
  return new Promise((resolve) => {
    spaModule.onRuntimeInitialized = function () {
      const spa_calculate = spaModule.cwrap(
        'spa_calculate_wrapper',
        'number',
        [
          'number', 'number', 'number', 'number', 'number',
          'number', 'number', 'number', 'number', 'number',
          'number', 'number', 'number', 'number', 'number'
        ]
      );

      const spa_free_result = spaModule.cwrap(
        'spa_free_result',
        null,
        ['number']
      );

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const second = date.getSeconds();
      const timezone = -date.getTimezoneOffset() / 60;
      const slope = 0;
      const azm_rotation = 0;

      const resultPtr = spa_calculate(
        year, month, day, hour, minute, second, timezone,
        latitude, longitude, elevation, pressure, temperature,
        slope, azm_rotation, refraction
      );

      const result = {
        zenith: spaModule.getValue(resultPtr, 'double'),
        azimuth: spaModule.getValue(resultPtr + 8, 'double'),
        incidence: spaModule.getValue(resultPtr + 16, 'double'),
        sunrise: spaModule.getValue(resultPtr + 24, 'double'),
        sunset: spaModule.getValue(resultPtr + 32, 'double'),
        solar_noon: spaModule.getValue(resultPtr + 40, 'double'),
        sun_transit_alt: spaModule.getValue(resultPtr + 48, 'double'),
      };

      spa_free_result(resultPtr);

      resolve(result);
    };
  });
};
