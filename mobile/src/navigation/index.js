import React, { useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import usePushNotifications from '../hooks/usePushNotifications';
import { colors } from '../theme';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import SearchDriverScreen from '../screens/passenger/SearchDriverScreen';
import DriverProfileScreen from '../screens/passenger/DriverProfileScreen';
import BookingScreen from '../screens/passenger/BookingScreen';
import CostEstimateScreen from '../screens/passenger/CostEstimateScreen';
import MyBookingsScreen from '../screens/passenger/MyBookingsScreen';
import BookingConfirmationScreen from '../screens/passenger/BookingConfirmationScreen';
import QRScannerScreen from '../screens/passenger/QRScannerScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ChatsListScreen from '../screens/shared/ChatsListScreen';
import TripTrackingScreen from '../screens/passenger/TripTrackingScreen';
import RateDriverScreen from '../screens/passenger/RateDriverScreen';
import RequestRideScreen from '../screens/passenger/RequestRideScreen';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import ScheduleScreen from '../screens/driver/ScheduleScreen';
import DriverBookingsScreen from '../screens/driver/DriverBookingsScreen';
import ActiveTripScreen from '../screens/driver/ActiveTripScreen';
import EarningsDashboardScreen from '../screens/driver/EarningsDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = (name) => ({ focused, color, size }) => (
  <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
);

const tabOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: { borderTopColor: colors.border, elevation: 0, shadowOpacity: 0 },
};

const PassengerTabs = () => (
  <Tab.Navigator screenOptions={tabOptions}>
    <Tab.Screen name="Search" component={SearchDriverScreen} options={{ tabBarIcon: tabIcon('search') }} />
    <Tab.Screen name="My Trips" component={MyBookingsScreen} options={{ tabBarIcon: tabIcon('map') }} />
  </Tab.Navigator>
);

const DriverTabs = () => (
  <Tab.Navigator screenOptions={tabOptions}>
    <Tab.Screen name="Home" component={DriverHomeScreen} options={{ tabBarIcon: tabIcon('home') }} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarIcon: tabIcon('calendar') }} />
    <Tab.Screen name="Bookings" component={DriverBookingsScreen} options={{ tabBarIcon: tabIcon('car') }} />
  </Tab.Navigator>
);

function AppNavigator() {
  const { user, loading } = useAuth();
  const navigationRef = useRef(null);
  usePushNotifications(navigationRef);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'passenger' ? (
          <>
            <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
            <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="CostEstimate" component={CostEstimateScreen} />
            <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="TripTracking" component={TripTrackingScreen} />
            <Stack.Screen name="RateDriver" component={RateDriverScreen} />
            <Stack.Screen name="RequestRide" component={RequestRideScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="ChatsList" component={ChatsListScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="DriverTabs" component={DriverTabs} />
            <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
            <Stack.Screen name="Earnings" component={EarningsDashboardScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="ChatsList" component={ChatsListScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
