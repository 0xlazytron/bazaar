import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

export default function NewListingStep2Screen() {
  const [itemCondition, setItemCondition] = useState('New');
  const [pricingType, setPricingType] = useState('Auction (7 days)');

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
              <View style={[styles.stepLine, styles.stepLineActive]} />
              <View style={styles.stepActive}>
                <Text style={styles.stepTextActive}>2</Text>
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
              <Text style={styles.cardTitle}>Item Category & Pricing</Text>
              <Text style={styles.cardSubtitle}>
                Specify details about your item's condition{'\n'}and price
              </Text>
            </View>

            {/* Item Condition */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Item Condition <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.conditionContainer}>
                {['New', 'Used', 'Defective'].map((condition) => (
                  <TouchableOpacity 
                    key={condition}
                    style={styles.conditionOption}
                    onPress={() => setItemCondition(condition)}
                  >
                    <View style={[
                      styles.radioButton,
                      itemCondition === condition && styles.radioButtonActive
                    ]}>
                      {itemCondition === condition && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={styles.conditionText}>{condition}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Selector */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Category <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity style={styles.categorySelector}>
                <Text style={styles.categoryText}>Furniture</Text>
                <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                  <Path
                    d="M4.3999 6.79999L8.3999 10.8L12.3999 6.79999"
                    stroke="#020817"
                    strokeWidth={1.33333}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.5}
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Pricing Type */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Pricing Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pricingTypeContainer}>
                {[
                  'Auction (7 days)',
                  'Fixed Price (Buy Now)',
                  'Both (Auction with Buy Now option)'
                ].map((type) => (
                  <TouchableOpacity 
                    key={type}
                    style={styles.pricingOption}
                    onPress={() => setPricingType(type)}
                  >
                    <View style={[
                      styles.radioButton,
                      pricingType === type && styles.radioButtonActive
                    ]}>
                      {pricingType === type && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={styles.pricingText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Starting Price */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Starting Price (MUR) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>Rs</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.backStepButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={() => router.push('./step-3')}
              >
                <Text style={styles.nextButtonText}>Next Step</Text>
                <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                  <Path
                    d="M3.5332 8.80005H12.8665"
                    stroke="white"
                    strokeWidth={1.33333}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M8.19971 4.13342L12.8664 8.80009L8.19971 13.4668"
                    stroke="white"
                    strokeWidth={1.33333}
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
  stepLineActive: {
    backgroundColor: '#16A34A',
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
  conditionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conditionOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: '#16A34A',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
    marginLeft: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
  },
  categoryText: {
    fontSize: 14,
    color: '#020817',
  },
  pricingTypeContainer: {
    gap: 12,
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
    marginLeft: 12,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#020817',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
  },
  backStepButton: {
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 24,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginRight: 8,
  },
}); 