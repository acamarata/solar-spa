# NREL SPA Algorithm

## Background

The Solar Position Algorithm (SPA) was developed at the National Renewable Energy Laboratory (NREL) by Ibrahim Reda and Afshin Andreas. It calculates the solar zenith and azimuth angles for any location on Earth, for any date between -2000 and 6000, with an uncertainty of +/- 0.0003 degrees.

The algorithm is described in the paper:

> Ibrahim Reda, Afshin Andreas, "Solar Position Algorithm for Solar Radiation Applications," Solar Energy, Vol. 76, Issue 5, 2004, pp. 577-589.

The C reference implementation is available from NREL at [midcdmz.nrel.gov/spa/](https://midcdmz.nrel.gov/spa/).

## What it computes

Given a date, time, observer location, and atmospheric conditions, the SPA produces:

- **Zenith angle**: the angle between the sun and the point directly overhead. 0 degrees means the sun is at the zenith. 90 degrees means the sun is on the horizon. Values above 90 indicate the sun is below the horizon.
- **Azimuth angle**: the compass direction of the sun. Two conventions are provided: eastward from north (navigational) and westward from south (astronomical).
- **Incidence angle**: the angle between the sun and a surface with a given slope and orientation.
- **Sunrise, sunset, and solar transit**: the times at which the sun crosses the horizon and reaches its highest point.
- **Equation of time**: the difference between apparent solar time and mean solar time, in minutes.

## How it works

The algorithm proceeds through several stages:

### 1. Julian date calculation

The input date is converted to a Julian Date (JD), which is a continuous count of days since January 1, 4713 BC. This simplifies all subsequent time-dependent calculations. The Julian Ephemeris Day (JDE) is then computed by adding the delta_t correction (the difference between Terrestrial Time and UTC).

### 2. Earth heliocentric position

The Earth's position relative to the Sun is calculated using the VSOP87 theory (Variations Seculaires des Orbites Planetaires). This involves evaluating trigonometric series with over 60 terms for heliocentric longitude, plus smaller series for heliocentric latitude and radius vector.

The heliocentric longitude uses five polynomial coefficients (L0 through L4), each of which is a sum of terms of the form `A * cos(B + C * JME)` where JME is the Julian Ephemeris Millennium.

### 3. Geocentric position

The heliocentric coordinates (Earth's position relative to the Sun) are converted to geocentric coordinates (Sun's position as seen from Earth) by adding 180 degrees to the longitude and negating the latitude. The geocentric right ascension and declination are then computed.

### 4. Nutation and obliquity

Nutation (the periodic wobble of Earth's axis) is computed from a series of 63 terms based on five fundamental arguments: the mean elongation of the Moon, the mean anomaly of the Sun, the mean anomaly of the Moon, the Moon's argument of latitude, and the longitude of the ascending node of the Moon's orbit.

The true obliquity of the ecliptic (the tilt of Earth's axis) is the mean obliquity plus the nutation in obliquity.

### 5. Aberration and apparent position

Aberration is the apparent shift in a star's position caused by Earth's orbital motion and the finite speed of light. The correction is small (about 20 arc-seconds) but necessary for the stated accuracy.

### 6. Topocentric correction

The geocentric position is adjusted for the observer's actual location on Earth's surface (parallax correction). An observer at sea level sees a slightly different sun position than one at high elevation, and both differ from the geocentric center-of-Earth viewpoint.

### 7. Atmospheric refraction

The atmosphere bends sunlight, making the sun appear higher than its geometric position. The refraction correction is most significant near the horizon (about 0.57 degrees at sunrise/sunset) and negligible when the sun is high.

### 8. Rise, transit, and set

Sunrise, sunset, and solar transit are calculated by evaluating the sun's position at midnight, then using iterative approximation to find the exact times when the zenith angle crosses 90.8333 degrees (the standard value accounting for the sun's apparent diameter and atmospheric refraction at the horizon).

## Valid date range

The algorithm is valid for dates between -2000 and 6000 (i.e., 2000 BC to 6000 AD). Outside this range, the VSOP87 series lose accuracy and the SPA returns an error code.

## Accuracy

The stated uncertainty is +/- 0.0003 degrees for the period from -2000 to 6000. This is well within the requirements of any solar energy, astronomical, or navigational application.

For comparison:

- The sun's apparent diameter is about 0.53 degrees
- A solar panel tracking error of 1 degree reduces energy capture by roughly 0.015%
- Consumer GPS accuracy is typically 3-5 meters, which corresponds to roughly 0.00005 degrees of latitude

The SPA's accuracy far exceeds the precision of any practical measurement system it would be paired with.

## Input validation

The SPA validates all inputs and returns a non-zero error code if any are out of range:

| Parameter | Valid range |
| --- | --- |
| Year | -2000 to 6000 |
| Month | 1 to 12 |
| Day | 1 to 31 |
| Hour | 0 to 24 |
| Minute | 0 to 59 |
| Second | 0 to less than 60 |
| Timezone | -18 to 18 |
| Latitude | -90 to 90 |
| Longitude | -180 to 180 |
| Elevation | -6500000 or higher (meters) |
| Pressure | 0 to 5000 |
| Temperature | -273 to 6000 |
| Delta UT1 | -1 to 1 |
| Delta T | -8000 to 8000 |
| Slope | -360 to 360 |
| Azimuth rotation | -360 to 360 |
| Atmospheric refraction | -5 to 5 |

The solar-spa package propagates these error codes as thrown JavaScript errors.

## References

- Reda, I., Andreas, A. (2004). "Solar Position Algorithm for Solar Radiation Applications." Solar Energy, 76(5), 577-589.
- Meeus, J. (1998). "Astronomical Algorithms." 2nd ed. Willmann-Bell.
- Bretagnon, P., Francou, G. (1988). "Planetary Theories in Rectangular and Spherical Variables: VSOP87 Solutions." Astronomy and Astrophysics, 202, 309-315.
- [NREL SPA Calculator](https://midcdmz.nrel.gov/spa/): Online calculator and C source distribution.

---

[Home](Home) · [Architecture](Architecture) · [API Reference](API-Reference) · [Validation and Benchmarks](Validation-and-Benchmarks)
