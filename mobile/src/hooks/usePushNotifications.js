import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
});

export default function usePushNotifications(navigationRef) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

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
