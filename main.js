const seoSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Live Weather Forecast",
  "url": "https://yourwebsite.com/",
  "description": "Accurate live weather updates including temperature, humidity, wind speed, and forecasts for your city.",
  "publisher": {
    "@type": "Organization",
    "name": "Live Weather Forecast"
  }
};

const script = document.createElement('script');
script.type = 'application/ld+json';
script.text = JSON.stringify(seoSchema);
document.head.appendChild(script);

window.addEventListener("DOMContentLoaded", () => {
  let saved = JSON.parse(localStorage.getItem("cities") || "[]");

  // ✅ remove invalid entries
  saved = saved.filter(c => c && c.city && typeof c.city === "string");

  localStorage.setItem("cities", JSON.stringify(saved));

  saved.forEach((c) =>
    addCityCard(c.city, c.condition, c.minTemp, c.maxTemp, c.currentTemp)
  );
});



 document.querySelectorAll('.toggleBtn').forEach((btn, index) => {
    const cloud = btn.querySelector('.cloud');
    const cloudImg = btn.querySelector('.cloudImg');
    let isDark = false;

    btn.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        isDark = !isDark;

        if (isDark) {
            cloudImg.src = "storm.png";
            cloud.classList.add("translate-x-5");
        } else {
            cloudImg.src = "sun.png";
            cloud.classList.remove("translate-x-5");
        }
    });
});

    
    
// country suggestions
const searchInput = document.getElementById('search');
const suggestionsList = document.getElementById('suggestions');

let t; // debounce

searchInput.addEventListener('input', () => {
  clearTimeout(t);
  const q = searchInput.value.trim();
  suggestionsList.innerHTML = '';
  if (q.length < 2) return;

  // debounce 200ms
  t = setTimeout(() => fetchCities(q), 200);
});

async function fetchCities(query) {
  try {
    // Open-Meteo Geocoding: no API key needed
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=12&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    const results = (data.results || []);

    // (Optional) start-with filter to match your requirement strictly
    const filtered = results.filter(r =>
      r.name.toLowerCase().startsWith(query.toLowerCase())
    );

    renderSuggestions(filtered.length ? filtered : results);
  } catch (e) {
    console.error('Error fetching cities:', e);
    suggestionsList.innerHTML = `<li class="text-gray-500">Failed to fetch</li>`;
  }
}

function renderSuggestions(list) {
  suggestionsList.innerHTML = '';
  if (!list.length) {
    suggestionsList.innerHTML = `<li class="text-gray-500">No city found</li>`;
    return;
  }

  list.forEach(item => {
    const cityLabel = [
      item.name,
      item.admin1 ? item.admin1 : null,
      item.country
    ].filter(Boolean).join(', ');

    const li = document.createElement('li');
    li.textContent = cityLabel;
    li.className = 'bg-white text-gray-900 rounded-xl px-2 py-2 cursor-pointer hover:bg-gray-200 h-[50px] flex items-center font-bold font-poppins';

    li.addEventListener('click', () => {
      searchInput.value = cityLabel;
      suggestionsList.innerHTML = '';
      // yahan lat/lon bhi use kar sakte ho weather API ke liye:
      // item.latitude, item.longitude
    });

    suggestionsList.appendChild(li);
  });
}



//current location 

// current location with Nominatim (area-level accuracy)
const locBtn = document.querySelector("#locBtn");
const searchOutput = document.getElementById("search");

const firstTimeKey = "location_permission_granted";

locBtn.addEventListener("click", () => {
  // Check agar user ne pehle allow kar diya hai
  const alreadyGranted = localStorage.getItem(firstTimeKey);

  if (alreadyGranted) {
    // ✅ Sidha location fetch karo (popup nahi aayega)
    fetchLocation();
  } else {
    // ✅ Pehli baar → popup aayega
    requestLocationPermission();
  }
});

function requestLocationPermission() {
  if (!navigator.geolocation) {
    alert("❌ Geolocation not supported in your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      localStorage.setItem(firstTimeKey, "true"); // ✅ Save kiya ke user ne allow kar diya
      await fetchLocationData(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      alert("Location error: " + err.message);
    }
  );
}

function fetchLocation() {
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await fetchLocationData(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      console.error("Location fetch error:", err);
    }
  );
}

