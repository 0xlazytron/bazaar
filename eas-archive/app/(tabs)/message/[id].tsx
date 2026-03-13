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
  }
});
