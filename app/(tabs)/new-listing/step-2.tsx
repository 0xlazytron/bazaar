import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { getMainCategories, subscribeMainCategories } from '../../../lib/firestore';

const toName = (c: any) => String(c?.name || '');

export default function NewListingStep2Screen() {
  const params = useLocalSearchParams();
  const [itemCondition, setItemCondition] = useState('New');
  const [category, setCategory] = useState('');
  const [pricingType, setPricingType] = useState('Auction (7 days)');
  const [price, setPrice] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let unsub: any;
    (async () => {
      const initial = await getMainCategories();
      setCategories(initial.map((c) => toName(c)).filter(Boolean));
      unsub = subscribeMainCategories((list) => setCategories(list.map((c) => toName(c)).filter(Boolean)));
    })();
    return () => unsub && unsub();
  }, []);

  const validateForm = () => {
    if (!category) {
      Alert.alert('Category Required', 'Please select a category for your item.');
      return false;
    }
    if (!price.trim()) {
      Alert.alert('Price Required', 'Please enter a price for your item.');
      return false;
    }
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateForm()) {
      const stepData = {
        title: params.title || '',
        description: params.description || '',
        images: params.images ? JSON.parse(params.images as string) : [],
        itemCondition,
        category,
        pricingType,
        price
      };

      router.push({
        pathname: '/(tabs)/new-listing/step-3',
        params: {
          data: JSON.stringify(stepData)
        }
      });
    }
  };

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
            <Text style={styles.subtitle}>Let&apos;s help you sell your item quickly</Text>
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
              <Text style={styles.cardTitle}>Product Details</Text>
              <Text style={styles.cardSubtitle}>
                Specify details about your item&apos;s condition{'\n'}and price
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
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={[styles.categoryText, !category && styles.placeholderText]}>
                  {category || 'Select a category'}
                </Text>
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
                  'Auction (1 day)',
                  'Fixed Price (Buy Now)',
                  'Both (Auction with Buy Now Option 7 days)',
                  'Both (Auction with Buy Now Option 1 day)'
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
                {pricingType?.includes('Auction') ? 'Starting Price' : 'Price'} (MUR) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>Rs</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
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
                onPress={handleNextStep}
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

        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="#64748B"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.categoryList}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryItem,
                      category === cat && styles.categoryItemSelected
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryItemText,
                      category === cat && styles.categoryItemTextSelected
                    ]}>
                      {cat}
                    </Text>
                    {category === cat && (
                      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                        <Path
                          d="M16.6667 5L7.50004 14.1667L3.33337 10"
                          stroke="#16A34A"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  placeholderText: {
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020817',
  },
  modalCloseButton: {
    padding: 4,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#020817',
  },
  categoryItemTextSelected: {
    color: '#16A34A',
    fontWeight: '500',
  },
});
