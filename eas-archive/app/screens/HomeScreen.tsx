import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FeaturedAuctions } from '../components/FeaturedAuctions';
import { TopHeader } from '../components/TopHeader';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <TopHeader />
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FeaturedAuctions />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
}); 