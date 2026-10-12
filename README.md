# SkyPulse — Weather Dashboard

A responsive web application that displays real-time weather information for multiple Indian cities using the Open-Meteo API.

## Features

- City selection through a dropdown menu.
- Live temperature and weather conditions.
- Relative humidity and wind speed.
- Apparent temperature and wind direction.
- Weather icons based on WMO weather codes.
- Loading indicators and API error handling.
- Retry and manual refresh functionality.
- Responsive layout for desktop and mobile devices.
- No API key or backend required for this non-commercial demo.

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Fetch API and async/await
- Open-Meteo Weather Forecast API

## API Used

Weather endpoint:
https://api.open-meteo.com/v1/forecast

The application requests current weather variables using latitude and longitude for the selected city.

Documentation:
https://open-meteo.com/en/docs

## Project Structure

weather-dashboard/
├── index.html
├── style.css
├── script.js
└── README.md

## Setup Instructions

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Install the Live Server extension.
4. Right-click index.html.
5. Select "Open with Live Server".
6. Select a city to view its current weather.

An active internet connection is required to fetch live weather data.

## Error Handling

The application handles failed API responses, connection errors, request timeouts and incomplete weather data. Users can retry a failed request.

## Data Attribution

Weather data provided by Open-Meteo:
https://open-meteo.com/

Location coordinates are configured for the listed cities.

## Author

Nakul Agnihotri

BTech CSE (AI & ML)
Acropolis Institute of Technology & Research, Indore