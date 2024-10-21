# Vehicle Data Transformation Service

## Objective

The objective of this repository is to provide a robust backend service for parsing XML data from external APIs, transforming it into JSON format, and exposing it via a GraphQL endpoint. The service ensures high performance, maintainability, and scalability.

## Technologies Used

- **Languages**: TypeScript, Node.js
- **Package Management**: npm
- **Framework**: NestJS
- **GraphQL**: Apollo Server
- **Database**: MongoDB
- **Queue**: Bull (Redis for storing jobs)
- **Testing**: Jest (for unit tests)
- **Containerization**: Docker


## Design Patterns

**Circuit Breaker**: The Circuit Breaker pattern is implemented to enhance the resilience of the system when interacting with external APIs. This pattern helps to prevent the system from making requests to an external API when it is known to be unresponsive or experiencing issues.

**Retry Mechanism**: The retry mechanism is implemented for multiple data fetch attempts with a delay between attempts, ensuring that transient errors do not cause the operation to fail immediately. This mechanism works in conjunction with the Circuit Breaker pattern to provide robust error handling and resiliency.

## Project Setup

1. **Clone the repository**:
    ```sh
    git clone https://github.com/gonexe/xml-to-json
    cd vehicle-data-transformation-service
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the required environment variables (see the Environment Variables section).

4. **Run the application**:
    ```sh
    docker-compose up --build
    ```

## Running Tests

To run the tests inside the Docker container, use the following command:

```sh
docker-compose exec app npm test
```

## Environment Variables

```sh
PORT= Port number for the application
MONGODB_URI= MongoDB connection URI
MAKES_URI=https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes
VEHICLE_TYPES_URI=https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId
REDIS_HOST= Redis host
REDIS_PORT= Redis port
```

## Routes

- **`Vehicle`**:
    - **`POST /vehicle/fetch-and-transform`**: Fetch and transform vehicle data from XML to JSON.
    - **`GET /vehicle/status/:id`**: Get the status of a specific vehicle transformation.
- **`GraphQL`**:
    - **`/graphql`**: Exposes a GraphQL endpoint for querying vehicle data stored in the database.
- **`Bull Board`**:
    - **`/admin/queues`**: Bull Board dashboard for monitoring and managing queues.

## Controllers

- **`VehicleController.ts`**:
  - Handles vehicle data fetching and transformation operations.
  - Check the status of a vehicle transformation job.

## Queue Implementation
- **`VehicleProcessor.ts`**: Handles the job processing.
- **`VehicleService.ts`**: Enqueues jobs and checks for active jobs.

## Services

- **`VehicleService.ts`**:
    - Handles the logic for fetching, transforming, and saving vehicle data.

## Utils

- **`fetch-data.ts`**: Fetches data from external APIs.
- **`transform-data.ts`**: Transforms XML data to JSON format.

## Prevention of Running More Than Once
- **Check Active Jobs**: Before enqueuing a new job, check if there are any active jobs.


## WebSocket Subscriptions
- **`VehicleGateway.ts`**: Emits success or error messages based on job status.

## GraphQL Endpoint
- **`/graphql`**: Exposes a GraphQL endpoint for querying vehicle data stored in the database.

## Test Files

- **`src/modules/vehicle/vehicle.service.spec.ts`**: Unit tests for the **VehicleService**.
- **`src/modules/vehicle/vehicle.controller.spec.ts`**: Unit tests for the **VehicleController**.
- **`src/utils/fetch-data.spec.ts`**: Unit tests for the **FetchData** utility.
- **`src/utils/transform-data.spec.ts`**: Unit tests for the **TransformData** utility.

## Dockerfile and Docker Compose Explanation

- **`Dockerfile`**: Build and run the backend application.
- **`docker-compose.yml`**: Defines the Docker services for the application.
    - **`app`**: The main application service.
    - **`mongo`**: MongoDB service.
    - **`redis`**: Redis service.

## Linter and Prettier

- **ESLint**: Linting tool for identifying and fixing problems in the code.
- **Prettier**: Code formatter for maintaining consistent code style.

## Author

This project was created by Gonzalo Avila.

## Disclaimer

This code should not be modified without the explicit approval of the author.