import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken(true); // Force token refresh
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return config;
  }
}, (error) => {
  return Promise.reject(error);
});

// API endpoints
export const authAPI = {
  register: (data: { name: string; email: string }) => 
    api.post('/auth/register', data),
  getProfile: () => 
    api.get('/auth/profile'),
};

export const computersAPI = {
  getAllComputers: () => api.get('/computers'),
  getComputersWithBookings: () => api.get('/computers/with-bookings'),
  createComputer: (data: { name: string; location: string; specifications: string; status: string }) => api.post('/computers', data),
  deleteComputer: (computerId: string) => api.delete(`/computers/${computerId}`),
};

export const bookingsAPI = {
  getUserBookings: () => 
    api.get('/bookings'),
  createBooking: (data: { computerId: string; date: string; startTime: string; endTime: string; reason: string }) => 
    api.post('/bookings', data),
  cancelBooking: (bookingId: string) => 
    api.delete(`/bookings/${bookingId}`),
  // Admin endpoints
  getAllBookings: () => 
    api.get('/bookings'),
  updateBookingStatus: (bookingId: string, status: string) => 
    api.put(`/bookings/${bookingId}/status`, { status }),
};

export const notificationsAPI = {
  getNotifications: () => 
    api.get('/notifications'),
  markAsRead: (notificationId: string) => 
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => 
    api.put('/notifications/read-all'),
  createNotification: (data: { userId?: string; title: string; message: string; type?: string; targetUsers?: string[] }) => 
    api.post('/notifications', data),
  getUsers: () => 
    api.get('/notifications/users'),
};

export default api; 