async function fetchLocationData(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    console.log("Fetching:", url);

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch geocoding API");

    const data = await res.json();
    console.log("API Response:", data);

    const area =
      data.city ||
      data.locality ||
      data.localityInfo?.administrative?.[0]?.name ||
      "";
    const state = data.principalSubdivision || "";
    const country = data.countryName || "";

    searchOutput.value = [area, state, country].filter(Boolean).join(", ");
  } catch (e) {
    console.error("Fetch error:", e);
    searchOutput.value = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

//dynamic cards

/* ===================== CITY CARDS & STORAGE ===================== */
const cardsContainer = document.getElementById("cardsContainer");

const screen3 = document.getElementById("screenthree");

function addCityCard(name, condition, minTemp, maxTemp, currentTemp) {
  if (!cardsContainer) return;

  // Avoid duplicates
  const exists = [...cardsContainer.querySelectorAll(".city-title")].some(
    (h1) => h1.textContent.trim().toLowerCase() === name.trim().toLowerCase()
  );
  if (exists) return;

  const card = document.createElement("div");
  card.className =
    "bg-white/10 w-[90vw] h-[10vh] rounded-xl flex font-bold font-poppins text-white p-3 justify-between items-center m-2";

  card.innerHTML = `
   <div class="annu select-box hidden h-5 w-5 border border-white flex items-center justify-center">
      <div class="correctClick text-white text-[12px] hidden">
        <i class="fa-solid fa-check"></i>
      </div>
    </div>
    <div class="flex flex-col">
      <h1 class="text-xl city-title">${name}</h1>
      <div class="harish flex gap-[10px] text-[10px]">
        <p>${condition}</p>
        <div class="flex">
          <p>${minTemp}</p>
          <p>~</p>
          <p>${maxTemp}</p>
          <p>°C</p>
        </div>
      </div>
    </div>
    <div class="varish flex">
      <div>
        <h1 class="text-5xl">${currentTemp}</h1>
      </div>
      <div>°C</div>
    </div>
  `;

  cardsContainer.appendChild(card);

const annu = card.querySelector(".annu");
annu.addEventListener("click", () => {
  document.querySelector(".binBtn").classList.toggle("opacity-100");
});

  // Persist
  const saved = JSON.parse(localStorage.getItem("cities") || "[]");
  const already = saved.some(
    (c) => c.city.toLowerCase() === name.toLowerCase()
  );
  if (!already) {
    saved.push({ city: name, condition, minTemp, maxTemp, currentTemp });
    localStorage.setItem("cities", JSON.stringify(saved));
  }
}

/* ===================== WEATHER FETCH (Open-Meteo Geocoding + Forecast) ===================== */
async function fetchWeather(cityQuery) {
  try {
    // ✅ Sirf pehla hissa lo (comma se split karke)
    const shortQuery = cityQuery.split(",")[0].trim();

    // 1) city -> lat/lon (Open-Meteo geocoding)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      shortQuery
    )}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      console.error("City not found:", cityQuery);
      return;
    }

    const { latitude: lat, longitude: lon, name, country } = geoData.results[0];

    // ✅ Display name (sirf city)
    const displayName = name;

    // 2) Weather by lat/lon
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const wRes = await fetch(wUrl);
    const data = await wRes.json();

    const currentTemp = Math.round(data.current.temperature_2m);
    const minTemp = Math.round(data.daily.temperature_2m_min[0]);
    const maxTemp = Math.round(data.daily.temperature_2m_max[0]);

    const weatherCodes = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Rime fog",
      51: "Light drizzle",
      53: "Drizzle",
      55: "Heavy drizzle",
      61: "Slight rain",
      63: "Rain",
      65: "Heavy rain",
      71: "Snow fall",
      80: "Rain showers",
      81: "Rain showers",
      82: "Heavy showers",
      95: "Thunderstorm",
    };

    const code = data.current.weather_code;
    const condition = weatherCodes[code] || "Unknown";

    // ✅ Card me sirf city name
    addCityCard(displayName, condition, minTemp, maxTemp, currentTemp);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

/* ===================== SAVE / PLUS BUTTONS ===================== */


