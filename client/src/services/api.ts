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
  createComputer: (data: { name: string; config?: any; description?: string }) => api.post('/computers', data),
  deleteComputer: (computerId: string) => api.delete(`/computers/${computerId}`),
};

export const bookingsAPI = {
  getUserBookings: () => 
    api.get('/bookings/my'),
  createBooking: (data: { computerId: string; reason: string; startTime: string; endTime: string }) => 
    api.post('/bookings', data),
  // Admin endpoints
  getAllBookings: () => 
    api.get('/bookings'),
  updateBookingStatus: (bookingId: string, status: string) => 
    api.put(`/bookings/${bookingId}`, { status }),
};

export default api; 