const API_KEY = "1aa46e900cf1414288762057262001";
const BASE_URL = "https://api.weatherapi.com/v1";

let isCelsius = true;
let currentTheme = "default";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const unitToggle = document.getElementById("unitToggle");
const themeSelect = document.getElementById("themeSelect");

const errorEl = document.getElementById("error");
const loadingEl = document.getElementById("loading");
const currentWeatherEl = document.getElementById("currentWeather");
const forecastEl = document.getElementById("forecast");
const appContainer = document.getElementById("appContainer");

const showLoading = () => loadingEl.classList.remove("hidden");
const hideLoading = () => loadingEl.classList.add("hidden");
const showError = msg => {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
};
const clearError = () => errorEl.classList.add("hidden");

async function fetchWeather(query) {
  if (!query.trim()) return;
  
  showLoading();
  clearError();
  cityInput.blur();

  try {
    const res = await fetch(
      `${BASE_URL}/forecast.json?key=${API_KEY}&q=${query}&days=5&aqi=yes&alerts=yes`
    );

    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    localStorage.setItem("lastCity", query);

    updateCurrent(data);
    updateForecast(data.forecast.forecastday);
    updateHourly(data.forecast.forecastday[0].hour);
    updateAdvanced(data);
  } catch (err) {
    showError(err.message || "Unable to fetch weather");
    currentWeatherEl.classList.add("hidden");
    forecastEl.classList.add("hidden");
    document.getElementById("hourlyForecast").classList.add("hidden");
  } finally {
    hideLoading();
  }
}

function updateCurrent(data) {
  currentWeatherEl.classList.remove("hidden");
  forecastEl.classList.remove("hidden");
  document.getElementById("hourlyForecast").classList.remove("hidden");

  const temp = isCelsius ? data.current.temp_c : data.current.temp_f;
  const feels = isCelsius ? data.current.feelslike_c : data.current.feelslike_f;
  const windUnit = isCelsius ? "km/h" : "mph";
  const windSpeed = isCelsius ? data.current.wind_kph : data.current.wind_mph;
  const visibilityUnit = isCelsius ? "km" : "miles";
  const visibility = isCelsius ? data.current.vis_km : data.current.vis_miles;

  document.getElementById("cityName").textContent =
    `${data.location.name}, ${data.location.country}`;

  document.getElementById("temperature").textContent =
    `${Math.round(temp)}°${isCelsius ? "C" : "F"}`;

  document.getElementById("description").textContent =
    data.current.condition.text;

  document.getElementById("feelsLike").textContent =
    `Feels like ${Math.round(feels)}°`;

  document.getElementById("humidity").textContent =
    `${data.current.humidity}%`;

  document.getElementById("wind").textContent =
    `${Math.round(windSpeed)} ${windUnit}`;

  document.getElementById("sunrise").textContent =
    data.forecast.forecastday[0].astro.sunrise;

  document.getElementById("sunset").textContent =
    data.forecast.forecastday[0].astro.sunset;

  document.getElementById("weatherIcon").src =
    "https:" + data.current.condition.icon.replace("64x64", "128x128");

  document.getElementById("pressure").textContent =
    `${data.current.pressure_mb} hPa`;

  document.getElementById("uv").textContent =
    data.current.uv;

  document.getElementById("visibility").textContent =
    `${Math.round(visibility)} ${visibilityUnit}`;

  const dateTime = new Date(data.location.localtime);
  document.getElementById("localTime").textContent =
    dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("date").textContent =
    dateTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  const aqi = data.current.air_quality ? data.current.air_quality["us-epa-index"] : 1;
  document.getElementById("aqi").textContent = getAQIText(aqi);
  updateAQIColor(aqi);
}

function getAQIText(aqi) {
  const levels = ["Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"];
  return levels[aqi - 1] || "N/A";
}

function updateAQIColor(aqi) {
  const aqiElement = document.getElementById("aqi");
  const colors = ["#4CAF50", "#FF9800", "#F44336", "#9C27B0", "#795548"];
  aqiElement.style.color = colors[aqi - 1] || "#fff";
}