// Optional center plus icon: give HTML element id="plusBtn"
const plusBtn = document.querySelector("#plusBtn");
if (plusBtn) {
  plusBtn.addEventListener("click", () => {
    const city = (searchInput?.value || "").trim();
    /*if (!city) {
      alert("⚠️ Please enter/select a city first");
      return;
    }*/
    fetchWeather(city);
  });
}

/* ===================== LOAD SAVED CITIES ON START ===================== */
window.addEventListener("DOMContentLoaded", () => {
  const saved = JSON.parse(localStorage.getItem("cities") || "[]");
  saved.forEach((c) =>
    addCityCard(c.city, c.condition, c.minTemp, c.maxTemp, c.currentTemp)
  );
});


//screen changes

document.addEventListener("DOMContentLoaded", () => {
  const screen1 = document.getElementById("screenone");
  const screen2 = document.getElementById("screentwo");
  const screen3 = document.getElementById("screenthree");
  const startBtn = document.getElementById("getstart");
  const plusBtn = document.getElementById("plusBtn");
  const screen4 = document.getElementById("screenfour");
  const search = document.getElementById("searchBtn");

  startBtn.addEventListener("click", () => {
    screen1.classList.add("hidden");
    screen2.classList.remove("hidden");
    screen3.classList.add("hidden");
    screen4.classList.add("hidden");
  });

  plusBtn.addEventListener("click", () => {
    screen1.classList.add("hidden");
    screen2.classList.add("hidden");
    screen3.classList.remove("hidden");
    screen4.classList.add("hidden");
  });
  
  searchBtn.addEventListener("click", () => {
  screen1.classList.add("hidden");
  screen2.classList.add("hidden");
  screen3.classList.add("hidden");
  screen4.classList.remove("hidden");
  });
});

//backBtn


document.getElementById("backBtn").addEventListener("click",() => {
  document.getElementById("screenthree").classList.add("hidden");
  document.getElementById("screentwo").classList.remove("hidden");
})

//editBtn
const backBtn = document.getElementById("backBtn");
const editBtn = document.getElementById("editBtn");
const selectAllBtn = document.getElementById("selectAllBtn");

let editMode = false; // track state

function setNormalState() {
  editMode = false;

  // Back icon (normal)
  backBtn.innerHTML = `
   <lord-icon
            src="https://cdn.lordicon.com/dcyiaoek.json"
            trigger="hover"
            colors="primary:#ffffff"
            style="width:20px;height:20px;display:block">
        </lord-icon>
  `;

  // Edit icon (normal)
  editBtn.innerHTML = `
    <lord-icon
      src="https://cdn.lordicon.com/nwfpiryp.json"
      trigger="hover"
      colors="primary:#ebe6ef,secondary:#e4e4e4,tertiary:#ffffff,quaternary:#ffffff"
      style="width:25px;height:25px;display:block">
    </lord-icon>
  `;

  selectAllBtn.classList.add("hidden"); // hide re
  
  document.querySelectorAll(".select-box").forEach(box => {
  box.classList.add("hidden");
});
  
  document.querySelectorAll(".harish").forEach(box => {
  box.classList.remove("hidden");
});

  document.querySelectorAll(".varish").forEach(box => {
  box.classList.remove("hidden");
});

  cardsContainer.addEventListener("click",() => {
    screenFour.classList.remove("hidden");
    screen3.classList.add("hidden");
  });
}

function setEditState() {
  editMode = true;

  // Check icon (instead of edit)
  editBtn.innerHTML = `
    <lord-icon
      src="https://cdn.lordicon.com/hrtsficn.json"
      trigger="hover"
      colors="primary:#ffffff"
      style="width:25px;height:25px;display:block">
    </lord-icon>
  `;

  selectAllBtn.classList.remove("hidden"); // show
  
 document.querySelectorAll(".select-box").forEach(box => {
  // sab box ko dikhana
  box.classList.remove("hidden");

  // har box pe click event
  box.addEventListener("click", () => {
    const tick = box.querySelector(".correctClick"); // is box ke andar ka tick
    if (tick) {
      tick.classList.toggle("hidden"); // toggle show/hide
    }
  });
});
  
  document.querySelectorAll(".harish").forEach(box => {
  box.classList.add("hidden");
});

  document.querySelectorAll(".varish").forEach(box => {
  box.classList.add("hidden");
});

  cardsContainer.addEventListener("click",() => {
    screenFour.classList.add("hidden");
    screen3.classList.remove("hidden");
  });

}

