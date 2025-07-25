// Weather API configuration
const API_KEY = '36a99cf4335981c17eb4a64a7bc14c9d'; // You need to replace this with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const currentLocationBtn = document.getElementById('current-location-btn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const weatherDisplay = document.getElementById('weather-display');

// Weather data elements
const cityName = document.getElementById('city-name');
const countryName = document.getElementById('country-name');
const currentDate = document.getElementById('current-date');
const weatherImg = document.getElementById('weather-img');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feels-like');
const weatherMain = document.getElementById('weather-main');
const weatherDesc = document.getElementById('weather-desc');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const tempMax = document.getElementById('temp-max');
const tempMin = document.getElementById('temp-min');
const windDirection = document.getElementById('wind-direction');
const windGust = document.getElementById('wind-gust');
const lastUpdated = document.getElementById('last-updated');

// Initialize the app
function initializeApp() {
    // Set current date
    displayCurrentDate();
    
    // Add event listeners
    searchBtn.addEventListener('click', handleSearch);
    currentLocationBtn.addEventListener('click', getCurrentLocation);
    locationInput.addEventListener('keypress', handleKeyPress);
    
    // Try to load weather for default location or last searched location
    const lastLocation = localStorage.getItem('lastSearchedLocation');
    if (lastLocation) {
        fetchWeatherByCity(lastLocation);
    }
}

// Display current date
function displayCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

// Handle search button click
function handleSearch() {
    const location = locationInput.value.trim();
    if (location) {
        fetchWeatherByCity(location);
    } else {
        showError('Please enter a city name');
    }
}

// Handle Enter key press in input field
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
}

// Get current location using geolocation API
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherByCoords(lat, lon);
        },
        (error) => {
            let errorMsg = 'Unable to get your location';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = 'Location access denied by user';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    errorMsg = 'Location request timed out';
                    break;
            }
            showError(errorMsg);
        },
        {
            timeout: 10000,
            enableHighAccuracy: true
        }
    );
}

// Fetch weather data by city name
async function fetchWeatherByCity(city) {
    showLoading();
    
    try {
        const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else if (response.status === 401) {
                throw new Error('API key is invalid. Please check the configuration.');
            } else {
                throw new Error('Failed to fetch weather data. Please try again later.');
            }
        }
        
        const data = await response.json();
        displayWeatherData(data);
        
        // Save last searched location
        localStorage.setItem('lastSearchedLocation', city);
        
    } catch (error) {
        showError(error.message);
    }
}

// Fetch weather data by coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data for your location');
        }
        
        const data = await response.json();
        displayWeatherData(data);
        
    } catch (error) {
        showError(error.message);
    }
}

// Display weather data on the page
function displayWeatherData(data) {
    hideLoading();
    hideError();
    
    // Basic location info
    cityName.textContent = data.name;
    countryName.textContent = data.sys.country;
    
    // Weather icon
    const iconCode = data.weather[0].icon;
    weatherImg.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherImg.alt = data.weather[0].description;
    
    // Temperature
    temperature.textContent = Math.round(data.main.temp);
    feelsLike.textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
    
    // Weather description
    weatherMain.textContent = data.weather[0].main;
    weatherDesc.textContent = data.weather[0].description;
    
    // Weather details
    windSpeed.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    humidity.textContent = `${data.main.humidity}%`;
    visibility.textContent = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';
    pressure.textContent = `${data.main.pressure} hPa`;
    
    // Sunrise and sunset
    sunrise.textContent = formatTime(data.sys.sunrise);
    sunset.textContent = formatTime(data.sys.sunset);
    
    // Temperature range
    tempMax.textContent = `${Math.round(data.main.temp_max)}°C`;
    tempMin.textContent = `${Math.round(data.main.temp_min)}°C`;
    
    // Wind information
    windDirection.textContent = data.wind.deg ? `${data.wind.deg}°` : 'N/A';
    windGust.textContent = data.wind.gust ? `${(data.wind.gust * 3.6).toFixed(1)} km/h` : 'N/A';
    
    // Last updated
    lastUpdated.textContent = new Date().toLocaleTimeString();
    
    // Show weather display
    weatherDisplay.classList.remove('hidden');
    
    // Clear input field
    locationInput.value = '';
    
    // Update page background based on weather condition
    updateBackgroundBasedOnWeather(data.weather[0].main.toLowerCase());
}

