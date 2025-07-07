import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import RestaurantListScreen from './src/screens/RestaurantListScreen';
import RestaurantDetailScreen from './src/screens/RestaurantDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MeetupScreen from './src/screens/MeetupScreen';
import AuthScreen from './src/screens/AuthScreen';

// Context
import { AuthProvider } from './src/context/AuthContext';

// Create a client
const queryClient = new QueryClient();

// Create a stack navigator
const Stack = createStackNavigator();

// Define Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Auth" component={AuthScreen} />
  </Stack.Navigator>
);

// Define Main Stack
const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{ title: 'Convive' }}
    />
    <Stack.Screen 
      name="RestaurantList" 
      component={RestaurantListScreen} 
      options={{ title: 'Our Exclusive Venues' }}
    />
    <Stack.Screen 
      name="RestaurantDetail" 
      component={RestaurantDetailScreen} 
      options={({ route }) => ({ title: route.params?.name || 'Restaurant Details' })}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Your Profile' }}
    />
    <Stack.Screen 
      name="Meetup" 
      component={MeetupScreen} 
      options={{ title: 'Dining Event' }}
    />
  </Stack.Navigator>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AuthStack" component={AuthStack} />
            <Stack.Screen name="MainStack" component={MainStack} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}