// Toggle with editBtn (edit ↔ check)
editBtn.addEventListener("click", () => {
  if (!editMode) {
    setEditState();   // go to edit mode
  } else {
    setNormalState(); // back to normal on check click
  }
});

// Toggle with backBtn (back ↔ wrong)
backBtn.addEventListener("click", () => {
  if (editMode) {
    setNormalState(); // back to normal on wrong click
  } else {
    // normal back ka action (optional)
    console.log("Normal back clicked");
  }
});

// start state
setNormalState();






//selectAllBtn all check

document.getElementById("Btn").addEventListener("click",() => {
  document.getElementById("rightClick").classList.toggle("hidden");
})

document.getElementById("Btn"); // tumhara outer box
let allSelected = false; // state track karne ke liye

selectAllBtn.addEventListener("click", () => {
  allSelected = !allSelected; // toggle state

  document.querySelectorAll(".select-box").forEach(box => {
    const tick = box.querySelector(".correctClick");
    if (tick) {
      if (allSelected) {
        tick.classList.remove("hidden"); // show tick
      } else {
        tick.classList.add("hidden"); // hide tick
      }
    }
  });


  document.getElementById("rightClick").classList.toggle("hidden", !allSelected);
});



//delete btn

// DELETE button ka event
document.querySelector(".binBtn").addEventListener("click", () => {
  const cardsContainer = document.getElementById("cardsContainer");
  
  

  // 1) Agar SelectAll tick hai → sab delete
  if (allSelected) {
    cardsContainer.innerHTML = ""; // sab card hata do
    localStorage.removeItem("cities"); // storage clear
    allSelected = false; // reset state
    document.getElementById("rightClick").classList.add("hidden"); // selectAll tick hatado
    return;
  }

  // 2) Nahi toh sirf selected cards delete karo
  const selectedBoxes = document.querySelectorAll(".select-box");
  let updatedCities = JSON.parse(localStorage.getItem("cities") || "[]");

  selectedBoxes.forEach((box) => {
    const tick = box.querySelector(".correctClick");
    if (tick && !tick.classList.contains("hidden")) {
      const card = box.closest(".bg-white\\/10"); // ya phir .city-card agar class diya ho
      if (card) {
        const cityName = card.querySelector(".city-title")?.textContent.trim();

        // LocalStorage se bhi delete
        updatedCities = updatedCities.filter(
          (c) => c.city.toLowerCase() !== cityName.toLowerCase()
        );

        card.remove(); // UI se delete
      }
    }
  });

  // LocalStorage update
  localStorage.setItem("cities", JSON.stringify(updatedCities));
});


const gaurav = document.querySelectorAll(".gaurav");

gaurav.forEach(el => {
  el.addEventListener("click", () => {
    document.querySelector(".binBtn").classList.toggle("opacity-100");
  });
});


//screenfour

document.getElementById("backBtnTwo").addEventListener("click", () => {
  document.getElementById("screenfour").classList.add("hidden");
  document.getElementById("screentwo").classList.remove("hidden");
});


const see = document.getElementById("seeMoreBtn");
const screenFour = document.getElementById("screenfour");
const screenFive = document.getElementById("screenFive");

// Click = show/hide screens
see.addEventListener("click", () => {
  screenFour.classList.add("hidden");
  screenFive.classList.remove("hidden");
});

// Opacity press effect (desktop + mobile)
see.addEventListener("mousedown", () => {
  see.classList.add("opacity-50");
});
see.addEventListener("mouseup", () => {
  see.classList.remove("opacity-50");
});
see.addEventListener("touchstart", () => {
  see.classList.add("opacity-50");
});
see.addEventListener("touchend", () => {
  see.classList.remove("opacity-50");
});


backBtnThree = document.getElementById("backBtnThree");

backBtnThree.addEventListener("click",() => {
  screenFive.classList.add("hidden");
  screenFour.classList.remove("hidden");
})


const menuBtn = document.getElementById("menuBtn");
const screenTwo = document.getElementById("screentwo");
const screenSix = document.getElementById("screenSix");