// Format timestamp to readable time
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// Update background gradient based on weather condition
function updateBackgroundBasedOnWeather(condition) {
    const body = document.body;
    
    // Remove existing weather classes
    body.className = body.className.replace(/weather-\w+/g, '');
    
    // Add weather-specific class
    body.classList.add(`weather-${condition}`);
    
    // Apply different gradients based on weather
    let gradient;
    switch (condition) {
        case 'clear':
            gradient = 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #fdcb6e 100%)';
            break;
        case 'clouds':
            gradient = 'linear-gradient(135deg, #636e72 0%, #b2bec3 50%, #74b9ff 100%)';
            break;
        case 'rain':
        case 'drizzle':
            gradient = 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #2d3436 100%)';
            break;
        case 'thunderstorm':
            gradient = 'linear-gradient(135deg, #2d3436 0%, #636e72 50%, #74b9ff 100%)';
            break;
        case 'snow':
            gradient = 'linear-gradient(135deg, #ddd 0%, #74b9ff 50%, #636e72 100%)';
            break;
        case 'mist':
        case 'fog':
        case 'haze':
            gradient = 'linear-gradient(135deg, #b2bec3 0%, #636e72 50%, #74b9ff 100%)';
            break;
        default:
            gradient = 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)';
    }
    
    body.style.background = gradient;
}

// Show loading indicator
function showLoading() {
    loading.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

// Hide loading indicator
function hideLoading() {
    loading.classList.add('hidden');
}

// Show error message
function showError(message) {
    hideLoading();
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
}

// Hide error message
function hideError() {
    errorMessage.classList.add('hidden');
}

// Add some sample cities for quick access
function addQuickAccessCities() {
    const popularCities = ['New York', 'London', 'Paris', 'Tokyo', 'Sydney', 'Mumbai'];
    
    const quickAccess = document.createElement('div');
    quickAccess.className = 'quick-access';
    quickAccess.innerHTML = `
        <h4>Popular Cities:</h4>
        <div class="city-buttons">
            ${popularCities.map(city => 
                `<button class="city-btn" onclick="fetchWeatherByCity('${city}')">${city}</button>`
            ).join('')}
        </div>
    `;
    
    // Insert after search section
    const searchSection = document.querySelector('.search-section');
    searchSection.insertAdjacentElement('afterend', quickAccess);
}

// Handle offline/online status
function handleConnectionStatus() {
    window.addEventListener('online', () => {
        console.log('Connection restored');
        hideError();
    });
    
    window.addEventListener('offline', () => {
        showError('No internet connection. Please check your network and try again.');
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    handleConnectionStatus();
    
    // Add quick access cities after a short delay
    setTimeout(addQuickAccessCities, 500);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + L to focus location input
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        locationInput.focus();
    }
    
    // Ctrl/Cmd + Enter to search
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        locationInput.value = '';
        locationInput.blur();
    }
});

// Add CSS for quick access cities
const quickAccessStyles = `
    .quick-access {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 20px;
        margin-bottom: 30px;
        text-align: center;
    }
    
    .quick-access h4 {
        color: white;
        margin-bottom: 15px;
        font-size: 1.1rem;
    }
    
    .city-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
    }
    
    .city-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 8px 15px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }
    
    .city-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
    }
`;

// Inject the styles
const style = document.createElement('style');
style.textContent = quickAccessStyles;
document.head.appendChild(style);

// Weather condition mapping for better user experience
const weatherConditions = {
    'clear sky': '☀️',
    'few clouds': '⛅',
    'scattered clouds': '☁️',
    'broken clouds': '☁️',
    'shower rain': '🌦️',
    'rain': '🌧️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'mist': '🌫️'
};

// Add weather emoji to description
function addWeatherEmoji(description) {
    const emoji = weatherConditions[description] || '🌤️';
    return `${emoji} ${description}`;
}

