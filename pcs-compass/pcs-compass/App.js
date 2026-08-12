import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './HomeScreen';
import SignUpScreen from './SignUpScreen';
import LoginScreen from './LoginScreen';
import DashboardScreen from './DashboardScreen';
import ProfileCreationScreen from './ProfileCreationScreen';
import ProfileScreen from './ProfileScreen';
import MapScreen from './MapScreen';
import ContactsScreen from './ContactsScreen';
import AlertsScreen from './AlertsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The persistent bottom tab bar: Home / Map / Contacts / Alerts.
// This stays visible while switching between these four sections.
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#173A5E',
        tabBarInactiveTintColor: '#8A94A6',
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'DashboardHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'ContactsTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'AlertsTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardHome" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="MapTab" component={MapScreen} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen name="ContactsTab" component={ContactsScreen} options={{ tabBarLabel: 'Contacts' }} />
      <Tab.Screen name="AlertsTab" component={AlertsScreen} options={{ tabBarLabel: 'Alerts' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="ProfileCreation" component={ProfileCreationScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}