menuBtn.addEventListener("click" , () => {
  screenSix.classList.remove("hidden");
  screenTwo.classList.add("hidden");cloud
})

//screenfour work

document.addEventListener("DOMContentLoaded", function () {
  const searchBtn = document.getElementById("searchBtn");

  searchBtn.addEventListener("click", async function () {
    let cityInput = document.getElementById("search").value.trim();
    if (!cityInput) return;

    // 👇 Agar pura naam hai (Vasai, Maharashtra, India) toh sirf pehla part lo
    cityInput = cityInput.split(",")[0];

    try {
      // Step 1: Geocoding (Nominatim)
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityInput)}&format=json&limit=1`
      );
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        document.getElementById("cityName").textContent = "City not found";
        return;
      }

      // Pehla result
      const place = geoData[0];
      const shortCityName = place.display_name.split(",")[0];
      document.getElementById("cityName").textContent = shortCityName;

      const latitude = place.lat;
      const longitude = place.lon;

      // Step 2: Weather API (Open-Meteo)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const weatherData = await weatherRes.json();

      document.getElementById("temp").textContent = weatherData.current_weather.temperature.toFixed(0);
      document.getElementById("maxTemp").textContent = weatherData.daily.temperature_2m_max[0].toFixed(0);
      document.getElementById("minTemp").textContent = weatherData.daily.temperature_2m_min[0].toFixed(0);

    } catch (err) {
      console.error(err);
      document.getElementById("cityName").textContent = "Error fetching weather";
    }
  });
});


//hourlyForecast today date all change


//const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");
const hourlyForecast = document.getElementById("hourlyForecast");
const dayNameEl = document.getElementById("dayName");
const dateEl = document.getElementById("date");

// Weather icons map (code → png filename)
const weatherIcons = {
  0: "clear.png",      // Clear sky
  1: "clear.png",
  2: "cloud.png",      // Few clouds
  3: "cloud.png",      // Overcast
  45: "fog.png",       // Fog
  48: "fog.png",
  51: "rain.png",      // Drizzle
  53: "rain.png",
  55: "rain.png",
  61: "rain.png",      // Rain
  63: "rain.png",
  65: "rain.png",
  71: "snow.png",      // Snow
  73: "snow.png",
  75: "snow.png",
  95: "thunder.png",   // Thunderstorm
  96: "thunder.png",
  99: "thunder.png"
};

// Weather API function
async function getWeather(city) {
  try {
    // Agar "Vasai, Maharashtra, India" likha hai toh sirf "Vasai" lo
    if (city.includes(",")) {
      city = city.split(",")[0].trim();
    }

    // Get coordinates using geocoding API
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return alert("City not found!");
    }

    const { latitude, longitude, name } = geoData.results[0];

    // Get weather data
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&timezone=auto`
    );
    const weatherData = await weatherRes.json();

    // Clear old forecast
    hourlyForecast.innerHTML = "";

    // Get current time index
    const now = new Date();
    const currentHour = now.getHours();
    const startIndex = weatherData.hourly.time.findIndex(t => {
      return new Date(t).getHours() === currentHour;
    });

    // Show next 24 hours forecast
    for (let i = startIndex; i < startIndex + 24; i++) {
      const time = new Date(weatherData.hourly.time[i]);
      const temp = weatherData.hourly.temperature_2m[i];
      const code = weatherData.hourly.weathercode[i];

      // Select icon based on weather code
      const icon = weatherIcons[code] || "clear.png";

      // Create card
      const card = document.createElement("div");
      card.className =
        "flex flex-col justify-center items-center gap-[20px] font-poppins min-w-[80px]";

      card.innerHTML = `
        <div class="flex justify-center items-center text-white font-bold">
          <p>${temp}</p><p>°C</p>
        </div>
        <div>
          <img src="icons/${icon}" alt="weather" class="w-[50px]" />
        </div>
        <div class="flex justify-center items-center text-white font-bold">
          <p>${time.getHours().toString().padStart(2, "0")}</p>
          <p>:</p>
          <p>${time.getMinutes().toString().padStart(2, "0")}</p>
        </div>
      `;
      hourlyForecast.appendChild(card);
    }

    // Update day + date
    dayNameEl.textContent = now.toLocaleDateString("en-US", { weekday: "long" });
    dateEl.textContent = now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });

  } catch (error) {
    console.error(error);
    alert("Error fetching weather data!");
  }
}

