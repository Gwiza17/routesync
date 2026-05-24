import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Passenger tabs
import SearchDriverScreen from '../screens/passenger/SearchDriverScreen';
import DriverProfileScreen from '../screens/passenger/DriverProfileScreen';
import BookingScreen from '../screens/passenger/BookingScreen';
import CostEstimateScreen from '../screens/passenger/CostEstimateScreen';
import MyBookingsScreen from '../screens/passenger/MyBookingsScreen';
import TripTrackingScreen from '../screens/passenger/TripTrackingScreen';

// Driver tabs
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import ScheduleScreen from '../screens/driver/ScheduleScreen';
import DriverBookingsScreen from '../screens/driver/DriverBookingsScreen';
import ActiveTripScreen from '../screens/driver/ActiveTripScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PassengerTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Search" component={SearchDriverScreen} />
    <Tab.Screen name="My Trips" component={MyBookingsScreen} />
  </Tab.Navigator>
);

const DriverTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Home" component={DriverHomeScreen} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} />
    <Tab.Screen name="Bookings" component={DriverBookingsScreen} />
  </Tab.Navigator>
);

export default function Navigation() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'passenger' ? (
          <>
            <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
            <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="CostEstimate" component={CostEstimateScreen} />
            <Stack.Screen name="TripTracking" component={TripTrackingScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="DriverTabs" component={DriverTabs} />
            <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
