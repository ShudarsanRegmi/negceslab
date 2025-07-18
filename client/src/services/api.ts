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

export const bookingsAPI = {
  getUserBookings: () => 
    api.get('/bookings/user'),
  createBooking: (data: { slotId: string; purpose: string }) => 
    api.post('/bookings/user', data),
  cancelBooking: (bookingId: string) => 
    api.delete(`/bookings/user/${bookingId}`),
  // Admin endpoints
  getAllBookings: () => 
    api.get('/bookings/admin'),
  updateBookingStatus: (bookingId: string, status: string) => 
    api.put(`/bookings/admin/${bookingId}`, { status }),
};

export const slotsAPI = {
  getAvailableSlots: () => 
    api.get('/slots'),
  // Admin endpoints
  createSlot: (data: {
    startTime: Date;
    endTime: Date;
    capacity: number;
    lab: string;
    description: string;
  }) => api.post('/slots/admin', data),
  updateSlot: (slotId: string, data: Partial<{
    startTime: Date;
    endTime: Date;
    capacity: number;
    isAvailable: boolean;
    lab: string;
    description: string;
  }>) => api.put(`/slots/admin/${slotId}`, data),
  deleteSlot: (slotId: string) => 
    api.delete(`/slots/admin/${slotId}`),
};

export default api; 