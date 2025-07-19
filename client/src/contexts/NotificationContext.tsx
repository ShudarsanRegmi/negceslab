import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { notificationsAPI } from '../services/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  userId: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentUser } = useAuth();

  const fetchNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const response = await notificationsAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to mock data if API fails
      const mockNotifications: Notification[] = [
        {
          _id: '1',
          title: 'Booking Approved',
          message: 'Your booking for LAB-PC-001 has been approved',
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString(),
          userId: currentUser.uid,
        },
        {
          _id: '2',
          title: 'New Computer Available',
          message: 'LAB-PC-003 is now available for booking',
          type: 'info',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          userId: currentUser.uid,
        },
        {
          _id: '3',
          title: 'Maintenance Notice',
          message: 'LAB-PC-004 will be under maintenance tomorrow',
          type: 'warning',
          isRead: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          userId: currentUser.uid,
        },
      ];
      setNotifications(mockNotifications);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback to local update
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Fallback to local update
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 