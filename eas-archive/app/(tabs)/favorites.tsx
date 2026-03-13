import { Stack } from 'expo-router';
import React from 'react';
import { FavoritesScreen } from '../screens/FavoritesScreen';

export default function FavoritesTab() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FavoritesScreen />
    </>
  );
}