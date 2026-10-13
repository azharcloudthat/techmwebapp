const cityInput = document.getElementById('city-input');
const searchForm = document.getElementById('search-form');
const placeholder = document.getElementById('results-placeholder');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const weatherResults = document.getElementById('weather-results');
const currentConditions = document.getElementById('current-conditions');
const hourlyOutlook = document.getElementById('hourly-outlook');
const sevenDayForecast = document.getElementById('seven-day-forecast');

const weatherDescriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    56: 'Freezing drizzle',
    57: 'Heavy freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light rain showers',
    81: 'Rain showers',
    82: 'Heavy rain showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Heavy thunderstorm with hail'
};

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function formatTemperature(value, unit) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
    return `${Math.round(value)}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

function describeWeather(code) {
    return weatherDescriptions[code] || 'Conditions unavailable';
}

function formatDateTime(value, options) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Time unavailable';
    return new Intl.DateTimeFormat(undefined, options).format(date);
}

function renderCurrent(data) {
    const current = data.current || {};
    const unit = data.unit || 'celsius';
    const location = [data.location?.name, data.location?.country]
        .filter(Boolean)
        .join(', ');

    currentConditions.replaceChildren();
    currentConditions.append(
        createElement('p', 'section-kicker', 'CURRENT CONDITIONS'),
        createElement('h2', 'location-name', location || 'Weather'),
        createElement(
            'p',
            'updated-time',
            current.time
                ? `Local time ${formatDateTime(current.time, { hour: 'numeric', minute: '2-digit' })}`
                : 'Current observation'
        )
    );

    const summary = createElement('div', 'current-summary');
    summary.append(
        createElement('p', 'current-temperature', formatTemperature(current.temperature, unit)),
        createElement('p', 'current-description', describeWeather(current.weathercode))
    );
    currentConditions.append(summary);

    const details = createElement('div', 'current-details');
    details.append(
        createElement('span', 'detail-label', 'Wind'),
        createElement('strong', 'detail-value', `${current.windspeed ?? '--'} km/h`),
        createElement('span', 'detail-label', 'Conditions'),
        createElement('strong', 'detail-value', current.is_day === 0 ? 'Night' : 'Daytime')
    );
    currentConditions.append(details);
}

function renderHourly(data) {
    const hourly = data.hourly || {};
    const times = hourly.time || [];
    const temperatures = hourly.temperature_2m || [];
    const codes = hourly.weathercode || [];
    const unit = data.unit || 'celsius';

    hourlyOutlook.replaceChildren(createElement('h2', 'section-title', 'Next hours'));
    const list = createElement('div', 'hourly-list');
    const currentTime = data.current?.time;
    let startIndex = times.findIndex((time) => time >= currentTime);
    if (startIndex < 0) startIndex = 0;

    times.slice(startIndex, startIndex + 8).forEach((time, index) => {
        const dataIndex = startIndex + index;
        const item = createElement('article', 'hourly-item');
        item.append(
            createElement('span', 'forecast-time', formatDateTime(time, { hour: 'numeric' })),
            createElement('span', 'forecast-condition', describeWeather(codes[dataIndex])),
            createElement('strong', 'forecast-temperature', formatTemperature(temperatures[dataIndex], unit))
        );
        list.append(item);
    });

    if (!list.childElementCount) {
        list.append(createElement('p', 'forecast-empty', 'Hourly forecast unavailable.'));
    }
    hourlyOutlook.append(list);
}

function renderDaily(data) {
    const daily = data.daily || {};
    const dates = daily.time || [];
    const highs = daily.temperature_2m_max || [];
    const lows = daily.temperature_2m_min || [];
    const codes = daily.weathercode || [];
    const unit = data.unit || 'celsius';

    sevenDayForecast.replaceChildren(createElement('h2', 'section-title', '7-day forecast'));
    const list = createElement('div', 'daily-list');

    dates.slice(0, 7).forEach((date, index) => {
        const item = createElement('article', 'daily-item');
        item.append(
            createElement('span', 'forecast-day', formatDateTime(date, { weekday: 'short', month: 'short', day: 'numeric' })),
            createElement('span', 'forecast-condition', describeWeather(codes[index])),
            createElement('strong', 'daily-high', formatTemperature(highs[index], unit)),
            createElement('span', 'daily-low', formatTemperature(lows[index], unit))
        );
        list.append(item);
    });

    if (!list.childElementCount) {
        list.append(createElement('p', 'forecast-empty', 'Daily forecast unavailable.'));
    }
    sevenDayForecast.append(list);
}

function renderWeather(data) {
    renderCurrent(data);
    renderHourly(data);
    renderDaily(data);
}

async function fetchWeather(city) {
    const response = await fetch(`/weather?city=${encodeURIComponent(city)}`);

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Request failed with status ${response.status}`);
    }

    return response.json();
}

searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (!city) {
        return;
    }

    placeholder.classList.add('hidden');
    errorState.classList.add('hidden');
    weatherResults.classList.add('hidden');
    loadingState.classList.remove('hidden');

    try {
        const data = await fetchWeather(city);
        loadingState.classList.add('hidden');
        renderWeather(data);
        weatherResults.classList.remove('hidden');
    } catch (error) {
        loadingState.classList.add('hidden');
        errorState.textContent = error.message;
        errorState.classList.remove('hidden');
    }
});
