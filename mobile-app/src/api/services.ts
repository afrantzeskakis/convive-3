import axios from 'axios';
import { getToken } from '../utils/auth';

// Define base URL - in production this would be your server URL
// During development, this might be your local server or a staging server
const API_BASE_URL = 'https://api.convive.app'; // This should be updated to your actual API URL

// Create an axios instance with default configs
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API calls
export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (email: string, password: string, fullName: string) => {
  const response = await api.post('/api/auth/register', { email, password, fullName });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/api/user');
  return response.data;
};

export const updateUserProfile = async (userData: any) => {
  const response = await api.patch('/api/user', userData);
  return response.data;
};

// Restaurant API calls
export const fetchFeaturedRestaurants = async () => {
  const response = await api.get('/api/restaurants/featured');
  return response.data;
};

export const fetchAllRestaurants = async () => {
  const response = await api.get('/api/restaurants');
  return response.data;
};

export const fetchRestaurantDetails = async (id: number) => {
  const response = await api.get(`/api/restaurants/${id}`);
  return response.data;
};

// Meetup API calls
export const fetchUpcomingMeetups = async () => {
  const response = await api.get('/api/meetups/upcoming');
  return response.data;
};

export const fetchUserMeetups = async () => {
  const response = await api.get('/api/meetups/user');
  return response.data;
};

export const fetchMeetupDetails = async (id: number) => {
  const response = await api.get(`/api/meetups/${id}`);
  return response.data;
};

export const requestMeetup = async (meetupData: any) => {
  const response = await api.post('/api/meetups', meetupData);
  return response.data;
};

export const joinMeetup = async (meetupId: number) => {
  const response = await api.post(`/api/meetups/${meetupId}/join`);
  return response.data;
};

export const cancelMeetup = async (meetupId: number) => {
  const response = await api.post(`/api/meetups/${meetupId}/cancel`);
  return response.data;
};

// Message API calls
export const fetchMeetupMessages = async (meetupId: number) => {
  const response = await api.get(`/api/meetups/${meetupId}/messages`);
  return response.data;
};

export const sendMessage = async (meetupId: number, content: string) => {
  const response = await api.post(`/api/meetups/${meetupId}/messages`, { content });
  return response.data;
};

// Subscription and payment API calls
export const fetchSubscriptionPlans = async () => {
  const response = await api.get('/api/subscriptions/plans');
  return response.data;
};

export const createSubscription = async (planId: number) => {
  const response = await api.post('/api/subscriptions', { planId });
  return response.data;
};

export const fetchUserSubscription = async () => {
  const response = await api.get('/api/subscriptions/user');
  return response.data;
};

// Error handler function to standardize error handling
export const handleApiError = (error: any) => {
  // Network errors
  if (!error.response) {
    return {
      message: 'Network error. Please check your internet connection.',
    };
  }

  // Server errors
  const { status, data } = error.response;
  
  switch (status) {
    case 401:
      return {
        message: 'Authentication required. Please log in again.',
        authError: true
      };
    case 403:
      return {
        message: 'You do not have permission to perform this action.',
      };
    case 404:
      return {
        message: 'The requested resource was not found.',
      };
    case 422:
      return {
        message: 'Validation error.',
        errors: data.errors || [],
      };
    case 500:
      return {
        message: 'Server error. Please try again later.',
      };
    default:
      return {
        message: data.message || 'An unexpected error occurred.',
      };
  }
};