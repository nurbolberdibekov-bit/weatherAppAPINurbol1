const searchInput = document.querySelector(".search-input");
const currentWeatherDiv = document.querySelector(".current-weather");
const hourlyWeather = document.querySelector(".hourly-weather .weather-list");
const cityNameEl = document.querySelector(".city-name");
const localDateEl = document.querySelector(".local-date");
const minMaxEl = document.querySelector(".min-max");
const precipEl = document.querySelector(".precip");
const humidityEl = document.querySelector(".humidity");
const windEl = document.querySelector(".wind");
const todayRangeEl = document.querySelector(".today-range");
const dailyList = document.querySelector(".daily-list");
const API_KEY = "10bf8429149147c6b10221106251812"; // API key
// Weather codes for mapping to custom icons
const weatherCodes = {
    clear: [1000],
    clouds: [1003, 1006, 1009],
    mist: [1030, 1135, 1147],
    rain: [1063, 1150, 1153, 1168, 1171, 1180, 1183, 1198, 1201, 1240, 1243, 1246, 1273, 1276],
    moderate_heavy_rain: [1186, 1189, 1192, 1195, 1243, 1246],
    snow: [1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282],
    thunder: [1087, 1279, 1282],
    thunder_rain: [1273, 1276],
}
// Utility: map condition code to icon name
const getWeatherIcon = (code) => Object.keys(weatherCodes).find(icon => weatherCodes[icon].includes(code)) || "clear";

// Display the hourly forecast for the next 24 hours
const displayHourlyForecast = (hourlyData) => {
    const currentHour = new Date().setMinutes(0, 0, 0);
    const next24Hours = currentHour + 24 * 60 * 60 * 1000;
    const next24HoursData = hourlyData.filter(({ time }) => {
        const forecastTime = new Date(time).getTime();
        return forecastTime >= currentHour && forecastTime <= next24Hours;
    });

    hourlyWeather.innerHTML = next24HoursData.map((item) => {
        const temperature = Math.floor(item.temp_c);
        const time = item.time.split(' ')[1].substring(0, 5);
        const weatherIcon = getWeatherIcon(item.condition.code);
        return `<li class="weather-item">
            <p class="time">${time}</p>
            <img src="icons/${weatherIcon}.svg" class="weather-icon" alt="${item.condition.text}">
            <p class="temperature">${temperature}°</p>
          </li>`;
    }).join('');
};

// Display daily forecast for the next days
const displayDailyForecast = (forecastDays) => {
    const remainingDays = forecastDays.slice(1); // skip current day
    dailyList.innerHTML = remainingDays.map((day, idx) => {
        const dateObj = new Date(day.date);
        const isTomorrow = idx === 0;
        const dayLabel = isTomorrow ? "Tomorrow" : dateObj.toLocaleDateString("en-US", { weekday: "long" });
        const max = Math.round(day.day.maxtemp_c);
        const min = Math.round(day.day.mintemp_c);
        const icon = getWeatherIcon(day.day.condition.code);
        return `<li>
            <p class="day">${dayLabel}</p>
            <img class="mini-icon" src="icons/${icon}.svg" alt="${day.day.condition.text}">
            <div class="temps">
              <span>${max}°</span>
              <span>${min}°</span>
            </div>
        </li>`;
    }).join("");
};
// Fetch and display weather details
const getWeatherDetails = async (API_URL) => {
    window.innerWidth <= 768 && searchInput.blur();
    document.body.classList.remove("show-no-results");
    try {
        // Fetch weather data from the API and parse the response as JSON
        const response = await fetch(API_URL);
        const data = await response.json();
        // Extract current weather details
        const temperature = Math.floor(data.current.temp_c);
        const description = data.current.condition.text;
        const weatherIcon = getWeatherIcon(data.current.condition.code);
        const today = data.forecast?.forecastday?.[0];
        const tomorrow = data.forecast?.forecastday?.[1];
        const localDate = new Date(data.location.localtime);

        // Update the current weather display
        currentWeatherDiv.querySelector(".weather-icon").src = `icons/${weatherIcon}.svg`;
        currentWeatherDiv.querySelector(".temperature").innerHTML = `${temperature}<span>°C</span>`;
        currentWeatherDiv.querySelector(".description").innerText = description;
        minMaxEl.innerText = `Max: ${Math.round(today?.day?.maxtemp_c ?? 0)}° Min: ${Math.round(today?.day?.mintemp_c ?? 0)}°`;

        cityNameEl.innerText = data.location.name;
        localDateEl.innerText = localDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        todayRangeEl.innerText = `${localDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${tomorrow ? ` - ${new Date(tomorrow.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}`;

        precipEl.innerText = `${Math.round(today?.day?.daily_chance_of_rain ?? data.current.precip_mm ?? 0)}%`;
        humidityEl.innerText = `${Math.round(data.current.humidity)}%`;
        windEl.innerText = `${Math.round(data.current.wind_kph)} km/h`;

        // Combine hourly data from today and tomorrow
        const combinedHourlyData = [...data.forecast?.forecastday[0]?.hour, ...data.forecast?.forecastday[1]?.hour];
        searchInput.value = data.location.name;
        displayHourlyForecast(combinedHourlyData);
        displayDailyForecast(data.forecast?.forecastday || []);
    } catch (error) {
        document.body.classList.add("show-no-results");
    }
}
// Set up the weather request for a specific city
const setupWeatherRequest = (cityName) => {
    const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${cityName}&days=2`;
    getWeatherDetails(API_URL);
}
// Handle user input in the search box
searchInput.addEventListener("keyup", (e) => {
    const cityName = searchInput.value.trim();
    if (e.key == "Enter" && cityName) {
        setupWeatherRequest(cityName);
    }
});

// Get user's coordinates and fetch weather data for the current location
const locationButton = document.querySelector(".location-button");
locationButton.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=2`;
            getWeatherDetails(API_URL);
            window.innerWidth >= 768 && searchInput.focus();
        },
        () => {
            alert("Location access denied. Please enable permissions to use this feature.");
        }
    );
});

// Initial weather request for London as the default city
setupWeatherRequest("Bishkek");