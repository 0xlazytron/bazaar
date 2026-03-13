import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ValidationError } from '../lib/validation';

interface ErrorMessageProps {
  error?: ValidationError | null;
  style?: any;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, style }) => {
  if (!error) return null;

  return (
    <View style={[styles.container, style]}>
      <ThemedText style={styles.icon}>{error.icon}</ThemedText>
      <ThemedText style={styles.message}>{error.message}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  message: {
    fontSize: 12,
    color: '#FF3B30',
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
});