// Enhanced error handling with retry functionality
function showErrorWithRetry(message, retryFunction = null) {
    hideLoading();
    
    let errorHTML = `
        <span class="error-icon">⚠️</span>
        <p>${message}</p>
    `;
    
    if (retryFunction) {
        errorHTML += `
            <button class="retry-btn" onclick="${retryFunction}">
                🔄 Try Again
            </button>
        `;
    }
    
    errorMessage.innerHTML = errorHTML;
    errorMessage.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
}

// Add retry button styles
const retryStyles = `
    .retry-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        margin-top: 15px;
        transition: all 0.3s ease;
    }
    
    .retry-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
    }
`;

// Add retry styles to the document
const retryStyleElement = document.createElement('style');
retryStyleElement.textContent = retryStyles;
document.head.appendChild(retryStyleElement);

// Save weather data to local storage for offline access
function saveWeatherData(data) {
    const weatherCache = {
        data: data,
        timestamp: Date.now(),
        expiry: Date.now() + (10 * 60 * 1000) // 10 minutes
    };
    localStorage.setItem(`weather_${data.name}`, JSON.stringify(weatherCache));
}

// Load weather data from local storage
function loadCachedWeatherData(city) {
    const cached = localStorage.getItem(`weather_${city}`);
    if (cached) {
        const weatherCache = JSON.parse(cached);
        if (Date.now() < weatherCache.expiry) {
            return weatherCache.data;
        } else {
            // Remove expired data
            localStorage.removeItem(`weather_${city}`);
        }
    }
    return null;
}

// Auto-refresh weather data every 10 minutes
let refreshInterval;

function startAutoRefresh(city) {
    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set new interval for 10 minutes
    refreshInterval = setInterval(() => {
        if (city) {
            fetchWeatherByCity(city, true); // Silent refresh
        }
    }, 10 * 60 * 1000);
}

// Enhanced fetch function with caching
async function fetchWeatherByCity(city, silentRefresh = false) {
    if (!silentRefresh) {
        showLoading();
    }
    
    // Try to load cached data first
    const cachedData = loadCachedWeatherData(city);
    if (cachedData && !silentRefresh) {
        displayWeatherData(cachedData);
        return;
    }
    
    try {
        const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else if (response.status === 401) {
                throw new Error('Weather service is currently unavailable. Please try again later.');
            } else {
                throw new Error('Failed to fetch weather data. Please try again later.');
            }
        }
        
        const data = await response.json();
        
        // Save to cache
        saveWeatherData(data);
        
        displayWeatherData(data);
        
        // Save last searched location
        localStorage.setItem('lastSearchedLocation', city);
        
        // Start auto-refresh
        startAutoRefresh(city);
        
    } catch (error) {
        // If it's a network error and we have cached data, show cached data with warning
        const cachedData = loadCachedWeatherData(city);
        if (cachedData) {
            displayWeatherData(cachedData);
            showWarning('Showing cached data. Network connection failed.');
        } else {
            showError(error.message);
        }
    }
}

// Show warning message
function showWarning(message) {
    const warningElement = document.createElement('div');
    warningElement.className = 'warning-message';
    warningElement.innerHTML = `
        <span class="warning-icon">⚠️</span>
        <p>${message}</p>
    `;
    
    // Insert warning after search section
    const searchSection = document.querySelector('.search-section');
    searchSection.insertAdjacentElement('afterend', warningElement);
    
    // Remove warning after 5 seconds
    setTimeout(() => {
        if (warningElement.parentNode) {
            warningElement.parentNode.removeChild(warningElement);
        }
    }, 5000);
}

// Add warning styles
const warningStyles = `
    .warning-message {
        background: rgba(255, 193, 7, 0.9);
        color: #333;
        padding: 15px;
        border-radius: 10px;
        text-align: center;
        margin-bottom: 20px;
        animation: slideDown 0.3s ease-out;
    }
    
    .warning-icon {
        font-size: 1.5rem;
        margin-right: 10px;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

// Add warning styles to document
const warningStyleElement = document.createElement('style');
warningStyleElement.textContent = warningStyles;
document.head.appendChild(warningStyleElement);