// Search button click
searchBtn.addEventListener("click", () => {
  let city = searchInput.value.trim();
  if (!city) return alert("Enter a city name!");
  getWeather(city);
});


//7 days forecast 

/*const weatherIcons = {
  0: "clear.png",      // Clear sky
  1: "clear.png",
  2: "cloud.png",      // Few clouds
  3: "cloud.png",      // Overcast
  45: "fog.png",       // Fog
  48: "fog.png",
  51: "rain.png",      // Drizzle
  53: "rain.png",
  55: "rain.png",
  61: "rain.png",      // Rain
  63: "rain.png",
  65: "rain.png",
  71: "snow.png",      // Snow
  73: "snow.png",
  75: "snow.png",
  95: "thunder.png",   // Thunderstorm
  96: "thunder.png",
  99: "thunder.png"
};*/

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

// 🌦️ Fetch 7-days forecast (skip today, start from tomorrow)
async function loadForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&timezone=auto&forecast_days=8`;
  const res = await fetch(url);
  const data = await res.json();

  const container = document.querySelector(".forecast-cards");
  container.innerHTML = "";

  data.daily.time.slice(1).forEach((day, index) => {
    const temp = data.daily.temperature_2m_max[index + 1];
    const code = data.daily.weathercode[index + 1];
    const icon = weatherIcons[code] || "clear.png";

    const card = document.createElement("div");
    card.className =
      "flex flex-col justify-center items-center gap-[15px] bg-white/30 rounded-full p-4 font-poppins";
    card.innerHTML = `
      <div class="flex justify-center items-center text-white font-bold">
        <p>${temp}°C</p>
      </div>
      <div>
        <img src="icons/${icon}" alt="weather" class="w-[50px]" />
      </div>
      <div class="flex justify-center items-center text-white font-bold">
        <p>${formatDate(day)}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// 🔎 Get lat/lon from city name
async function searchCityAndLoad(cityName) {
  // User input ko split karke sirf pehla word le lo
  const cleanCity = cityName.split(",")[0].split(" ")[0];  

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.results && data.results.length > 0) {
    const { latitude, longitude, name, country } = data.results[0];
    console.log(`📍 ${name}, ${country} → ${latitude}, ${longitude}`);
    loadForecast(latitude, longitude);

    // Optional: City name UI pe dikhana ho toh
    const cityLabel = document.querySelector(".city-name");
    if (cityLabel) {
      cityLabel.innerText = `${name}, ${country}`;
    }
  } else {
    alert("City not found! Please try again");
  }
}

// ⬅️➡️ Scroll functionality
document.querySelector(".previous").addEventListener("click", () => {
  document.querySelector(".forecast-cards").scrollBy({ left: -200, behavior: "smooth" });
});

document.querySelector(".forward").addEventListener("click", () => {
  document.querySelector(".forecast-cards").scrollBy({ left: 200, behavior: "smooth" });
});

// 🚀 Search button click
document.getElementById("searchBtn").addEventListener("click", () => {
  const city = document.getElementById("search").value.trim();
  if (city) {
    searchCityAndLoad(city);
  } else {
    alert("Please enter a city name");
  }
});

//air quality index


//const searchInput = document.getElementById("search");
//const searchBtn = document.getElementById("searchBtn");
const airQualityBox = document.querySelector("#airQualityValue");

function getHealthRisk(aqi) {
  if (aqi <= 50) return `${aqi} - Good`;
  if (aqi <= 100) return `${aqi} - Moderate`;
  if (aqi <= 150) return `${aqi} - Unhealthy (Sensitive Groups)`;
  if (aqi <= 200) return `${aqi} - Unhealthy`;
  if (aqi <= 300) return `${aqi} - Very Unhealthy`;
  return `${aqi} - Hazardous`;
}

