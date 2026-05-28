import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// expo-notifications remote push was removed from Expo Go in SDK 53.
// We must NOT import the module at all in Expo Go — even a top-level
// import triggers its initialization code and crashes the app.
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  // Safe to require only in real / dev builds
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export default function usePushNotifications(navigationRef) {
  const { user } = useAuth();

  useEffect(() => {
    if (isExpoGo || !user) return;

    const Notifications = require('expo-notifications');

    const register = async () => {
      if (Platform.OS === 'web') return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      await api.post('/auth/push-token', { token }).catch(() => {});
    };

    register();

    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.screen && navigationRef?.current) {
        navigationRef.current.navigate(data.screen, data);
      }
    });

    return () => sub.remove();
  }, [user]);
}
