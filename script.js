const citySearch = document.getElementById("citySearch");
const suggestions = document.getElementById("citySuggestions");
const refreshBtn = document.getElementById("refreshBtn");
const retryBtn = document.getElementById("retryBtn");
const statusEl = document.getElementById("status");
const weatherContent = document.getElementById("weatherContent");
const errorPanel = document.getElementById("errorPanel");
const errorMessage = document.getElementById("errorMessage");

let selectedCity = null;
let searchTimer;
let searchController;
let weatherController;
let searchVersion = 0;
let weatherVersion = 0;

function setStatus(message, state = "") {
  statusEl.textContent = message;
  statusEl.dataset.state = state;
}

function getWeatherDescription(code, isDay) {
  if (code === 0) return {
    text: isDay ? "Clear sky" : "Clear night",
    icon: isDay ? "☀️" : "🌙"
  };

  if (code === 1) return { text: "Mainly clear", icon: isDay ? "🌤️" : "🌙" };
  if (code === 2) return { text: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { text: "Overcast", icon: "☁️" };
  if ([45, 48].includes(code)) return { text: "Foggy", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", icon: "🌦️" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { text: "Rain", icon: "🌧️" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { text: "Snow", icon: "❄️" };
  }
  if ([95, 96, 99].includes(code)) {
    return { text: "Thunderstorm", icon: "⛈️" };
  }

  return { text: "Conditions unavailable", icon: "🌡️" };
}

function getCompassDirection(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}

function showError(message) {
  weatherContent.hidden = true;
  errorPanel.hidden = false;
  errorMessage.textContent = message;
  setStatus("Unable to load weather data.", "error");
}

async function searchCities(query) {
  const version = ++searchVersion;

  if (searchController) searchController.abort();

  if (query.length < 2) {
    suggestions.replaceChildren();
    setStatus("Type at least two characters to search for a city.");
    return;
  }

  searchController = new AbortController();

  setStatus("Searching locations...");

  try {
    const params = new URLSearchParams({
      name: query,
      count: "8",
      language: "en",
      format: "json"
    });

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${params}`,
      { signal: searchController.signal }
    );

    if (!response.ok) throw new Error("City search service is unavailable.");

    const data = await response.json();

    if (version !== searchVersion) return;

    suggestions.replaceChildren();

    if (!data.results || data.results.length === 0) {
      setStatus("No matching cities found. Try another spelling.");
      return;
    }

    data.results.forEach(place => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "city-option";
      button.setAttribute("role", "option");

      const details = [
        place.name,
        place.admin1,
        place.country
      ].filter((value, index, array) =>
        value && array.indexOf(value) === index
      );

      button.textContent = details.join(", ");

      button.addEventListener("click", () => {
        selectedCity = {
          name: place.name,
          country: place.country || "",
          admin1: place.admin1 || "",
          latitude: place.latitude,
          longitude: place.longitude
        };

        citySearch.value = details.join(", ");
        suggestions.replaceChildren();
        loadWeather();
      });

      suggestions.appendChild(button);
    });

    setStatus("Select a city from the suggestions.");
  } catch (error) {
    if (error.name === "AbortError" || version !== searchVersion) return;

    suggestions.replaceChildren();
    setStatus("Unable to search cities. Check your internet connection.", "error");
  }
}

function displayWeather(data, city) {
  const current = data.current;

  if (
    !current ||
    !Number.isFinite(current.temperature_2m) ||
    !Number.isFinite(current.relative_humidity_2m) ||
    !Number.isFinite(current.wind_speed_10m) ||
    !Number.isFinite(current.weather_code)
  ) {
    throw new Error("The weather service returned incomplete data.");
  }

  document.getElementById("cityName").textContent =
    [city.name, city.admin1, city.country]
      .filter((value, index, array) =>
        value && array.indexOf(value) === index
      ).join(", ");

  document.getElementById("currentDate").textContent =
    new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: data.timezone || "UTC"
    }).format(new Date());

  document.getElementById("temperature").textContent =
    Math.round(current.temperature_2m);

  document.getElementById("humidity").textContent =
    current.relative_humidity_2m;

  document.getElementById("windSpeed").textContent =
    Math.round(current.wind_speed_10m * 10) / 10;

  const feelsLike = current.apparent_temperature;

  document.getElementById("feelsLike").textContent =
    Number.isFinite(feelsLike) ? Math.round(feelsLike) : "--";

  document.getElementById("feelsLikeCard").textContent =
    Number.isFinite(feelsLike) ? Math.round(feelsLike) : "--";

  document.getElementById("windDirection").textContent =
    Number.isFinite(current.wind_direction_10m)
      ? Math.round(current.wind_direction_10m)
      : "--";

  document.getElementById("windDirectionText").textContent =
    Number.isFinite(current.wind_direction_10m)
      ? getCompassDirection(current.wind_direction_10m)
      : "Direction unavailable";

  const weather = getWeatherDescription(
    current.weather_code,
    current.is_day === 1
  );

  document.getElementById("condition").textContent = weather.text;
  document.getElementById("weatherIcon").textContent = weather.icon;

  document.getElementById("humidityBar").style.width =
    `${Math.max(0, Math.min(100, current.relative_humidity_2m))}%`;

  document.getElementById("windBar").style.width =
    `${Math.max(0, Math.min(100, current.wind_speed_10m / 1.2))}%`;

  const updated = new Date(current.time);

  document.getElementById("updatedTime").textContent =
    Number.isNaN(updated.getTime())
      ? "Latest available data"
      : `Data time: ${new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: data.timezone || "UTC"
        }).format(updated)}`;

  weatherContent.hidden = false;
  errorPanel.hidden = true;
  setStatus("Weather data loaded successfully.", "success");
}

async function loadWeather() {
  if (!selectedCity) {
    setStatus("Search for a city and select it first.");
    citySearch.focus();
    return;
  }

  const version = ++weatherVersion;

  if (weatherController) weatherController.abort();
  weatherController = new AbortController();

  refreshBtn.disabled = true;
  refreshBtn.textContent = "Loading...";
  weatherContent.hidden = true;
  errorPanel.hidden = true;

  setStatus(`Fetching weather for ${selectedCity.name}...`);

  try {
    const params = new URLSearchParams({
      latitude: String(selectedCity.latitude),
      longitude: String(selectedCity.longitude),
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "is_day",
        "weather_code",
        "wind_speed_10m",
        "wind_direction_10m"
      ].join(","),
      timezone: "auto",
      wind_speed_unit: "kmh"
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { signal: weatherController.signal }
    );

    if (!response.ok) {
      throw new Error(`Weather service error (${response.status}).`);
    }

    const data = await response.json();

    if (version !== weatherVersion) return;

    displayWeather(data, selectedCity);
  } catch (error) {
    if (error.name === "AbortError" || version !== weatherVersion) return;

    console.error(error);

    showError(
      error.name === "TimeoutError"
        ? "The request timed out. Please try again."
        : error instanceof TypeError
          ? "Unable to connect. Check your internet connection."
          : error.message || "Unable to retrieve weather data."
    );
  } finally {
    if (version === weatherVersion) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '↻ <span>Refresh</span>';
    }
  }
}

citySearch.addEventListener("input", () => {
  clearTimeout(searchTimer);
  selectedCity = null;
  searchTimer = setTimeout(
    () => searchCities(citySearch.value.trim()),
    350
  );
});

citySearch.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    suggestions.replaceChildren();
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const firstSuggestion = suggestions.querySelector("button");

    if (firstSuggestion) {
      firstSuggestion.click();
    } else {
      searchCities(citySearch.value.trim());
    }
  }
});

document.addEventListener("click", event => {
  if (!event.target.closest(".city-search")) {
    suggestions.replaceChildren();
  }
});

refreshBtn.addEventListener("click", loadWeather);
retryBtn.addEventListener("click", loadWeather);

setStatus("Search for a city to view its live weather.");