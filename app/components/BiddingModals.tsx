import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

type BiddingModalsProps = {
  placeBidVisible: boolean;
  confirmBidVisible: boolean;
  bidPlacedVisible: boolean;
  buyNowVisible: boolean;
  confirmPurchaseVisible: boolean;
  bidAmount: string;
  productTitle: string;
  currentBid: string;
  itemPrice: string;
  placingBid?: boolean;
  // Payment and delivery state
  paymentMethod: 'cash' | 'juice';
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress: string;
  deliveryCost: number;
  onBidAmountChange: (amount: string) => void;
  onClosePlaceBid: () => void;
  onCloseConfirmBid: () => void;
  onCloseBidPlaced: () => void;
  onCloseBuyNow: () => void;
  onCloseConfirmPurchase: () => void;
  onPlaceBid: () => void;
  onConfirmBid: () => void;
  onBuyNow: () => void;
  onConfirmPurchase: () => void;
  onViewBids: () => void;
  // Payment and delivery handlers
  onPaymentMethodChange: (method: 'cash' | 'juice') => void;
  onDeliveryMethodChange: (method: 'pickup' | 'delivery') => void;
  onDeliveryAddressChange: (address: string) => void;
  onLocationPicker?: () => void;
};

export function BiddingModals({
  placeBidVisible,
  confirmBidVisible,
  bidPlacedVisible,
  buyNowVisible,
  confirmPurchaseVisible,
  bidAmount,
  productTitle,
  currentBid,
  itemPrice,
  placingBid = false,
  paymentMethod,
  deliveryMethod,
  deliveryAddress,
  deliveryCost,
  onBidAmountChange,
  onClosePlaceBid,
  onCloseConfirmBid,
  onCloseBidPlaced,
  onCloseBuyNow,
  onCloseConfirmPurchase,
  onPlaceBid,
  onConfirmBid,
  onBuyNow,
  onConfirmPurchase,
  onViewBids,
  onPaymentMethodChange,
  onDeliveryMethodChange,
  onDeliveryAddressChange,
  onLocationPicker,
}: BiddingModalsProps) {
  // Place Bid Modal
  const renderPlaceBidModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={placeBidVisible}
      onRequestClose={onClosePlaceBid}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClosePlaceBid}>
            <Image
              source={require('@/assets/images/icons/close.png')}
              style={styles.closeIcon}
            />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Place a Bid</ThemedText>
          </View>

          <View style={styles.modalContent}>
            <ThemedText style={styles.modalSubtitle}>You are bidding on:</ThemedText>
            <ThemedText style={styles.productTitle}>{productTitle}</ThemedText>

            <View style={styles.currentBidContainer}>
              <ThemedText style={styles.currentBidText}>Current bid: Rs {currentBid}</ThemedText>
            </View>

            <View style={styles.bidInputSection}>
              <ThemedText style={styles.inputLabel}>Your bid (Rs)</ThemedText>

              <View style={styles.bidInputContainer}>
                <View style={styles.rupeeIconContainer}>
                  <Image
                    source={require('@/assets/images/icons/rupee.png')}
                    style={styles.rupeeIcon}
                  />
                </View>
                <TextInput
                  style={styles.bidInput}
                  value={bidAmount}
                  onChangeText={onBidAmountChange}
                  keyboardType="numeric"
                  placeholder="Enter bid amount"
                />
              </View>

              <ThemedText style={styles.minBidText}>Minimum bid: Rs {parseInt(currentBid.replace(/,/g, '')) + 1}</ThemedText>
            </View>

            <View style={styles.infoBox}>
              <Image
                source={require('@/assets/images/icons/info.png')}
                style={styles.infoIcon}
              />
              <ThemedText style={styles.infoText}>
                All bids are final and represent a binding{"\n"}
                agreement to purchase the item if you{"\n"}
                win.
              </ThemedText>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClosePlaceBid}>
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onPlaceBid}>
              <ThemedText style={styles.actionButtonText}>Review Bid</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Confirm Bid Modal
  const renderConfirmBidModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={confirmBidVisible}
      onRequestClose={onCloseConfirmBid}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onCloseConfirmBid}>
            <Image
              source={require('@/assets/images/icons/close.png')}
              style={styles.closeIcon}
            />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Confirm Your Bid</ThemedText>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.bidAmountContainer}>
              <ThemedText style={styles.bidAmountLabel}>Your bid</ThemedText>
              <ThemedText style={styles.bidAmountValue}>Rs {bidAmount}</ThemedText>
            </View>

            <ThemedText style={styles.bidProductInfo}>
              on <ThemedText style={styles.bidProductTitle}>{productTitle}</ThemedText>
            </ThemedText>

            <View style={styles.warningBox}>
              <Image
                source={require('@/assets/images/icons/warning.png')}
                style={styles.warningIcon}
              />
              <ThemedText style={styles.warningText}>
                <ThemedText style={styles.warningBold}>This is a legally binding action.</ThemedText> By{"\n"}
                confirming, you agree to purchase this{"\n"}
                item if you win the auction.
              </ThemedText>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCloseConfirmBid}>
              <ThemedText style={styles.cancelButtonText}>Go Back</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, placingBid && styles.actionButtonDisabled]}
              onPress={placingBid ? undefined : onConfirmBid}
              disabled={placingBid}
            >
              <View style={styles.actionButtonRow}>
                {placingBid ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Image
                    source={require('@/assets/images/icons/check.png')}
                    style={styles.actionButtonIcon}
                  />
                )}
                <ThemedText style={styles.actionButtonText}>
                  {placingBid ? 'Placing Bid...' : 'Place Bid'}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Bid Placed Modal
  const renderBidPlacedModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={bidPlacedVisible}
      onRequestClose={onCloseBidPlaced}
    >
      <View style={styles.centeredView}>
        <View style={styles.successModalView}>
          <View style={styles.successContent}>
            <ThemedText style={styles.successTitle}>Your Bid is Placed !</ThemedText>

            <ThemedText style={styles.successMessage}>
              Your bid has been placed on our platform. Check your app for updates
            </ThemedText>

            <TouchableOpacity style={styles.successButton} onPress={onViewBids}>
              <ThemedText style={styles.successButtonText}>View My Bids</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Buy Now Modal
  const renderBuyNowModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={buyNowVisible}
      onRequestClose={onCloseBuyNow}
    >
      <KeyboardAvoidingView
        style={styles.centeredView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onCloseBuyNow}>
            <Image
              source={require('@/assets/images/icons/close.png')}
              style={styles.closeIcon}
            />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Complete Your Purchase</ThemedText>
            <ThemedText style={styles.purchaseSubtitle}>
              Please select your payment and delivery{"\n"}
              preferences.
            </ThemedText>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionContainer}>
              <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>

              <View style={styles.optionsContainer}>
                <TouchableOpacity style={styles.optionRow} onPress={() => onPaymentMethodChange('cash')}>
                  <View style={paymentMethod === 'cash' ? styles.radioSelected : styles.radioUnselected}>
                    {paymentMethod === 'cash' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionIconContainer}>
                    <Image
                      source={require('@/assets/images/icons/rupee.png')}
                      style={styles.optionIcon}
                    />
                  </View>
                  <ThemedText style={styles.optionText}>Cash on Delivery/Pickup</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={() => onPaymentMethodChange('juice')}>
                  <View style={paymentMethod === 'juice' ? styles.radioSelected : styles.radioUnselected}>
                    {paymentMethod === 'juice' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionIconContainer}>
                    <Image
                      source={require('@/assets/images/icons/mobile.png')}
                      style={styles.optionIcon}
                    />
                  </View>
                  <ThemedText style={styles.optionText}>Juice (Mobile Money)</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionDivider} />

            <View style={styles.sectionContainer}>
              <ThemedText style={styles.sectionTitle}>Delivery Method</ThemedText>

              <View style={styles.optionsContainer}>
                <TouchableOpacity style={styles.optionRow} onPress={() => onDeliveryMethodChange('pickup')}>
                  <View style={deliveryMethod === 'pickup' ? styles.radioSelected : styles.radioUnselected}>
                    {deliveryMethod === 'pickup' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionIconContainer}>
                    <Image
                      source={require('@/assets/images/icons/location.png')}
                      style={styles.optionIcon}
                    />
                  </View>
                  <View>
                    <ThemedText style={styles.optionText}>Pickup</ThemedText>
                    <ThemedText style={styles.optionSubtext}>Free</ThemedText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={() => onDeliveryMethodChange('delivery')}>
                  <View style={deliveryMethod === 'delivery' ? styles.radioSelected : styles.radioUnselected}>
                    {deliveryMethod === 'delivery' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionIconContainer}>
                    <Image
                      source={require('@/assets/images/icons/delivery.png')}
                      style={styles.optionIcon}
                    />
                  </View>
                  <View>
                    <ThemedText style={styles.optionText}>Delivery</ThemedText>
                    <ThemedText style={styles.optionSubtext}>+ Rs {deliveryCost}</ThemedText>
                  </View>
                </TouchableOpacity>

                {deliveryMethod === 'delivery' && (
                  <View style={styles.addressInputContainer}>
                    <TextInput
                      style={styles.addressInput}
                      placeholder="Enter delivery address"
                      placeholderTextColor="#94A3B8"
                      value={deliveryAddress}
                      onChangeText={onDeliveryAddressChange}
                      multiline={true}
                      numberOfLines={2}
                    />
                    {onLocationPicker && (
                      <TouchableOpacity
                        style={styles.locationPickerButton}
                        onPress={onLocationPicker}
                      >
                        <Image
                          source={require('@/assets/images/icons/location.png')}
                          style={styles.locationPickerIcon}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCloseBuyNow}>
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onBuyNow}>
              <View style={styles.actionButtonRow}>
                <ThemedText style={styles.actionButtonText}>Continue</ThemedText>
                <Image
                  source={require('@/assets/images/icons/arrow-right.png')}
                  style={styles.actionButtonIcon}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Confirm Purchase Modal
  const renderConfirmPurchaseModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={confirmPurchaseVisible}
      onRequestClose={onCloseConfirmPurchase}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onCloseConfirmPurchase}>
            <Image
              source={require('@/assets/images/icons/close.png')}
              style={styles.closeIcon}
            />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Review and Confirm</ThemedText>
            <ThemedText style={styles.purchaseSubtitle}>
              Please review your purchase details.
            </ThemedText>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.purchaseSummary}>
              <ThemedText style={styles.purchaseProductTitle}>{productTitle}</ThemedText>

              <View style={styles.priceRow}>
                <ThemedText style={styles.priceLabel}>Item price:</ThemedText>
                <ThemedText style={styles.priceValue}>Rs {itemPrice}</ThemedText>
              </View>

              {deliveryMethod === 'delivery' && deliveryCost > 0 && (
                <View style={styles.priceRow}>
                  <ThemedText style={styles.priceLabel}>Delivery:</ThemedText>
                  <ThemedText style={styles.priceValue}>Rs {deliveryCost}</ThemedText>
                </View>
              )}

              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Total:</ThemedText>
                <ThemedText style={styles.totalValue}>
                  Rs {parseInt(itemPrice) + (deliveryMethod === 'delivery' ? deliveryCost : 0)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Payment:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {paymentMethod === 'cash' ? 'Cash on Delivery/Pickup' : 'Juice (Mobile Money)'}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Delivery:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {deliveryMethod === 'pickup' ? 'Pickup' : `Delivery to: ${deliveryAddress}`}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCloseConfirmPurchase}>
              <ThemedText style={styles.cancelButtonText}>Back</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onConfirmPurchase}>
              <View style={styles.actionButtonRow}>
                <Image
                  source={require('@/assets/images/icons/check.png')}
                  style={styles.actionButtonIcon}
                />
                <ThemedText style={styles.actionButtonText}>Complete Purchase</ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {renderPlaceBidModal()}
      {renderConfirmBidModal()}
      {renderBidPlacedModal()}
      {renderBuyNowModal()}
      {renderConfirmPurchaseModal()}
    </>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successModalView: {
    width: '100%',
    height: 258,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    opacity: 0.7,
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#020817',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748B',
    marginTop: 8,
  },
  purchaseSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748B',
    marginTop: 6,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#1F2937',
  },
  modalContent: {
    marginVertical: 16,
  },
  scrollContent: {
    maxHeight: 400,
  },
  currentBidContainer: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  currentBidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  bidInputSection: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 40,
    paddingHorizontal: 12,
  },
  rupeeIconContainer: {
    marginRight: 8,
  },
  rupeeIcon: {
    width: 20,
    height: 20,
    tintColor: '#9CA3AF',
  },
  bidInput: {
    flex: 1,
    fontSize: 16,
    color: '#020817',
  },
  minBidText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  infoIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#1D4ED8',
  },
  infoText: {
    fontSize: 14,
    color: '#1D4ED8',
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  warningIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#B45309',
  },
  warningText: {
    fontSize: 14,
    color: '#B45309',
    flex: 1,
  },
  warningBold: {
    fontWeight: 'bold',
  },
  modalFooter: {
    marginTop: 16,
    gap: 8,
  },
  cancelButton: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
  },
  actionButton: {
    height: 40,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  actionButtonIcon: {
    width: 16,
    height: 16,
    marginHorizontal: 8,
    tintColor: 'white',
  },
  bidAmountContainer: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  bidAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  bidAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  bidProductInfo: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 12,
  },
  bidProductTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 35,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#020817',
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#020817',
    opacity: 0.9,
  },
  successButton: {
    height: 40,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 38,
    width: '100%',
  },
  successButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  sectionDivider: {
    borderTopWidth: 0.8,
    borderColor: '#E2E8F0',
    marginVertical: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
  },
  radioSelected: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  radioUnselected: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  optionIconContainer: {
    marginLeft: 12,
    marginRight: 12,
  },
  optionIcon: {
    width: 20,
    height: 20,
    tintColor: '#6B7280',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
  },
  optionSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  addressInputContainer: {
    marginTop: 12,
    position: 'relative',
  },
  addressInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    paddingRight: 50,
    fontSize: 16,
    color: '#020817',
    minHeight: 48,
    textAlignVertical: 'top',
  },
  locationPickerButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#00A651',
  },
  locationPickerIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
  purchaseSummary: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  purchaseProductTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#020817',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
    borderTopWidth: 0.8,
    borderColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#020817',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
    width: 128,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#020817',
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  completePurchaseButton: {
    backgroundColor: '#00A651',
    padding: 15,
    borderRadius: 8,
  },
  completePurchaseButtonText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
});