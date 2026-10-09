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
import PlaceDetailsScreen from './PlaceDetailsScreen';
import TaskEditorScreen from './TaskEditorScreen';
import ContactDetailsScreen from './ContactDetailsScreen';
import ContactEditorScreen from './ContactEditorScreen';
import ChecklistsScreen from './ChecklistsScreen';
import DocumentsScreen from './DocumentsScreen';
import CalendarScreen from './CalendarScreen';
import ContactsScreen from './ContactsScreen';
import AlertsScreen from './AlertsScreen';
import { COLORS } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The bottom tab bar. Stays visible while switching between sections.
const TABS = [
  { name: 'DashboardHome', label: 'Home', icon: 'home', component: DashboardScreen },
  { name: 'MapTab', label: 'Map', icon: 'map', component: MapScreen },
  { name: 'ChecklistsTab', label: 'Tasks', icon: 'checkbox', component: ChecklistsScreen },
  { name: 'DocumentsTab', label: 'Docs', icon: 'document-text', component: DocumentsScreen },
  { name: 'CalendarTab', label: 'Calendar', icon: 'calendar', component: CalendarScreen },
  { name: 'ContactsTab', label: 'Contacts', icon: 'people', component: ContactsScreen },
  { name: 'AlertsTab', label: 'Alerts', icon: 'notifications', component: AlertsScreen },
];

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.tertiaryLabel,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.separator },
        tabBarIcon: ({ color, size, focused }) => {
          const tab = TABS.find((t) => t.name === route.name);
          return <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={size - 2} color={color} />;
        },
      })}
    >
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} options={{ tabBarLabel: tab.label }} />
      ))}
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
        <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="TaskEditor" component={TaskEditorScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ContactDetails" component={ContactDetailsScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ContactEditor" component={ContactEditorScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}