async function getCoordinates(city) {
  // ✅ handle commas, spaces
  const cleanCity = city.split(",")[0].trim();
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=en&format=json`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.results && data.results.length > 0) {
    return {
      lat: data.results[0].latitude,
      lon: data.results[0].longitude,
      name: data.results[0].name,
      country: data.results[0].country
    };
  } else {
    return null;
  }
}

async function fetchAirQuality(lat, lon) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.hourly && data.hourly.us_aqi) {
    const now = new Date();
    const currentHour = now.getHours();
    const index = data.hourly.time.findIndex(t => new Date(t).getHours() === currentHour);

    const aqi = data.hourly.us_aqi[index];
    airQualityBox.innerText = getHealthRisk(aqi);
  } else {
    airQualityBox.innerText = "No data available";
  }
}

searchBtn.addEventListener("click", async () => {
  const city = searchInput.value.trim();
  if (!city) {
    alert("Please enter a city name");
    return;
  }

  airQualityBox.innerText = "Loading...";

  const coords = await getCoordinates(city);
  if (coords) {
    await fetchAirQuality(coords.lat, coords.lon);
  } else {
    airQualityBox.innerText = "City not found";
  }
});




//see more part


/*const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");*/

const cityTitle = document.getElementById("cityTitle");
const overallAQI = document.getElementById("overallAQI");
const overallRisk = document.getElementById("overallRisk");
const overallBar = document.getElementById("overallBar");

const pm25Value = document.getElementById("pm25Value");
const pm25Bar = document.getElementById("pm25Bar");

const pm10Value = document.getElementById("pm10Value");
const pm10Bar = document.getElementById("pm10Bar");

const o3Value = document.getElementById("o3Value");
const o3Bar = document.getElementById("o3Bar");

const no2Value = document.getElementById("no2Value");
const no2Bar = document.getElementById("no2Bar");

const coValue = document.getElementById("coValue");
const coBar = document.getElementById("coBar");

const so2Value = document.getElementById("so2Value");
const so2Bar = document.getElementById("so2Bar");

// Risk function
function getAQIStatus(value) {
  if (value <= 50) return { text: "Good", color: "text-green-400", bar: "bg-green-400" };
  if (value <= 100) return { text: "Moderate", color: "text-yellow-400", bar: "bg-yellow-400" };
  if (value <= 200) return { text: "Unhealthy", color: "text-orange-400", bar: "bg-orange-400" };
  if (value <= 300) return { text: "Very Unhealthy", color: "text-pink-600", bar: "bg-pink-600" };
  return { text: "Hazardous", color: "text-red-700", bar: "bg-red-700" };
}

// Update pollutant bar function
function updatePollutantBar(value, valueElem, barElem) {
  const status = getAQIStatus(value);
  valueElem.textContent = value;
  barElem.className = `${status.bar} h-2 rounded-full`;
  const widthPercent = Math.min((value / 500) * 100, 100);
  barElem.style.width = `${widthPercent}%`;
}

async function fetchAQI(city) {
  try {
    cityTitle.textContent = "Loading...";
    
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      alert("City not found!");
      cityTitle.textContent = "Air Quality Index";
      return;
    }
    
    const place = geoData.results[0];
    const latitude = place.latitude;
    const longitude = place.longitude;
    cityTitle.textContent = `${place.name}${place.admin1 ? ", " + place.admin1 : ""}${place.country ? ", " + place.country : ""}`;
    
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=pm10,pm2_5,carbon_monoxide,ozone,nitrogen_dioxide,sulphur_dioxide`;
    const aqiRes = await fetch(aqiUrl);
    const aqiData = await aqiRes.json();
    
    if (!aqiData.hourly) {
      alert("No air quality data available!");
      return;
    }
    
    const i = aqiData.hourly.time.length - 1;
    
    const pm25 = aqiData.hourly.pm2_5[i];
    const pm10 = aqiData.hourly.pm10[i];
    const o3 = aqiData.hourly.ozone[i];
    const no2 = aqiData.hourly.nitrogen_dioxide[i];
    const co = aqiData.hourly.carbon_monoxide[i];
    const so2 = aqiData.hourly.sulphur_dioxide[i];
    
    updatePollutantBar(pm25, pm25Value, pm25Bar);
    updatePollutantBar(pm10, pm10Value, pm10Bar);
    updatePollutantBar(o3, o3Value, o3Bar);
    updatePollutantBar(no2, no2Value, no2Bar);
    updatePollutantBar(co, coValue, coBar);
    updatePollutantBar(so2, so2Value, so2Bar);
    
    const status = getAQIStatus(pm25);
    overallAQI.textContent = pm25;
    overallRisk.textContent = status.text;
    overallAQI.className = `text-4xl font-bold ${status.color}`;
    overallBar.className = `${status.bar} h-2 rounded-full`;
    overallBar.style.width = `${Math.min((pm25 / 500) * 100, 100)}%`;
    
  } catch (err) {
    console.error(err);
    alert("Error fetching AQI");
  }
}

