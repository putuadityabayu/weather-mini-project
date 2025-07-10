![Unit Testing](https://github.com/putuadityabayu/weather-mini-project/actions/workflows/unit-tests.yml/badge.svg) ![Docker Build Test](https://github.com/putuadityabayu/weather-mini-project/actions/workflows/docker-build-tests.yml/badge.svg)

# Weather App Backend (Microservices)

This project implements a microservices-based backend system for a weather application, focusing on fetching, storing, and caching weather data, integrating message queues, and exposing REST APIs.

---

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
- [Development Setup](#development-setup)
- [How to Get an OpenWeather API Key](#how-to-get-an-openweather-api-key)

---

## Features

- REST API for weather data by location (`/weather?location=...`).
- Caching with Redis for fast responses and reduced external API calls.
- Data persistence in MongoDB.
- Microservices architecture with an API Service and an Email Notification Worker
- Asynchronous email notification simulation via RabbitMQ for refresh events.
- Built with TypeScript for type safety.
- Dockerized for easy deployment and local development.
- Adheres to Service-Repository design patterns and modular code structure.

![Flowchart](/docs/flowchart.png)

---

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

![Architecture Diagram](/docs/architecture-diagram.png)

---

## Technologies Used

* **Backend**: Node.js, Express.js, TypeScript
* **Database**: MongoDB
* **Caching**: Redis
* **Message Broker**: RabbitMQ
* **Containerization**: Docker, Docker Compose
* **Testing**: Jest

---

## Setup and Installation

### Prerequisites

* Docker Desktop installed and running.
* Node.js (only for development. see [Development](#prerequisites-1)).

### Environment Variables

Create a `.env` file in the project root based on [`.env.example`](/.env.example)

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

---

## API Endpoints

### Get Weather Data

**GET** `/weather?location=<city_name>`

**Example Response (Success):**

```jsonc
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
    "error": "Weather data for the specified location not found."
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

---

## Testing
Unit tests are implemented using Jest.

### Running Tests

To run unit tests for All Service:
```bash
npm test
```

---

## Development Setup

### Prerequisites

* Docker Desktop installed and running.
* Node.js (for local development/testing outside Docker).

### Install Monorepo Dependencies

```bash
# from root directory
npm install
```

This will install all necessary `dependencies` and `devDependencies` for both `api-services` and `email-worker`, as well as any root dependencies.

### Run Backend Services with Docker Compose

This project relies on several backend services (MongoDB, Redis, RabbitMQ) that can be easily run using Docker Compose.

From the project root (weather-app-monorepo/), execute the following command:

```bash
docker compose up -d
```

- This command will build (if not already) and run all backend service containers in the background.
- Ensure all rabbitmq, redis, and mongo services are in a healthy state before proceeding. You can check their status with:
    ```bash
    docker compose ps
    ```

### Environment Variables

Each application service (`api-services` and `email-worker`) requires environment variables to connect to backend services and external APIs. You'll need to create a `.env` file in each service's respective directory.

1.  **For `api-services`**

    Copy a `.env` from [`api-services/.env.example`](/api-services/.env.example)

    ```bash
    # from root
    cd api-services

    cp .env.example .env
    ```

2.  **For `email-worker`**

    Copy a `.env` from [`email-worker/.env.example`](/email-worker/.env.example)

    ```bash
    # from root
    cd email-worker

    cp .env.example .env
    ```

### Running Application Services

Once the backend services are running and your .env files are configured, you can start each application service:

1. **Running `api-services`**

    ```bash
    # from root
    cd api-services

    npm run dev
    ```

2. **Running `email-worker`**

    ```bash
    # from root
    cd email-worker

    npm run dev
    ```

### Shutting Down the Development Environment

To stop and remove all Docker Compose containers:

```bash
docker compose down
```

This command will stop and remove the containers, networks, and volumes.

---

## How to Get an OpenWeather API Key

Your application needs an API Key from OpenWeather to fetch weather data. The process is straightforward:

1.  **Visit the OpenWeather Website**: Open your web browser and go to the official OpenWeather website at [https://openweathermap.org/](https://openweathermap.openweathermap.org/).

2.  **Sign Up or Log In & Navigate to API Keys**:
    * If you don't have an account, click the "**Sign In**" or "**Sign Up**" button in the top right corner. Choose the "Sign Up" option to create a new account using your email address or a social account.
    * If you already have an account, simply log in ("Sign In").
    * Once logged in, click on your **username** (or avatar) in the top right corner of the page. From the dropdown menu, select "**My API Keys**".

3.  **Copy Your API Key**:
    * On the "[My API Keys](https://home.openweathermap.org/api_keys)" page, you'll see a list of your API Keys. **A default API key is usually already generated for you upon registration.** You can simply **copy** this alphanumeric string directly from the list.
    * If you need an additional key, enter a name for it in the "Enter name of the key" field and click "**Generate**". The new key will appear, and you can copy it.

4.  **Use it in Your Project**: Paste the copied API Key into the `.env` file within your `api-services/` directory, as explained in your development setup documentation:

    ```properties
    API_SERVICE_OPENWEATHER_API_KEY=PASTE_YOUR_GENERATED_API_KEY_HERE
    ```

**Important Notes:**
* **Activation Time**: After creating or finding your API Key, it might take **a few minutes to a couple of hours** for the key to become fully active and usable for making requests to the OpenWeather API. If you immediately get a `401 Unauthorized` error or similar, try waiting a bit and then trying again.
* **Security**: Keep your API Key confidential. Never commit it directly to a public repository. Always use environment variables or GitHub Secrets to store it.