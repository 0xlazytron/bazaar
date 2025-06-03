import { Stack } from 'expo-router';
import React from 'react';
import CategoriesScreen from '../screens/CategoriesScreen';

export default function Categories() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      <CategoriesScreen />
    </>
  );
} 