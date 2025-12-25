import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import CallScreen from '../../screens/CallScreen';

export default function CallRoute() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CallScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1
  }
});