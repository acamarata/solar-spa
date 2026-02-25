/** SPA function codes. Control which outputs are computed. */
export const SPA_ZA = 0 as const;
export const SPA_ZA_INC = 1 as const;
export const SPA_ZA_RTS = 2 as const;
export const SPA_ALL = 3 as const;

export type SpaFunctionCode = typeof SPA_ZA | typeof SPA_ZA_INC | typeof SPA_ZA_RTS | typeof SPA_ALL;

export interface SpaOptions {
  /**
   * Hours from UTC. If omitted, derived from the Date object's local offset.
   * For historical dates or DST transitions, pass an explicit value.
   */
  timezone?: number;
  /** Observer elevation in meters above sea level. Default: 0. */
  elevation?: number;
  /** Atmospheric pressure in millibars. Default: 1013.25. */
  pressure?: number;
  /** Temperature in degrees Celsius. Default: 15. */
  temperature?: number;
  /** UT1-UTC correction in seconds. Default: 0. */
  delta_ut1?: number;
  /** TT-UTC difference in seconds. Default: 67. */
  delta_t?: number;
  /** Surface slope in degrees from horizontal. Default: 0. */
  slope?: number;
  /** Surface azimuth rotation in degrees from south. Default: 0. */
  azm_rotation?: number;
  /** Atmospheric refraction at sunrise/sunset in degrees. Default: 0.5667. */
  atmos_refract?: number;
  /** SPA function code. Default: SPA_ALL (3). */
  function?: SpaFunctionCode;
}

export interface SpaResult {
  /** Topocentric zenith angle in degrees. */
  zenith: number;
  /** Topocentric azimuth angle, westward from south (astronomical convention), in degrees. */
  azimuth_astro: number;
  /** Topocentric azimuth angle, eastward from north (navigational convention), in degrees. */
  azimuth: number;
  /** Surface incidence angle in degrees. */
  incidence: number;
  /** Local sunrise time as fractional hours. */
  sunrise: number;
  /** Local sunset time as fractional hours. */
  sunset: number;
  /** Local sun transit time (solar noon) as fractional hours. */
  suntransit: number;
  /** Sun transit altitude in degrees. */
  sun_transit_alt: number;
  /** Equation of time in minutes. */
  eot: number;
  /** SPA error code. Always 0 on a successful return (non-zero throws). */
  error_code: number;
}

export interface SpaFormattedResult extends Omit<SpaResult, 'sunrise' | 'sunset' | 'suntransit'> {
  /** Local sunrise time as HH:MM:SS string. "N/A" during polar day/night. */
  sunrise: string;
  /** Local sunset time as HH:MM:SS string. "N/A" during polar day/night. */
  sunset: string;
  /** Local sun transit time as HH:MM:SS string. "N/A" during polar day/night. */
  suntransit: string;
}

/**
 * Emscripten module interface. Matches the shape returned by createSpaModule().
 * @internal
 */
export interface SpaWasmModule {
  cwrap(name: string, returnType: string | null, argTypes: string[]): Function;
  getValue(ptr: number, type: string): number;
}
