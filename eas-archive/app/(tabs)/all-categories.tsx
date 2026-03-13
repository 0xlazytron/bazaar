import { Stack } from 'expo-router';
import React from 'react';
import AllCategories from '../components/AllCategories';

export default function AllCategoriesScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AllCategories />
    </>
  );
} 