// Search button event
searchBtn.addEventListener("click", () => {
  let cityInput = searchInput.value;
  if (cityInput) {
    const cityName = cityInput.split(",")[0].trim();
    fetchAQI(cityName);
  }
});

//toggle btn dark mode

// Select elements
const toggleBtn = document.querySelectorAll('.toggleBtn');

const body = document.querySelector('body');

const headings = document.querySelectorAll('.t1, .t2, h1, p');
const buttons = document.querySelectorAll('button');
const inputs = document.querySelectorAll('input, textarea');

const icons = document.querySelectorAll('i, lord-icon');

const cityManagement = document.getElementById("cityManagement");

const binBtns = document.querySelector(".deleteBtn");

const deleteBtns = document.querySelector(".binBtn lord-icon");

const todays = document.getElementById("today");

const airQualityIndexId = document.getElementById("airQualityIndexId");

// State for dark mode
let isDarkMode = false;

// Function to enable dark mode
function enableDarkMode() {
    // Body background change
    body.classList.remove('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigo-900');
    body.classList.add('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');

    // Headings text color
    

    // Buttons styling
    buttons.forEach(btn => {
        btn.classList.remove('bg-yellow-300', 'text-[#6a2ae6]');
        btn.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-500', 'text-white');
    });

    // Input fields
    inputs.forEach(input => {
        input.classList.remove('text-gray-900', 'bg-white');
        input.classList.add('bg-gray-800', 'text-white');
    });

    // Icons color adjust (optional)
    icons.forEach(icon => {
        icon.setAttribute('colors', 'primary:#ffffff,secondary:#a259ff');
    });
    
    screen3.classList.remove('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    screen3.classList.add('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    cityManagement.classList.remove('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    cityManagement.classList.add('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    binBtns.classList.remove('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    binBtns.classList.add('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    deleteBtns.setAttribute('colors', 'primary:#000000,secondary:#e4e4e4,tertiary:#000000,quaternary:#000000');
    
    screenFour.classList.remove('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    screenFour.classList.add('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    todays.classList.remove('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    todays.classList.add('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    airQualityIndexId.classList.remove('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    airQualityIndexId.classList.add('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    screenFive.classList.remove('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    screenFive.classList.add('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    screenSix.classList.remove('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    screenSix.classList.add('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    isDarkMode = true;
}

// Function to disable dark mode
function disableDarkMode() {
    // Body background change
    body.classList.remove('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    body.classList.add('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigo-900');

    // Headings text color reset
    

    // Buttons reset
    buttons.forEach(btn => {
        btn.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-purple-500', 'text-white');
        btn.classList.add('bg-yellow-300', 'text-[#6a2ae6]');
    });

    // Inputs reset
    inputs.forEach(input => {
        input.classList.remove('bg-gray-800', 'text-white');
        input.classList.add('text-gray-900', 'bg-white');
    });
    
    screen3.classList.add('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    screen3.classList.remove('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    cityManagement.classList.add('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    cityManagement.classList.remove('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    binBtns.classList.add('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    binBtns.classList.remove('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    screenFour.classList.add('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    screenFour.classList.remove('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    todays.classList.add('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    todays.classList.remove('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    airQualityIndexId.classList.add('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    airQualityIndexId.classList.remove('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    screenFive.classList.add('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    screenFive.classList.remove('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');
    
    screenSix.classList.add('bg-gradient-to-br', 'from-indigo-700', 'via-purple-700', 'to-indigosceen-900');
    screenSix.classList.remove('bg-gradient-to-br', 'from-gray-900', 'via-gray-800', 'to-black');

    isDarkMode = false;
}

// Toggle event listener
toggleBtn.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isDarkMode) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });
});