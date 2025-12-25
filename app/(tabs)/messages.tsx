import { Stack } from 'expo-router';
import React from 'react';
import MessagesScreen from '../screens/MessagesScreen';

export default function MessagesTab() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MessagesScreen />
    </>
  );
}