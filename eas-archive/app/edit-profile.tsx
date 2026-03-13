import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { getCurrentUser, getUserProfile, updateUserProfile } from '../lib/auth';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { uploadAvatarImage } from '../lib/storage';

interface ValidationErrors {
  displayName?: string;
  email?: string;
  location?: string;
  bio?: string;
  phone?: string;
  photoURL?: string;
}

const PREDEFINED_HOBBIES = [
  'Reading', 'Gaming', 'Cooking', 'Traveling', 'Photography', 'Music',
  'Sports', 'Art', 'Dancing', 'Writing', 'Gardening', 'Fitness',
  'Movies', 'Technology', 'Fashion', 'Yoga', 'Hiking', 'Swimming'
];

const PREDEFINED_LOCATIONS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
  'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
  'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL'
];

export default function EditProfile() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    location: '',
    bio: '',
    phone: '',
    photoURL: '',
    hobbies: [] as string[],
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showHobbiesPicker, setShowHobbiesPicker] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setProfile({
            displayName: userProfile.displayName || '',
            email: userProfile.email || '',
            location: userProfile.location || '',
            bio: userProfile.bio || '',
            phone: userProfile.phone || '',
            photoURL: userProfile.photoURL || '',
            hobbies: userProfile.hobbies || [],
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateFields = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!profile.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!profile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!profile.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!profile.bio.trim()) {
      newErrors.bio = 'Bio is required';
    }

    if (!profile.phone.trim()) {
      newErrors.phone = 'Recovery phone is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(profile.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Only validate photo if no existing photo
    if (!profile.photoURL) {
      newErrors.photoURL = 'Profile image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      Alert.alert('Validation Error', 'Please fix the errors below');
      return;
    }

    setSaving(true);
    try {
      const user = getCurrentUser();
      if (user) {
        await updateUserProfile(user.uid, profile);
        Alert.alert('Success', 'Profile updated successfully');
        router.back();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const originalPhotoURL = profile.photoURL; // Store original URL for revert
      
      // Set a temporary local URI while uploading
      setProfile(prev => ({ ...prev, photoURL: uri }));
      
      // Clear photo error if it exists
      if (errors.photoURL) {
        setErrors(prev => ({ ...prev, photoURL: undefined }));
      }

      try {
        // Upload the image to Firebase Storage
        const user = getCurrentUser();
        if (user) {
          const response = await fetch(uri);
          const blob = await response.blob();
          
          // Upload to Firebase Storage and get the download URL
          const downloadURL = await uploadAvatarImage(blob, user.uid);
          
          // Update the profile with the Firebase Storage URL
          setProfile(prev => ({ ...prev, photoURL: downloadURL }));
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
        Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
        // Revert to original photoURL on error
        setProfile(prev => ({ ...prev, photoURL: originalPhotoURL }));
      }
    }
  };

  const handleLocationPicker = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (address[0]) {
          const locationString = `${address[0].city}, ${address[0].region}`;
          setProfile(prev => ({ ...prev, location: locationString }));
          if (errors.location) {
            setErrors(prev => ({ ...prev, location: undefined }));
          }
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setShowLocationPicker(true);
      }
    } else {
      setShowLocationPicker(true);
    }
  };



  const toggleHobby = (hobby: string) => {
    setProfile(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={require('../assets/images/icons/back-arrow.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={handleImagePicker} style={styles.imageWrapper}>
            <Image
              source={
                profile.photoURL
                  ? { uri: profile.photoURL }
                  : require('../assets/images/avatar.png')
              }
              style={styles.profileImage}
            />
            <View style={styles.imageEditIcon}>
              <Image source={require('../assets/images/icons/settings.png')} style={styles.editIcon} />
            </View>
          </TouchableOpacity>
          {errors.photoURL && <Text style={styles.errorText}>{errors.photoURL}</Text>}
        </View>

        {/* Display Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={[styles.input, errors.displayName && styles.inputError]}
            value={profile.displayName}
            onChangeText={(text) => {
              setProfile(prev => ({ ...prev, displayName: text }));
              if (errors.displayName) {
                setErrors(prev => ({ ...prev, displayName: undefined }));
              }
            }}
            placeholder="Enter your display name"
          />
          {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={profile.email}
            editable={false}
            placeholder="Email address"
          />
          <Text style={styles.helperText}>Email cannot be changed from this screen</Text>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={[styles.input, styles.inputWithIconText, errors.location && styles.inputError]}
              value={profile.location}
              onChangeText={(text) => {
                setProfile(prev => ({ ...prev, location: text }));
                if (errors.location) {
                  setErrors(prev => ({ ...prev, location: undefined }));
                }
              }}
              placeholder="Enter your location"
            />
            <TouchableOpacity onPress={handleLocationPicker} style={styles.iconButton}>
              <Image source={require('../assets/images/icons/location.png')} style={styles.inputIcon} />
            </TouchableOpacity>
          </View>
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        {/* Recovery Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recovery Phone *</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={[styles.input, styles.inputWithIconText, errors.phone && styles.inputError]}
              value={profile.phone}
              onChangeText={(text) => {
                setProfile(prev => ({ ...prev, phone: text }));
                if (errors.phone) {
                  setErrors(prev => ({ ...prev, phone: undefined }));
                }
              }}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
            <View style={styles.iconButton}>
              <Image source={require('../assets/images/icons/mobile.png')} style={styles.inputIcon} />
            </View>
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        {/* Bio */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio *</Text>
          <TextInput
            style={[styles.textArea, errors.bio && styles.inputError]}
            value={profile.bio}
            onChangeText={(text) => {
              setProfile(prev => ({ ...prev, bio: text }));
              if (errors.bio) {
                setErrors(prev => ({ ...prev, bio: undefined }));
              }
            }}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
          />
          {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
        </View>

        {/* Hobbies */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hobbies</Text>
          <TouchableOpacity onPress={() => setShowHobbiesPicker(true)} style={styles.hobbiesButton}>
            <Text style={styles.hobbiesButtonText}>
              {profile.hobbies.length > 0 ? `${profile.hobbies.length} hobbies selected` : 'Select hobbies'}
            </Text>
            <Image source={require('../assets/images/icons/tag.png')} style={styles.inputIcon} />
          </TouchableOpacity>
          
          {profile.hobbies.length > 0 && (
            <View style={styles.selectedHobbies}>
              {profile.hobbies.map((hobby, index) => (
                <View key={index} style={styles.hobbyTag}>
                  <Text style={styles.hobbyTagText}>{hobby}</Text>
                  <TouchableOpacity onPress={() => toggleHobby(hobby)}>
                    <Text style={styles.removeHobby}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal visible={showLocationPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <FlatList
              data={PREDEFINED_LOCATIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => {
                    setProfile(prev => ({ ...prev, location: item }));
                    setShowLocationPicker(false);
                    if (errors.location) {
                      setErrors(prev => ({ ...prev, location: undefined }));
                    }
                  }}
                >
                  <Text style={styles.locationItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLocationPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hobbies Picker Modal */}
      <Modal visible={showHobbiesPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Hobbies</Text>
            <FlatList
              data={PREDEFINED_HOBBIES}
              numColumns={2}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.hobbyItem,
                    profile.hobbies.includes(item) && styles.hobbyItemSelected
                  ]}
                  onPress={() => toggleHobby(item)}
                >
                  <Text style={[
                    styles.hobbyItemText,
                    profile.hobbies.includes(item) && styles.hobbyItemTextSelected
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHobbiesPicker(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#4CAF50',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  imageEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  editIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputWithIconText: {
    paddingRight: 50,
  },
  iconButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  inputIcon: {
    width: 20,
    height: 20,
    tintColor: '#666',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    height: 100,
    textAlignVertical: 'top',
  },
  hobbiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  hobbiesButtonText: {
    fontSize: 16,
    color: '#666',
  },
  selectedHobbies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  hobbyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  hobbyTagText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 6,
  },
  removeHobby: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  locationItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationItemText: {
    fontSize: 16,
  },
  hobbyItem: {
    flex: 1,
    margin: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  hobbyItemSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  hobbyItemText: {
    fontSize: 14,
    color: '#666',
  },
  hobbyItemTextSelected: {
    color: '#fff',
  },
  modalCloseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
