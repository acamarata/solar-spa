import type { SpaWasmModule, SpaResult, SpaFormattedResult, SpaOptions } from './types.js';

export type { SpaOptions, SpaResult, SpaFormattedResult } from './types.js';
export { SPA_ZA, SPA_ZA_INC, SPA_ZA_RTS, SPA_ALL } from './types.js';
export type { SpaFunctionCode } from './types.js';

import { SPA_ALL } from './types.js';

// The WASM module is Emscripten CJS output. In ESM builds, tsup injects a
// createRequire-based __require shim via the banner option (see tsup.config.ts).
// In CJS builds, require() is natively available.
declare const __require: NodeRequire;
const _loadModule = typeof __require === 'function' ? __require : require;
const createSpaModule: () => Promise<SpaWasmModule> = _loadModule('../wasm/spa-module.js');

// Singleton: the WASM module initializes once, all calls share it.
let _module: SpaWasmModule | null = null;
let _pending: Promise<void> | null = null;
let _calculate: ((...args: number[]) => number) | null = null;
let _free: ((ptr: number) => void) | null = null;

// Result struct layout (10 fields, 9 doubles + 1 int32):
// offset 0:  zenith         (f64)
// offset 8:  azimuth_astro  (f64)
// offset 16: azimuth        (f64)
// offset 24: incidence      (f64)
// offset 32: sunrise        (f64)
// offset 40: sunset         (f64)
// offset 48: suntransit     (f64)
// offset 56: sun_transit_alt (f64)
// offset 64: eot            (f64)
// offset 72: error_code     (i32)
const OFFSET = {
  zenith: 0,
  azimuth_astro: 8,
  azimuth: 16,
  incidence: 24,
  sunrise: 32,
  sunset: 40,
  suntransit: 48,
  sun_transit_alt: 56,
  eot: 64,
  error_code: 72,
} as const;

/**
 * Initialize the WASM module. Returns a cached promise on repeat calls.
 * Safe to call multiple times. If initialization fails, subsequent calls
 * will retry rather than returning the failed promise.
 */
export function init(): Promise<void> {
  if (_module) return Promise.resolve();
  if (_pending) return _pending;

  _pending = createSpaModule()
    .then((mod: SpaWasmModule) => {
      _module = mod;
      _calculate = mod.cwrap('spa_calculate_wrapper', 'number', [
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
      ]) as (...args: number[]) => number;
      _free = mod.cwrap('spa_free_result', null, ['number']) as (ptr: number) => void;
      _pending = null;
    })
    .catch((err: unknown) => {
      _pending = null;
      throw err;
    });

  return _pending;
}

/**
 * Format fractional hours to HH:MM:SS string.
 * Returns "N/A" for non-finite or negative values (polar night/day scenarios).
 *
 * @param hours - Fractional hours (e.g. 6.5 for 06:30:00). Values >= 24 wrap.
 * @returns Formatted time string in HH:MM:SS format, or "N/A" if input is invalid.
 */
export function formatTime(hours: number): string {
  if (!isFinite(hours) || hours < 0) return 'N/A';

  const totalSec = Math.round(hours * 3600);
  const h = Math.floor(totalSec / 3600) % 24;
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return (
    String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
  );
}

/** Read the result struct from WASM memory and free it. */
function readResult(ptr: number): SpaResult {
  const m = _module!;
  const result: SpaResult = {
    zenith: m.getValue(ptr + OFFSET.zenith, 'double'),
    azimuth_astro: m.getValue(ptr + OFFSET.azimuth_astro, 'double'),
    azimuth: m.getValue(ptr + OFFSET.azimuth, 'double'),
    incidence: m.getValue(ptr + OFFSET.incidence, 'double'),
    sunrise: m.getValue(ptr + OFFSET.sunrise, 'double'),
    sunset: m.getValue(ptr + OFFSET.sunset, 'double'),
    suntransit: m.getValue(ptr + OFFSET.suntransit, 'double'),
    sun_transit_alt: m.getValue(ptr + OFFSET.sun_transit_alt, 'double'),
    eot: m.getValue(ptr + OFFSET.eot, 'double'),
    error_code: m.getValue(ptr + OFFSET.error_code, 'i32'),
  };
  _free!(ptr);
  return result;
}

