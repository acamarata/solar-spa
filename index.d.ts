// index.d.ts
declare module 'solar-spa' {
    export default function spa(
      date: Date,
      latitude: number,
      longitude: number,
      elevation?: number,
      temperature?: number,
      pressure?: number,
      refraction?: number
    ): Promise<{
      zenith: number;
      azimuth: number;
      incidence: number;
      sunrise: number;
      sunset: number;
      solar_noon: number;
      sun_transit_alt: number;
    }>;
  }
  