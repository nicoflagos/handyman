# On-Demand Service Application

## Overview
The On-Demand Service Application is a web application designed to provide various on-demand services to users. It allows users to authenticate, manage their profiles, and place orders for services.

## Features
- User authentication (login and registration)
- User profile management
- Order creation and management
- Middleware for authentication
- Logging utility for application events

## Project Structure
```
on-demand-service-app
├── src
│   ├── app.ts
│   ├── controllers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   └── orders.controller.ts
│   ├── services
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── order.service.ts
│   ├── models
│   │   ├── user.model.ts
│   │   └── order.model.ts
│   ├── routes
│   │   └── index.ts
│   ├── middlewares
│   │   └── auth.middleware.ts
│   ├── utils
│   │   └── logger.ts
│   └── config
│       └── index.ts
├── scripts
│   └── migrate.ts
├── test
│   └── app.test.ts
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── Dockerfile
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd on-demand-service-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Create a `.env` file based on the `.env.example` file and configure your environment variables.
2. Start the application:
   ```
   npm start
   ```

## Testing
To run the tests, use the following command:
```
npm test
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.