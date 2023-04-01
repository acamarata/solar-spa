// src/spa_wrapper.c
#include "spa.h"
#include <stdlib.h> // For malloc and free

typedef struct {
    double zenith;
    double azimuth;
    double incidence;
    double sunrise;
    double sunset;
    double solar_noon;
    double sun_transit_alt;
} spa_result;

spa_result* spa_calculate_wrapper(
    int year, int month, int day,
    int hour, int minute, double second,
    double timezone,
    double latitude, double longitude, double elevation,
    double pressure, double temperature,
    double slope, double azm_rotation, double atmos_refract)
{
    // Allocate memory for the result
    spa_result* result = (spa_result*)malloc(sizeof(spa_result));
    if (!result) return NULL;

    spa_data spa;
    spa.year = year;
    spa.month = month;
    spa.day = day;
    spa.hour = hour;
    spa.minute = minute;
    spa.second = second;
    spa.timezone = timezone;
    spa.latitude = latitude;
    spa.longitude = longitude;
    spa.elevation = elevation;

    // Set default values for optional inputs if they are not given
    spa.pressure = (pressure == 0.0) ? 820.0 : pressure; // Standard atmospheric pressure
    spa.temperature = (temperature == 0.0) ? 11.0 : temperature; // Standard temperature
    spa.slope = slope; // Surface slope angle (default 0.0)
    spa.azm_rotation = azm_rotation; // Surface azimuth angle (default 0.0)
    spa.atmos_refract = (atmos_refract == 0.0) ? 0.5667 : atmos_refract;

    // Set the calculation mode to SPA_ALL
    spa.function = SPA_ALL;

    // Calculate SPA values
    int result_code = spa_calculate(&spa);

    if (result_code == 0) {
        result->zenith = spa.zenith;
        result->azimuth = spa.azimuth;
        result->incidence = spa.incidence;
        result->sunrise = spa.sunrise;
        result->sunset = spa.sunset;
        result->solar_noon = spa.suntransit;
        result->sun_transit_alt = spa.sta;
    } else {
        // Error handling (fill with zeros or other default values)
        result->zenith = 0;
        result->azimuth = 0;
        result->incidence = 0;
        result->sunrise = 0;
        result->sunset = 0;
        result->solar_noon = 0;
        result->sun_transit_alt = 0;
    }

    return result;
}

// Function to free the allocated result memory
void spa_free_result(spa_result* result) {
    free(result);
}
