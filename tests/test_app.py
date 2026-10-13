import pytest

import app as app_module
from app import app as flask_app, weather
from weather_service import CityNotFoundError, WeatherServiceError


@pytest.fixture
def client():
    """Provide a Flask test client without starting the development server."""
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as test_client:
        yield test_client


def test_index_returns_dashboard(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Weather Dashboard" in response.data


def test_weather_view_rejects_missing_city_directly():
    """Exercise the imported view function directly with a request context."""
    with flask_app.test_request_context("/weather"):
        response, status_code = weather()

    assert status_code == 400
    assert response.get_json() == {
        "error": "city query parameter is required"
    }


def test_weather_route_rejects_blank_city(client):
    response = client.get("/weather?city=%20%20")

    assert response.status_code == 400
    assert response.get_json() == {
        "error": "city query parameter is required"
    }


def test_weather_route_returns_data_and_defaults_to_celsius(client, monkeypatch):
    expected_data = {
        "location": {"name": "London", "country": "United Kingdom"},
        "unit": "celsius",
        "current": {"temperature": 18},
        "hourly": {},
        "daily": {},
    }
    calls = []

    def mock_get_weather(city, unit):
        calls.append((city, unit))
        return expected_data

    monkeypatch.setattr(app_module, "get_weather_for_city", mock_get_weather)

    response = client.get("/weather?city=%20London%20")

    assert response.status_code == 200
    assert response.get_json() == expected_data
    assert calls == [("London", "celsius")]


def test_weather_route_passes_requested_unit_to_service(client, monkeypatch):
    expected_data = {"location": {"name": "Paris", "country": "France"}}
    calls = []

    def mock_get_weather(city, unit):
        calls.append((city, unit))
        return expected_data

    monkeypatch.setattr(app_module, "get_weather_for_city", mock_get_weather)

    response = client.get("/weather?city=Paris&unit=fahrenheit")

    assert response.status_code == 200
    assert response.get_json() == expected_data
    assert calls == [("Paris", "fahrenheit")]


def test_weather_route_returns_404_when_city_is_not_found(client, monkeypatch):
    def mock_get_weather(city, unit):
        raise CityNotFoundError("City not found")

    monkeypatch.setattr(app_module, "get_weather_for_city", mock_get_weather)

    response = client.get("/weather?city=Unknown")

    assert response.status_code == 404
    assert response.get_json() == {"error": "City not found"}


def test_weather_route_returns_502_when_weather_service_fails(client, monkeypatch):
    def mock_get_weather(city, unit):
        raise WeatherServiceError("Weather service unavailable")

    monkeypatch.setattr(app_module, "get_weather_for_city", mock_get_weather)

    response = client.get("/weather?city=London")

    assert response.status_code == 502
    assert response.get_json() == {
        "error": "Weather service unavailable"
    }
