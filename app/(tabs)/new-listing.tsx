import { Stack, router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

export default function NewListingScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Svg width={17} height={16} viewBox="0 0 17 16" fill="none">
              <Path
                d="M10.25 12L6.25 8L10.25 4"
                stroke="#020817"
                strokeWidth={1.33333}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Listing</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Title and Description */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Create a New Listing</Text>
            <Text style={styles.subtitle}>Let's help you sell your item quickly</Text>
          </View>

          {/* Stepper */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepper}>
              <View style={styles.stepActive}>
                <Text style={styles.stepTextActive}>1</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepInactive}>
                <Text style={styles.stepTextInactive}>2</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepInactive}>
                <Text style={styles.stepTextInactive}>3</Text>
              </View>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Item Details</Text>
              <Text style={styles.cardSubtitle}>
                Add information and images about your{'\n'}item
              </Text>
            </View>

            {/* Image Upload */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Images (Optional, max 5)</Text>
              <TouchableOpacity style={styles.uploadBox}>
                <Svg width={33} height={33} viewBox="0 0 33 33" fill="none">
                  <Path
                    d="M19.4479 6.1983H12.7813L9.44792 10.1983H5.44792C4.74067 10.1983 4.0624 10.4793 3.5623 10.9794C3.0622 11.4794 2.78125 12.1577 2.78125 12.865V24.865C2.78125 25.5722 3.0622 26.2505 3.5623 26.7506C4.0624 27.2507 4.74067 27.5316 5.44792 27.5316H26.7813C27.4885 27.5316 28.1668 27.2507 28.6669 26.7506C29.167 26.2505 29.4479 25.5722 29.4479 24.865V12.865C29.4479 12.1577 29.167 11.4794 28.6669 10.9794C28.1668 10.4793 27.4885 10.1983 26.7813 10.1983H22.7813L19.4479 6.1983Z"
                    stroke="#9CA3AF"
                    strokeWidth="2.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M16.1147 22.1983C18.3239 22.1983 20.1147 20.4074 20.1147 18.1983C20.1147 15.9892 18.3239 14.1983 16.1147 14.1983C13.9056 14.1983 12.1147 15.9892 12.1147 18.1983C12.1147 20.4074 13.9056 22.1983 16.1147 22.1983Z"
                    stroke="#9CA3AF"
                    strokeWidth="2.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.uploadText}>Add Image</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>Upload</Text>
                <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                  <Path
                    d="M8.0498 12.9966L8.0498 3.66331"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M3.3833 8.32996L8.04997 3.66329L12.7166 8.32996"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Apple iPhone 13 Pro Max 256GB"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.charCount}>0/80 characters</Text>
            </View>

            {/* Description Input */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholder="Describe your item including condition, features, and any other relevant details..."
                placeholderTextColor="#64748B"
                textAlignVertical="top"
              />
            </View>

            {/* Next Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={() => router.push('/(tabs)/new-listing/step-2')}
              >
                <Text style={styles.nextButtonText}>Next Step</Text>
                <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                  <Path
                    d="M3.7832 8.33008H13.1165"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M8.44971 3.66345L13.1164 8.33012L8.44971 12.9968"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    paddingTop: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020817',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020817',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 8,
  },
  stepperContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextActive: {
    color: 'white',
    fontSize: 16,
  },
  stepTextInactive: {
    color: '#4B5563',
    fontSize: 16,
  },
  stepLine: {
    width: 64,
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  card: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#020817',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  formSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
    marginBottom: 12,
  },
  required: {
    color: '#EF4444',
  },
  uploadBox: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#020817',
  },
  textArea: {
    height: 150,
    paddingTop: 12,
    paddingBottom: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 24,
    alignItems: 'flex-end',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
}); 