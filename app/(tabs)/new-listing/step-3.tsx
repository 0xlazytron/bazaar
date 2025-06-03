import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

export default function NewListingStep3Screen() {
  const [deliveryOption, setDeliveryOption] = useState('Both options available');
  const [paymentOption, setPaymentOption] = useState('Cash');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = () => {
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }
    // If terms are already accepted, show success directly
    setShowSuccessModal(true);
  };

  const handleTermsConfirm = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    setShowSuccessModal(true);
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
                d="M10.8457 12L6.8457 8L10.8457 4"
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
              <View style={[styles.stepLine, styles.stepLineActive]} />
              <View style={styles.stepActive}>
                <Text style={styles.stepTextActive}>3</Text>
              </View>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Delivery & Payment</Text>
              <Text style={styles.cardSubtitle}>
                Specify how you'll deliver the item and{'\n'}accept payment
              </Text>
            </View>

            {/* Delivery Options */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Delivery Options <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.optionsContainer}>
                {['Delivery', 'Pick-up only', 'Both options available'].map((option) => (
                  <TouchableOpacity 
                    key={option}
                    style={styles.optionItem}
                    onPress={() => setDeliveryOption(option)}
                  >
                    <View style={[
                      styles.radioButton,
                      deliveryOption === option && styles.radioButtonActive
                    ]}>
                      {deliveryOption === option && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Delivery Cost */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Delivery Cost (MUR) <Text style={styles.required}>*</Text>
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

            {/* Pickup Location */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Pick-up Location <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.locationInput}
                placeholder="e.g. Port Louis, Mauritius"
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Payment Options */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                Payment Options <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.optionsContainer}>
                {['Cash', 'Juice', 'Other'].map((option) => (
                  <TouchableOpacity 
                    key={option}
                    style={styles.optionItem}
                    onPress={() => setPaymentOption(option)}
                  >
                    <View style={[
                      styles.radioButton,
                      paymentOption === option && styles.radioButtonActive
                    ]}>
                      {paymentOption === option && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Platform Fee Notice */}
            <View style={styles.noticeContainer}>
              <Svg width={8} height={21} viewBox="0 0 8 21" fill="none">
                <Path
                  d="M3.87542 13.4595C5.45404 13.4595 6.73376 12.1793 6.73376 10.6001C6.73376 9.02091 5.45404 7.74072 3.87542 7.74072C2.29681 7.74072 1.01709 9.02091 1.01709 10.6001C1.01709 12.1793 2.29681 13.4595 3.87542 13.4595Z"
                  stroke="#F59E0B"
                  strokeWidth={0.571875}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>Platform fees apply</Text>
                <Text style={styles.noticeText}>
                  The platform will charge you 5% of{'\n'}
                  the final sale price. If your item does{'\n'}
                  not sell, no charges will be incurred.
                </Text>
              </View>
            </View>

            {/* Terms Agreement */}
            <View style={styles.termsContainer}>
              <Switch
                value={termsAccepted}
                onValueChange={setTermsAccepted}
                trackColor={{ false: '#E5E7EB', true: '#16A34A' }}
                thumbColor="white"
              />
              <Text style={styles.termsText}>
                I agree to the Terms & Conditions{'\n'}
                and confirm that this listing{'\n'}
                complies with all platform policies.
              </Text>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                  <Path
                    d="M13.3786 4.3999L6.04525 11.7332L2.71191 8.3999"
                    stroke="white"
                    strokeWidth={1.33333}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.submitButtonText}>Submit Listing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Terms & Conditions Modal */}
        <Modal
          visible={showTermsModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.termsModal}>
              <View style={styles.termsModalHeader}>
                <Text style={styles.termsModalTitle}>Terms & Conditions</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowTermsModal(false)}
                >
                  <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                    <Path
                      d="M12.3535 4.20038L4.35352 12.2004"
                      stroke="#020817"
                      strokeWidth={1.33333}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M4.35352 4.20038L12.3535 12.2004"
                      stroke="#020817"
                      strokeWidth={1.33333}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              <Text style={styles.termsModalSubtitle}>
                By creating this listing, you agree to the{'\n'}
                following terms:
              </Text>

              <View style={styles.termsModalContent}>
                <Text style={styles.termsModalText}>
                  The platform will charge a fee of <Text style={styles.boldText}>5% of the final{'\n'}
                  sale price</Text> if your item sells. If your item does not{'\n'}
                  sell, no charges will be incurred.
                </Text>
              </View>

              <Text style={styles.confirmationTitle}>You also confirm that:</Text>

              <View style={styles.confirmationList}>
                <Text style={styles.confirmationItem}>• You own this item or are authorized to sell it</Text>
                <Text style={styles.confirmationItem}>• The item meets all applicable legal requirements</Text>
                <Text style={styles.confirmationItem}>• Your listing complies with Bazaar's policies</Text>
                <Text style={styles.confirmationItem}>• The information provided is accurate and complete</Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowTermsModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleTermsConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <Text style={styles.successTitle}>Product Listed!</Text>
              <Text style={styles.successText}>
                Your product has been listed on our platform. Check your app for updates
              </Text>
              <TouchableOpacity 
                style={styles.viewListingButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push('/(tabs)/profile');
                }}
              >
                <Text style={styles.viewListingButtonText}>View My Listing</Text>
              </TouchableOpacity>
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
  stepTextActive: {
    color: 'white',
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
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  optionText: {
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
  locationInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#020817',
  },
  noticeContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  noticeContent: {
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#92400E',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#B45309',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
    marginLeft: 8,
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
  submitButton: {
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
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
  },
  termsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020817',
  },
  closeButton: {
    padding: 8,
  },
  termsModalSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
  },
  termsModalContent: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  termsModalText: {
    fontSize: 14,
    color: '#4B5563',
  },
  boldText: {
    fontWeight: '600',
  },
  confirmationTitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  confirmationList: {
    marginBottom: 24,
  },
  confirmationItem: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020817',
  },
  confirmButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 10,
    marginLeft: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  successModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#020817',
    marginBottom: 35,
  },
  successText: {
    fontSize: 14,
    color: '#020817',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 35,
  },
  viewListingButton: {
    width: '100%',
    height: 40,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewListingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
}); 