/**
 * Validate that a value is a finite number, throwing a clear error if not.
 * @internal
 */
function assertFiniteNumber(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number') {
    throw new TypeError(`SPA: ${name} must be a finite number, got ${typeof value}`);
  }
  if (!isFinite(value)) {
    throw new RangeError(`SPA: ${name} must be a finite number, got ${value}`);
  }
}

/** Field names in SpaOptions that must be finite numbers when provided. */
const NUMERIC_OPTION_FIELDS = [
  'elevation',
  'pressure',
  'temperature',
  'delta_t',
  'slope',
  'azm_rotation',
  'atmos_refract',
] as const;

/**
 * Validate numeric option fields. Each, if provided, must be a finite number.
 * @internal
 */
function validateOptions(opts: SpaOptions): void {
  for (const field of NUMERIC_OPTION_FIELDS) {
    if (opts[field] !== undefined) {
      assertFiniteNumber(opts[field], `options.${field}`);
    }
  }
}

/**
 * Compute solar position for the given parameters.
 *
 * @param date - Date and time for the calculation
 * @param latitude - Observer latitude in degrees (-90 to 90)
 * @param longitude - Observer longitude in degrees (-180 to 180)
 * @param options - Optional parameters
 * @returns Solar position result with all computed values
 * @throws {TypeError} If date is not a valid Date, or if latitude/longitude/option fields are not numbers
 * @throws {RangeError} If latitude/longitude are out of bounds, or if option fields are Infinity/NaN
 */
export async function spa(
  date: Date,
  latitude: number,
  longitude: number,
  options?: SpaOptions,
): Promise<SpaResult> {
  // Input validation
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new TypeError('SPA: date must be a valid Date object');
  }
  assertFiniteNumber(latitude, 'latitude');
  assertFiniteNumber(longitude, 'longitude');

  if (latitude < -90 || latitude > 90) {
    throw new RangeError(`SPA: latitude must be between -90 and 90, got ${latitude}`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new RangeError(`SPA: longitude must be between -180 and 180, got ${longitude}`);
  }

  if (options) {
    validateOptions(options);
  }

  await init();

  const opts = options ?? {};
  const tz = opts.timezone ?? -(date.getTimezoneOffset() / 60);

  const ptr = _calculate!(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    tz,
    latitude,
    longitude,
    opts.elevation ?? 0,
    opts.pressure ?? 1013.25,
    opts.temperature ?? 15,
    opts.delta_ut1 ?? 0,
    opts.delta_t ?? 67,
    opts.slope ?? 0,
    opts.azm_rotation ?? 0,
    opts.atmos_refract ?? 0.5667,
    opts.function ?? SPA_ALL,
  );

  if (!ptr) {
    throw new Error('SPA: memory allocation failed');
  }

  const result = readResult(ptr);

  if (result.error_code !== 0) {
    throw new Error('SPA: calculation failed (error code ' + result.error_code + ')');
  }

  return result;
}

/**
 * Compute solar position and return formatted time strings.
 *
 * Same parameters as spa(). Returns sunrise, sunset, and suntransit
 * as HH:MM:SS strings instead of fractional hours.
 *
 * @throws {TypeError} If date is not a valid Date, or if latitude/longitude/option fields are not numbers
 * @throws {RangeError} If latitude/longitude are out of bounds, or if option fields are Infinity/NaN
 */
export async function spaFormatted(
  date: Date,
  latitude: number,
  longitude: number,
  options?: SpaOptions,
): Promise<SpaFormattedResult> {
  const result = await spa(date, latitude, longitude, options);
  return {
    zenith: result.zenith,
    azimuth_astro: result.azimuth_astro,
    azimuth: result.azimuth,
    incidence: result.incidence,
    sunrise: formatTime(result.sunrise),
    sunset: formatTime(result.sunset),
    suntransit: formatTime(result.suntransit),
    sun_transit_alt: result.sun_transit_alt,
    eot: result.eot,
    error_code: result.error_code,
  };
}

export default spa;
