/* ================= CONFIG ================= */
const API_KEY = "1aa46e900cf1414288762057262001"; 
const BASE_URL = "https://api.weatherapi.com/v1";

let isCelsius = true;

/* ================= DOM ================= */
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const unitToggle = document.getElementById("unitToggle");
const themeToggle = document.getElementById("themeToggle");

const errorEl = document.getElementById("error");
const loadingEl = document.getElementById("loading");
const currentWeatherEl = document.getElementById("currentWeather");
const forecastEl = document.getElementById("forecast");

/* ================= HELPERS ================= */
const showLoading = () => loadingEl.classList.remove("hidden");
const hideLoading = () => loadingEl.classList.add("hidden");
const showError = msg => {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
};
const clearError = () => errorEl.classList.add("hidden");

/* ================= API ================= */
async function fetchWeather(query) {
  showLoading();
  clearError();

  try {
    const res = await fetch(
      `${BASE_URL}/forecast.json?key=${API_KEY}&q=${query}&days=5`
    );

    const data = await res.json();

    // ✅ CRITICAL FIX
    if (data.error) throw new Error(data.error.message);

    localStorage.setItem("lastCity", query);

    updateCurrent(data);
    updateForecast(data.forecast.forecastday);
  } catch (err) {
    showError(err.message || "Unable to fetch weather");
    currentWeatherEl.classList.add("hidden");
    forecastEl.classList.add("hidden");
  } finally {
    hideLoading();
  }
}

/* ================= UI ================= */
function updateCurrent(data) {
  currentWeatherEl.classList.remove("hidden");
  forecastEl.classList.remove("hidden");

  const temp = isCelsius ? data.current.temp_c : data.current.temp_f;
  const feels = isCelsius ? data.current.feelslike_c : data.current.feelslike_f;

  document.getElementById("cityName").textContent =
    `${data.location.name}, ${data.location.country}`;

  document.getElementById("temperature").textContent =
    `${temp}°${isCelsius ? "C" : "F"}`;

  document.getElementById("description").textContent =
    data.current.condition.text;

  document.getElementById("feelsLike").textContent =
    `Feels like ${feels}°`;

  document.getElementById("humidity").textContent =
    data.current.humidity;

  document.getElementById("wind").textContent =
    data.current.wind_kph;

  document.getElementById("sunrise").textContent =
    data.forecast.forecastday[0].astro.sunrise;

  document.getElementById("sunset").textContent =
    data.forecast.forecastday[0].astro.sunset;

  document.getElementById("weatherIcon").src =
    "https:" + data.current.condition.icon;
}

function updateForecast(days) {
  const container = document.getElementById("forecastCards");
  container.innerHTML = "";

  days.forEach(day => {
    const temp = isCelsius ? day.day.avgtemp_c : day.day.avgtemp_f;
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <p>${new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}</p>
      <img src="https:${day.day.condition.icon}">
      <p>${temp}°</p>
    `;
    container.appendChild(card);
  });
}

/* ================= EVENTS ================= */
searchBtn.onclick = () => {
  if (cityInput.value.trim()) fetchWeather(cityInput.value.trim());
};

unitToggle.onclick = () => {
  isCelsius = !isCelsius;
  unitToggle.textContent = isCelsius ? "°F" : "°C";
  const last = localStorage.getItem("lastCity");
  if (last) fetchWeather(last);
};

geoBtn.onclick = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    fetchWeather(`${pos.coords.latitude},${pos.coords.longitude}`);
  }, () => showError("Location permission denied"));
};

themeToggle.onclick = () => document.body.classList.toggle("dark");

/* ================= INIT ================= */
const lastCity = localStorage.getItem("lastCity");
if (lastCity) fetchWeather(lastCity);
