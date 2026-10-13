from flask import Flask, jsonify, render_template, request

from weather_service import CityNotFoundError, WeatherServiceError, get_weather_for_city

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/weather")
def weather():
    city = request.args.get("city", "").strip()
    if not city:
        return jsonify({"error": "city query parameter is required"}), 400

    unit = request.args.get("unit", "celsius")

    try:
        data = get_weather_for_city(city, unit)
    except CityNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except WeatherServiceError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True)

