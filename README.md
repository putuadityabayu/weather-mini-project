# Weather App Backend (Microservices)

This project implements a microservices-based backend system for a weather application, focusing on fetching, storing, and caching weather data, integrating message queues, and exposing REST APIs.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running with Docker Compose](#running-with-docker-compose)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)

## Features

- REST API for weather data by location (`/weather?location=...`).
- Caching with Redis for fast responses and reduced external API calls.
- Data persistence in MongoDB.
- Microservices architecture with an API Service and an Email Notification Worker
- Asynchronous email notification simulation via RabbitMQ for refresh events.
- Built with TypeScript for type safety.
- Dockerized for easy deployment and local development.
- Adheres to Service-Repository design patterns and modular code structure.

## Architecture

The system is composed of the following microservices and data stores:

1.  **API Service**:
    * Handles all incoming HTTP requests.
    * Fetches data from OpenWeatherMap (external API).
    * Interacts with Redis for caching and MongoDB for persistent storage.
    * Publishes messages to RabbitMQ on refresh requests.
2.  **Email Notification Worker**:
    * Consumes messages from RabbitMQ.
    * Simulates sending email notifications based on refresh events.
3.  **MongoDB**: NoSQL database for storing weather data.
4.  **Redis**: In-memory data store used for caching API responses.
5.  **RabbitMQ**: Message broker for asynchronous communication between services.

## Technologies Used

* **Backend**: Node.js, Express.js, TypeScript
* **Database**: MongoDB
* **Caching**: Redis
* **Message Broker**: RabbitMQ
* **Containerization**: Docker, Docker Compose
* **Testing**: Jest

## Setup and Installation

### Prerequisites

* Docker Desktop installed and running.
* Node.js (for local development/testing outside Docker, though Docker is preferred).

### Environment Variables

Create a `.env` file in the project root based on `.env.example`

### Running with Docker Compose

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/putuadityabayu/weather-mini-project.git
    cd weather-mini-project
    ```

2.  **Create your `.env` file:**

    ```bash
    cp .env.example .env
    ```

3.  **Build and run all services:**

    ```bash
    docker-compose up -d --build
    ```
    
    This command will:
    * Build Docker images for `api-service` and `email-worker`.
    * Pull images for `mongodb`, `redis`, and `rabbitmq`.
    * Start all services.

### Accessing Services

* **API Service**: `http://localhost:3000`
* **Redis Insight (Optional)**: `http://localhost:8081` (if you run a Redis Insight service in `docker-compose-dev`)
* **RabbitMQ Management UI**: `http://localhost:15672` (default credentials: `guest`/`guest` and only in `docker-compose-dev`)

## API Endpoints

### Get Weather Data

**GET** `/weather?location=<city_name>`

**Example Response (Success):**

```json
{
    "success": true,
    "data": {
        "location": "Malang",
        "temperature": 20.2,
        "description": "broken clouds",
        "humidity": 80,
        "windSpeed": 4.1,
        "source": "cache" // or "external"
    }
}
```

**Example Response (Error - Location not found):**

```json
{
    "success": false,
    "error": "Location not found"
}
```

### Trigger Refresh (Implicitly via `GET /weather`)

The weather data can be explicitly refreshed by sending a GET request to the `/weather` endpoint with a `refresh=true` query parameter.

**GET** `/weather?location=<city_name>&refresh=true`

**Functionality:**

1.  **Cache Invalidation:** Upon receiving a refresh request for a specific location, the `api-service` will first invalidate (delete) the existing cached data for that location in **Redis**.
2.  **New Data Fetch:** It then immediately fetches the latest weather data from the external **OpenWeatherMap API**.
3.  **Data Persistence & Caching:** The newly fetched data is saved to **MongoDB** and also updated/stored in **Redis Cache** for future quick access.
4.  **RabbitMQ Event Publishing:** Simultaneously, the `api-service` publishes a message to a **RabbitMQ** queue (`weather_refresh_events`) containing the refreshed location information.
5.  **Email Notification Worker:** The `email-worker`, which continuously listens to this RabbitMQ queue, consumes the message. It then simulates sending an email notification indicating that the weather data for the specified location has been refreshed. This process runs asynchronously in the background.

This mechanism ensures users can request the most current data, while also triggering background notifications without blocking the primary API response.

## Testing
Unit tests are implemented using Jest.

### Running Tests

To run unit tests for All Service:
```bash
npm test
```