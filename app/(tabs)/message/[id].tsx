import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MessageDetailScreen from '../../screens/MessageDetailScreen';

export default function MessageDetailRoute() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <MessageDetailScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    // This ensures the view covers the entire screen including the area where bottom navigation would be
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1
  }
});