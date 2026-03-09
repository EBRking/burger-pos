# Burger POS - Installation Guide

This document provides instructions on how to install and run the Burger POS system on your local machine.

## 1. Prerequisites

Before you begin, ensure you have the following software installed on your system:

- **Node.js**: Version 16.x or higher. You can download it from [https://nodejs.org/](https://nodejs.org/).
- **MongoDB**: Version 5.x or higher. MongoDB is used as the database for this project. You can download the Community Server from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).

## 2. Installation Steps

Follow these steps to get the project running:

### Step 2.1: Clone or Download the Project

First, get the project source code onto your machine. If you are using Git, you can clone the repository. Otherwise, download the source code as a ZIP file and extract it.

### Step 2.2: Install Dependencies

Navigate to the project's root directory in your terminal and run the following command to install all the required Node.js packages:

```bash
npm install
```

This command reads the `package.json` file and downloads all the necessary libraries into the `node_modules` directory. The project includes the following key dependencies:

- **Express.js**: Web server framework
- **Mongoose**: MongoDB object modeling
- **bcryptjs**: Password hashing for security
- **express-session**: Session management for login/logout
- **Multer**: File upload handling for product images
- **Axios**: HTTP client for frontend-backend API communication
- **EJS**: Template engine for rendering HTML views

## 3. Database Setup

### Step 3.1: Start MongoDB

Ensure your MongoDB server is running. If you installed it as a service, it should start automatically with your system. If not, you may need to start it manually. Please refer to the MongoDB documentation for your specific operating system.

The application will try to connect to a MongoDB instance at `mongodb://localhost:27017/burger_pos` by default.

### Step 3.2: Seed Initial Data

To populate the database with initial data (such as an admin account, sample products, and members), run the following command from the project's root directory:

```bash
node seed.js
```

This script will:
- Create a default **owner** account.
- Create a default **employee** account.
- Add sample products (burgers, drinks, sides).
- Add a few sample members and promotions.

You only need to run this command once during the initial setup.

## 4. Running the Application

Once the installation and database setup are complete, you can start the application with the following command:

```bash
npm start
```

This will start the web server. You should see a confirmation message in your terminal:

```
🍔 Burger POS running at http://localhost:8080
✅ MongoDB connected
```

You can now access the application by opening your web browser and navigating to **http://localhost:8080**.

## 5. Default Login Accounts

After seeding the database, you can use the following accounts to log in:

| Role         | Username | Password   |
|--------------|----------|------------|
| **Owner**    | `admin`  | `admin123` |
| **Employee** | `emp01`  | `emp123`   |

The **Owner** account has access to all features, including employee management and reporting. The **Employee** account has access to the POS and member management features.

## 6. Technology Stack

### Backend
- **Node.js + Express.js**: Server and routing
- **Mongoose**: MongoDB object modeling and validation
- **bcryptjs**: Secure password hashing
- **express-session**: Session-based authentication
- **Multer**: File upload middleware for product images

### Frontend
- **EJS**: Template engine for server-side rendering
- **Axios**: HTTP client for making API requests from the browser
- **CSS3**: Custom styling with warm Burger Shop theme
- **Chart.js**: Data visualization for reports and dashboard

### Database
- **MongoDB**: NoSQL database for storing all application data

## 7. API Endpoints

The application provides several API endpoints for frontend-backend communication using Axios:

### Members API
- `GET /api/members/search?phone=<phone>` - Search member by phone
- `GET /api/members/all` - Get all members

### Products API
- `GET /api/products/all` - Get all active products
- `GET /api/products/category/:category` - Get products by category

### Promotions API
- `GET /api/promotions/all` - Get all promotions
- `GET /api/promotions/active` - Get active promotions

### Sales API
- `GET /api/sales/history` - Get sales history with pagination
- `GET /api/sales/receipt/:id` - Get specific receipt
- `POST /api/sales/create` - Create new sale

### Dashboard API
- `GET /api/dashboard/stats` - Get dashboard statistics

## 8. Project Structure

```
burger-pos/
├── app.js                 # Main entry point
├── seed.js               # Database seeder
├── package.json          # Dependencies
├── models/               # Mongoose schemas
│   ├── User.js
│   ├── Member.js
│   ├── Product.js
│   ├── Sale.js
│   └── Promotion.js
├── routes/               # Express routes
│   ├── api.js           # API endpoints (Axios)
│   ├── auth.js          # Authentication
│   ├── sales.js         # POS and sales
│   ├── products.js      # Product management
│   ├── members.js       # Member management
│   ├── employees.js     # Employee management
│   ├── promotions.js    # Promotion management
│   ├── reports.js       # Reports
│   └── dashboard.js     # Dashboard
├── views/               # EJS templates
│   ├── partials/        # Reusable components
│   ├── auth/            # Login page
│   ├── sales/           # POS and receipt
│   ├── products/        # Product management
│   ├── members/         # Member management
│   ├── employees/       # Employee management
│   ├── promotions/      # Promotions
│   └── reports/         # Reports
├── public/              # Static files
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   │   └── api.js       # Axios API utility
│   └── uploads/         # Product images and profiles
└── middleware/          # Custom middleware
    ├── auth.js          # Authentication middleware
    └── upload.js        # Multer configuration
```

## 9. Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running on your machine
- Check that the connection string in `app.js` matches your MongoDB setup
- Default: `mongodb://localhost:27017/burger_pos`

### Port Already in Use
- The application runs on port 8080 by default
- If port 8080 is already in use, modify the PORT in `app.js` (line 53) or set environment variable: `PORT=3000 npm start`

### Dependencies Installation Failed
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

### Multer Upload Issues
- Ensure `public/uploads/products` and `public/uploads/profiles` directories exist
- Check file permissions on these directories
- Maximum file size is set to 5MB by default in `middleware/upload.js`

---

For more information or support, please refer to the project documentation or contact the development team.
