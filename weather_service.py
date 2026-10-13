"""Open-Meteo geocoding and forecast integration for the weather dashboard."""
import requests

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
REQUEST_TIMEOUT = 5


class CityNotFoundError(Exception):
    """Raised when the geocoding API has no match for the given city name."""


class WeatherServiceError(Exception):
    """Raised when an upstream request fails or returns an unexpected payload."""


def geocode_city(city_name):
    try:
        response = requests.get(
            GEOCODING_URL,
            params={"name": city_name, "count": 1},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise WeatherServiceError("Unable to reach the geocoding service") from exc

    results = response.json().get("results")
    if not results:
        raise CityNotFoundError(f"No location found for '{city_name}'")

    match = results[0]
    return {
        "name": match["name"],
        "country": match.get("country", ""),
        "latitude": match["latitude"],
        "longitude": match["longitude"],
    }


def get_forecast(latitude, longitude, unit="celsius"):
    temperature_unit = "fahrenheit" if unit == "fahrenheit" else "celsius"

    try:
        response = requests.get(
            FORECAST_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current_weather": True,
                "hourly": "temperature_2m,weathercode",
                "daily": "temperature_2m_max,temperature_2m_min,weathercode",
                "temperature_unit": temperature_unit,
                "timezone": "auto",
            },
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise WeatherServiceError("Unable to reach the forecast service") from exc

    payload = response.json()
    if "current_weather" not in payload:
        raise WeatherServiceError("Forecast service returned an incomplete response")

    return payload


def normalize_response(location, forecast, unit):
    return {
        "location": {
            "name": location["name"],
            "country": location["country"],
        },
        "unit": unit,
        "current": forecast["current_weather"],
        "hourly": forecast.get("hourly", {}),
        "daily": forecast.get("daily", {}),
    }


def get_weather_for_city(city_name, unit="celsius"):
    location = geocode_city(city_name)
    forecast = get_forecast(location["latitude"], location["longitude"], unit)
    return normalize_response(location, forecast, unit)
