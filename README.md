# Negces Lab Tracking System

A full-stack MERN application for managing lab slot bookings and reservations.

## 🚀 Features

- User Authentication with Firebase
- Role-Based Access Control (User & Admin)
- Lab Slot Booking System
- Real-time Booking Status Updates
- Admin Dashboard for Booking Management

## 🔧 Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: Firebase Auth

## 📁 Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/           # Static files
│
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   └── utils/           # Utility functions
│
└── NOTES.local          # Local environment variables (gitignored)
```

## 🚦 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```
3. Set up environment variables in NOTES.local
4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd ../client
   npm start
   ```

## 🔐 Authentication

The application uses Firebase Authentication for user management. Role-based access control is implemented with two roles:
- **User**: Can book/reserve slots and manage their bookings
- **Admin**: Can approve/reject bookings and manage all users

## 📝 API Endpoints

### Public Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Protected User Routes
- `GET /api/bookings/user` - Get user's bookings
- `POST /api/bookings/user` - Create new booking
- `DELETE /api/bookings/user/:id` - Cancel booking

### Protected Admin Routes
- `GET /api/bookings/admin` - Get all bookings
- `PUT /api/bookings/admin/:id` - Update booking status
- `POST /api/slots/admin` - Create new slot
- `PUT /api/slots/admin/:id` - Update slot
- `DELETE /api/slots/admin/:id` - Delete slot

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
