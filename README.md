# Weather Dashboard

A simple Flask weather dashboard. Search for a city to view current conditions, an hourly outlook, and a 7-day forecast. Weather data comes from Open-Meteo; no API key is required.

## Setup

Install the dependencies:

```bash
python -m pip install -r requirements.txt
```

## Run

Start the Flask development server:

```bash
python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser. The app needs an internet connection to retrieve weather data.

## Weather endpoint

`GET /weather?city=London` returns weather data as JSON. The optional `unit` query parameter accepts `celsius` (default) or `fahrenheit`, for example:

```text
/weather?city=London&unit=fahrenheit
```

## Tests

Run the test suite with:

```bash
python -m pytest
```
