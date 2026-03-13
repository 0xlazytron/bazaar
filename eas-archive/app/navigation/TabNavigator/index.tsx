import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Image } from 'react-native';
import CategoriesScreen from '../../screens/CategoriesScreen';
import HomeScreen from '../../screens/HomeScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../../assets/images/icons/home.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? '#16A34A' : '#64748B',
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../../assets/images/icons/categories.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? '#16A34A' : '#64748B',
              }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
} 