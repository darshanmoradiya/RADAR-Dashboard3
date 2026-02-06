# Authentication Setup Guide

## Overview
Your RADAR Dashboard now has a complete authentication system using MongoDB and JWT tokens.

## What's Been Added

### Backend Components
1. **User Model** (`backend/models/User.js`)
   - Stores user credentials securely
   - Password hashing with bcrypt
   - User roles (admin/user)

2. **Authentication Routes** (`backend/routes/auth.js`)
   - `/api/auth/register` - Register new users
   - `/api/auth/login` - User login
   - `/api/auth/verify` - Token verification

3. **Database Connection** (`backend/config/database.js`)
   - Automatic MongoDB connection
   - Connection management

### Frontend Components
1. **Login Page** (`src/pages/LoginPage.tsx`)
   - Beautiful login/register interface
   - Form validation
   - Error handling

2. **Protected Routes** (Updated `src/App.tsx`)
   - Automatic redirect to login for unauthenticated users
   - Token-based authentication
   - Secure route protection

## Setup Instructions

### 1. Install MongoDB

**Windows:**
```bash
# Download from: https://www.mongodb.com/try/download/community
# Or install with Chocolatey:
choco install mongodb
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
```

### 2. Start MongoDB

```bash
# Windows (run as service, or manually):
mongod

# macOS/Linux:
brew services start mongodb-community
# or
sudo service mongod start
```

### 3. Update Environment Variables

The backend `.env` file already has MongoDB configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/radar-dashboard

# JWT Configuration  
JWT_SECRET=your-secret-key-change-this-in-production-to-something-secure
```

**Important:** Change the `JWT_SECRET` to a secure random string in production!

### 4. Start the Application

```bash
# Start both backend and frontend
npm run dev
```

## Usage

### First Time Setup

1. Navigate to http://localhost:5173
2. You'll be redirected to the login page
3. Click "Register" to create an account:
   - Username: your_username
   - Email: your_email@example.com
   - Password: minimum 6 characters

4. After registration, you'll be automatically logged in and redirected to the dashboard

### Login

1. Go to http://localhost:5173/login
2. Enter your username and password
3. Click "Login"

### Logout

Click the logout button in the sidebar to log out and return to the login page.

## API Endpoints

### Register User
```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login User
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Verify Token
```bash
GET http://localhost:3001/api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Features

✅ **Password Hashing**: Bcrypt with salt rounds
✅ **JWT Tokens**: Secure token-based authentication
✅ **Protected Routes**: Frontend route protection
✅ **Token Expiration**: 7-day token validity
✅ **Secure Headers**: CORS and security middleware

## Troubleshooting

### MongoDB Connection Issues

**Error:** "MongoDB connection error: connect ECONNREFUSED"

**Solution:**
1. Make sure MongoDB is running: `mongod --version`
2. Check if MongoDB service is started
3. Verify the connection string in `.env`

### Authentication Errors

**Error:** "Invalid token"

**Solution:**
1. Clear localStorage: Open browser console and run:
   ```javascript
   localStorage.clear()
   ```
2. Log in again

### Port Already in Use

**Error:** "Port 27017 is already in use"

**Solution:**
MongoDB is already running. That's fine! Just proceed with your app.

## Default MongoDB Connection

The default connection is:
- **Host:** localhost
- **Port:** 27017
- **Database:** radar-dashboard

To use a different MongoDB instance, update `MONGODB_URI` in `backend/.env`:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/radar-dashboard

# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/radar-dashboard

# Docker MongoDB
MONGODB_URI=mongodb://mongo:27017/radar-dashboard
```

## Next Steps

- Set up role-based access control (RBAC)
- Add password reset functionality
- Implement email verification
- Add session management
- Enable two-factor authentication

## Need Help?

Check the logs:
- Backend logs show in the terminal running `npm run dev`
- Frontend errors appear in browser console (F12)
- MongoDB logs: Check the MongoDB service logs in your system