function updateAdvanced(data) {
  document.getElementById("dewPoint").textContent =
    `${isCelsius ? data.current.dewpoint_c : data.current.dewpoint_f}°`;
  document.getElementById("cloud").textContent =
    `${data.current.cloud}%`;
  document.getElementById("gust").textContent =
    `${isCelsius ? data.current.gust_kph : data.current.gust_mph} ${isCelsius ? "km/h" : "mph"}`;
  document.getElementById("precip").textContent =
    `${data.current.precip_mm} mm`;
  document.getElementById("moonPhase").textContent =
    data.forecast.forecastday[0].astro.moon_phase;
}

function updateHourly(hours) {
  const container = document.getElementById("hourlyCards");
  container.innerHTML = "";
  
  const now = new Date();
  const currentHour = now.getHours();
  
  hours.slice(currentHour, currentHour + 12).forEach(hour => {
    const time = new Date(hour.time);
    const temp = isCelsius ? hour.temp_c : hour.temp_f;
    const card = document.createElement("div");
    card.className = "hourly-card";
    card.innerHTML = `
      <p class="hourly-time">${time.getHours()}:00</p>
      <img src="https:${hour.condition.icon}">
      <p class="hourly-temp">${Math.round(temp)}°</p>
      <p class="hourly-precip">${hour.chance_of_rain}%</p>
    `;
    container.appendChild(card);
  });
}

function updateForecast(days) {
  const container = document.getElementById("forecastCards");
  container.innerHTML = "";

  days.forEach((day, index) => {
    const temp = isCelsius ? day.day.avgtemp_c : day.day.avgtemp_f;
    const card = document.createElement("div");
    card.className = "forecast-card";
    const date = new Date(day.date);
    const dayName = index === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" });
    
    card.innerHTML = `
      <div class="forecast-header">
        <p class="forecast-day">${dayName}</p>
        <p class="forecast-date">${date.getDate()}/${date.getMonth() + 1}</p>
      </div>
      <div class="forecast-icon">
        <img src="https:${day.day.condition.icon.replace("64x64", "128x128")}">
        <p class="forecast-desc">${day.day.condition.text}</p>
      </div>
      <div class="forecast-temps">
        <span class="high-temp">H: ${Math.round(isCelsius ? day.day.maxtemp_c : day.day.maxtemp_f)}°</span>
        <span class="low-temp">L: ${Math.round(isCelsius ? day.day.mintemp_c : day.day.mintemp_f)}°</span>
      </div>
      <div class="forecast-details">
        <span>💧 ${day.day.avghumidity}%</span>
        <span>🌧️ ${day.day.daily_chance_of_rain}%</span>
      </div>
    `;
    container.appendChild(card);
  });
}

searchBtn.onclick = () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
};

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
  }
});

unitToggle.onclick = () => {
  isCelsius = !isCelsius;
  unitToggle.textContent = isCelsius ? "°F" : "°C";
  unitToggle.className = isCelsius ? "unit-btn celsius" : "unit-btn fahrenheit";
  const last = localStorage.getItem("lastCity");
  if (last) fetchWeather(last);
};

geoBtn.onclick = () => {
  if (!navigator.geolocation) {
    showError("Geolocation not supported");
    return;
  }
  
  geoBtn.disabled = true;
  geoBtn.innerHTML = '<div class="mini-spinner"></div>';
  
  navigator.geolocation.getCurrentPosition(
    pos => {
      fetchWeather(`${pos.coords.latitude},${pos.coords.longitude}`);
      geoBtn.disabled = false;
      geoBtn.innerHTML = '<i class="wi wi-gps"></i>';
    },
    () => {
      showError("Location permission denied");
      geoBtn.disabled = false;
      geoBtn.innerHTML = '<i class="wi wi-gps"></i>';
    }
  );
};

function applyTheme(theme) {
  document.body.className = theme;
  appContainer.className = `app ${theme}`;
  currentTheme = theme;
  localStorage.setItem("theme", theme);
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  const icons = {
    "default": "🌱",
    "dark": "🌙",
    "gaming": "🎮",
    "sunset": "🌇",
    "ocean": "🌊"
  };
  themeSelect.value = theme;
}

themeSelect.onchange = () => {
  applyTheme(themeSelect.value);
};

const lastCity = localStorage.getItem("lastCity");
if (lastCity) {
  cityInput.value = lastCity;
  fetchWeather(lastCity);
}

const savedTheme = localStorage.getItem("theme") || "default";
applyTheme(savedTheme);

setInterval(() => {
  const timeEl = document.getElementById("localTime");
  if (timeEl.textContent) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}, 60000);