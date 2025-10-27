# myAPI

A Node.js/Express REST API for site management with MySQL database integration.

## Description

This API provides user management functionality with authentication and database operations using Sequelize ORM and MySQL.

## Technologies Used

-   **Node.js** - Runtime environment
-   **Express** - Web framework
-   **MySQL2** - Database
-   **Sequelize** - ORM for database operations
-   **bcrypt** - Password hashing
-   **dotenv** - Environment variable management
-   **nodemon** - Development auto-reload

## Installation

1. Clone the repository:

```bash
git clone https://github.com/EHenryRichard/apiforSiteManagent.git
cd myApi
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your database configuration:

```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306
```

4. Set up your MySQL database and run any necessary migrations.

## Usage

### Development Mode

```bash
npm start
```

The server will start with nodemon for auto-reloading during development.

### Production Mode

```bash
node server.js
```

## Project Structure

```
myApi/
├── config/
│   └── database.js       # Database configuration
├── controllers/
│   └── userController.js # User-related request handlers
├── models/
│   ├── index.js          # Model initialization
│   ├── user.js           # User model
│   └── validation.js     # Data validation
├── services/
│   └── userService.js    # Business logic for users
├── utils/                # Utility functions
├── server.js             # Server entry point
└── package.json
```

## API Endpoints

### Users

-   `GET /api/users` - Get all users
-   `GET /api/users/:id` - Get user by ID
-   `POST /api/users` - Create new user
-   `PUT /api/users/:id` - Update user
-   `DELETE /api/users/:id` - Delete user

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Author

[Your Name]

## Repository

[GitHub Repository](https://github.com/EHenryRichard/apiforSiteManagent)

## Issues

Report issues at: [GitHub Issues](https://github.com/EHenryRichard/apiforSiteManagent/issues)

## Folders uses and usage pattern

the app.js sets the app and sets a path then validate the route from the route where the express router is defined and used with the request type, which takes two parameters which is the final api endpoint and the action which is stored in the controllers file.

The controller file contains imports the service and other utils if needed for that action,
the service contains the actions like saveuser , post details and all of that etc.

The service file contains imports fom the model folder which is where the database configurations are stored. since i am using Sequelize the Sequelize models and automatic config and all.

this is all for now i will Update as i advance in the project
