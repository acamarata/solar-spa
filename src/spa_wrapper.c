/*
 * spa_wrapper.c
 *
 * Thin wrapper around NREL's spa_calculate() for use from JavaScript
 * via Emscripten/WebAssembly. Exposes a flat function signature that
 * maps directly to cwrap() on the JS side.
 *
 * The wrapper allocates a result struct on the heap, fills it from the
 * spa_data output fields, and returns the pointer. The caller is
 * responsible for reading the doubles and calling spa_free_result().
 *
 * Copyright (c) 2023-2026 Aric Camarata. MIT License.
 */

#include "spa.h"
#include <stdlib.h>

typedef struct {
    double zenith;
    double azimuth_astro;
    double azimuth;
    double incidence;
    double sunrise;
    double sunset;
    double suntransit;
    double sun_transit_alt;
    double eot;
    int    error_code;
} spa_result;

spa_result *spa_calculate_wrapper(
    int year, int month, int day,
    int hour, int minute, double second,
    double timezone,
    double latitude, double longitude, double elevation,
    double pressure, double temperature,
    double delta_ut1, double delta_t,
    double slope, double azm_rotation, double atmos_refract,
    int function_code)
{
    spa_result *result = (spa_result *)malloc(sizeof(spa_result));
    if (!result) return NULL;

    spa_data spa;
    spa.year          = year;
    spa.month         = month;
    spa.day           = day;
    spa.hour          = hour;
    spa.minute        = minute;
    spa.second        = second;
    spa.timezone      = timezone;
    spa.latitude      = latitude;
    spa.longitude     = longitude;
    spa.elevation     = elevation;
    spa.pressure      = pressure;
    spa.temperature   = temperature;
    spa.delta_ut1     = delta_ut1;
    spa.delta_t       = delta_t;
    spa.slope         = slope;
    spa.azm_rotation  = azm_rotation;
    spa.atmos_refract = atmos_refract;
    spa.function      = function_code;

    int rc = spa_calculate(&spa);
    result->error_code = rc;

    if (rc == 0) {
        result->zenith         = spa.zenith;
        result->azimuth_astro  = spa.azimuth_astro;
        result->azimuth        = spa.azimuth;
        result->incidence      = spa.incidence;
        result->sunrise        = spa.sunrise;
        result->sunset         = spa.sunset;
        result->suntransit     = spa.suntransit;
        result->sun_transit_alt = spa.sta;
        result->eot            = spa.eot;
    } else {
        result->zenith          = 0.0;
        result->azimuth_astro   = 0.0;
        result->azimuth         = 0.0;
        result->incidence       = 0.0;
        result->sunrise         = 0.0;
        result->sunset          = 0.0;
        result->suntransit      = 0.0;
        result->sun_transit_alt = 0.0;
        result->eot             = 0.0;
    }

    return result;
}

void spa_free_result(spa_result *result) {
    if (result) free(result);
}
