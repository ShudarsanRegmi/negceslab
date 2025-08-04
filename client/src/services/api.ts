import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = 'https://backend.negceslab.online/api';

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
  createBooking: (data: { 
    computerId: string; 
    startDate: string; 
    endDate: string;
    startTime: string; 
    endTime: string; 
    reason: string;
    requiresGPU?: boolean;
    gpuMemoryRequired?: number;
    problemStatement?: string;
    datasetType?: string;
    datasetSize?: {
      value: number;
      unit: string;
    };
    datasetLink?: string;
    bottleneckExplanation?: string;
  }) => 
    api.post('/bookings', data),
  cancelBooking: (bookingId: string) => 
    api.delete(`/bookings/${bookingId}`),
  // Admin endpoints
  getAllBookings: () => 
    api.get('/bookings'),
  getCurrentBookings: () =>
    api.get('/bookings/current'),
  updateBookingTime: (bookingId: string, data: {
    startTime?: string;
    endTime?: string;
    startDate?: string;
    endDate?: string;
    computerId?: string;
  }) => api.put(`/bookings/${bookingId}/time`, data),
  updateBookingStatus: (bookingId: string, status: string, rejectionReason?: string) => 
    api.put(`/bookings/${bookingId}/status`, { status, rejectionReason }),
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

// Add feedback API endpoints
export const feedbackAPI = {
  submitFeedback: (data: {
    fullName: string;
    email: string;
    subject: string;
    message: string;
  }) => api.post('/feedback', data),
  getAllFeedback: () => api.get('/feedback'),
  updateFeedbackStatus: (feedbackId: string, data: {
    status: 'pending' | 'resolved' | 'in_progress';
    adminResponse?: string;
  }) => api.put(`/feedback/${feedbackId}/status`, data),
};

// System Details API endpoints
export const systemDetailsAPI = {
  getAllSystemDetails: () => api.get('/system-details'),
  getSystemDetails: (computerId: string) => api.get(`/system-details/${computerId}`),
  getSoftwarePool: () => api.get('/system-details/software-pool'),
  updateSystemDetails: (computerId: string, data: {
    operatingSystem?: string;
    osVersion?: string;
    architecture?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    gpu?: string;
    installedSoftware?: Array<{
      name: string;
      version?: string;
      category?: string;
      icon?: string;
    }>;
    additionalNotes?: string;
  }) => api.put(`/system-details/${computerId}`, data),
  addSoftware: (computerId: string, data: {
    name: string;
    version?: string;
    category?: string;
    icon?: string;
  }) => api.post(`/system-details/${computerId}/software`, data),
  removeSoftware: (computerId: string, softwareIndex: number) => 
    api.delete(`/system-details/${computerId}/software/${softwareIndex}`),
};

export default api; 
