import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Keyboard,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { signInWithGoogle, signUpWithEmail } from '../../lib/auth';
import { validateSignUpForm, ValidationError } from '../../lib/validation';

const { height } = Dimensions.get('window');

export default function SignUp() {
    console.log('SignUpScreen: Component initialized');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: ValidationError }>({});
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const handleSignUp = async () => {
        // Clear previous errors
        setErrors({});

        // Validate form
        const validation = validateSignUpForm(fullName, email, password, confirmPassword);
        if (!validation.isValid) {
            const errorMap: { [key: string]: ValidationError } = {};
            validation.errors.forEach(error => {
                errorMap[error.field] = error;
            });
            setErrors(errorMap);
            return;
        }

        setLoading(true);
        try {
            await signUpWithEmail(email, password, fullName);
            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Google Sign Up Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Image
                    source={require('../../assets/images/logo/logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>Create an account</Text>
                <Text style={styles.subtitle}>Sign up to start buying and selling</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        placeholder="John Doe"
                        style={[styles.input, errors.fullName && styles.inputError]}
                        autoCapitalize="words"
                        placeholderTextColor="#A0A0A0"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                    <ErrorMessage error={errors.fullName} />

                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        placeholder="your@email.com"
                        style={[styles.input, errors.email && styles.inputError]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#A0A0A0"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <ErrorMessage error={errors.email} />

                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="•••••••"
                            style={[styles.passwordInput, errors.password && styles.inputError]}
                            secureTextEntry={!showPassword}
                            placeholderTextColor="#A0A0A0"
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                    </View>
                    <ErrorMessage error={errors.password} />

                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="•••••••"
                            style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                            secureTextEntry={!showConfirmPassword}
                            placeholderTextColor="#A0A0A0"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Text>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                    </View>
                    <ErrorMessage error={errors.confirmPassword} />
                </View>

                <Text style={styles.termsText}>
                    By signing up, you agree to our{' '}
                    <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>Terms of Service</Text> and{' '}
                    <Text style={styles.termsLink} onPress={() => setShowPrivacyModal(true)}>Privacy Policy</Text>.
                </Text>

                <TouchableOpacity
                    style={[styles.createButton, loading && styles.disabledButton]}
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    {loading ? (
                        <LoadingSpinner color="#FFFFFF" />
                    ) : (
                        <Text style={styles.createButtonText}>Create account</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.orContainer}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>or</Text>
                    <View style={styles.orLine} />
                </View>

                <TouchableOpacity
                    style={[styles.googleButton, loading && styles.disabledButton]}
                    onPress={handleGoogleSignUp}
                    disabled={loading}
                >
                    <Image
                        source={require('../../assets/images/google.png')}
                        style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>
                        {loading ? 'Signing up...' : 'Continue with Google'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.signInContainer}>
                    <Text style={styles.accountText}>Already have an account? </Text>
                    <Link href="/auth/sign-in" asChild>
                        <TouchableOpacity>
                            <Text style={styles.signInLink}>Sign in</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                <Modal
                    visible={showTermsModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowTermsModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Image
                                source={require('../../assets/images/logo/logo.png')}
                                style={styles.modalLogo}
                            />
                            <View style={styles.modalHeader}>
                                <Ionicons
                                    name="shield-checkmark"
                                    size={22}
                                    color="#00A651"
                                    style={styles.modalIcon}
                                />
                                <Text style={styles.modalTitle}>Terms of Service</Text>
                            </View>
                            <Text style={styles.modalSubtitle}>
                                A quick, friendly summary of what you are agreeing to.
                            </Text>
                            <ScrollView style={styles.modalScroll}>
                                <View style={styles.modalHighlight}>
                                    <Text style={styles.modalHighlightTitle}>How Bazaar works</Text>
                                    <Text style={styles.modalText}>
                                        Bazaar is a community marketplace that connects buyers and sellers for local, second-hand and new items.
                                    </Text>
                                </View>
                                <View style={styles.modalList}>
                                    <Text style={styles.modalListItem}>• Use Bazaar only for lawful purposes.</Text>
                                    <Text style={styles.modalListItem}>• Be respectful and honest in your listings and chats.</Text>
                                    <Text style={styles.modalListItem}>• Only list items you have the right to sell.</Text>
                                </View>
                                <View style={styles.modalHighlight}>
                                    <Text style={styles.modalHighlightTitle}>Your responsibilities</Text>
                                    <Text style={styles.modalText}>
                                        Listings, messages and transactions are created by users. Bazaar does not guarantee the quality, safety or legality of any items.
                                    </Text>
                                    <Text style={styles.modalText}>
                                        Bazaar may suspend or terminate accounts that violate these terms or abuse the platform.
                                    </Text>
                                </View>
                                <Text style={styles.modalFooterText}>
                                    By continuing, you accept these terms and any future updates that help keep the marketplace safe.
                                </Text>
                            </ScrollView>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setShowTermsModal(false)}
                            >
                                <Text style={styles.modalButtonText}>I understand</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={showPrivacyModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowPrivacyModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Image
                                source={require('../../assets/images/logo/logo.png')}
                                style={styles.modalLogo}
                            />
                            <View style={styles.modalHeader}>
                                <Ionicons
                                    name="lock-closed"
                                    size={22}
                                    color="#00A651"
                                    style={styles.modalIcon}
                                />
                                <Text style={styles.modalTitle}>Privacy Policy</Text>
                            </View>
                            <Text style={styles.modalSubtitle}>
                                See how your information is used to keep Bazaar running.
                            </Text>
                            <ScrollView style={styles.modalScroll}>
                                <View style={styles.modalHighlight}>
                                    <Text style={styles.modalHighlightTitle}>What we collect</Text>
                                    <Text style={styles.modalText}>
                                        We collect basic details like your name, email and in-app activity so we can create your account and run the marketplace.
                                    </Text>
                                </View>
                                <View style={styles.modalHighlight}>
                                    <Text style={styles.modalHighlightTitle}>How we use it</Text>
                                    <Text style={styles.modalText}>
                                        Your data is stored securely with Firebase and used to operate Bazaar, send important notifications and improve your experience.
                                    </Text>
                                </View>
                                <View style={styles.modalList}>
                                    <Text style={styles.modalListItem}>• We do not sell your personal data.</Text>
                                    <Text style={styles.modalListItem}>• We limit access to your data to what is needed.</Text>
                                    <Text style={styles.modalListItem}>• You can request deletion of your account and data.</Text>
                                </View>
                                <Text style={styles.modalFooterText}>
                                    This is a friendly overview. If you have questions or need full details, contact support and we will be happy to help.
                                </Text>
                            </ScrollView>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setShowPrivacyModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Got it</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 30,
    },
    logo: {
        width: '40%', // Changed from fixed 150px to 40% of screen width
        height: height * 0.06, // Reduced from 0.08 to 0.06
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 10, // Added a smaller bottom margin
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        height: 48,
        justifyContent: 'center',
    },
    inputLabel: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
    },
    termsText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 20,
    },
    termsLink: {
        color: '#00A651',
    },
    createButton: {
        backgroundColor: '#00A651',
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10, // Reduced from 20 to 10
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 10, // Reduced from 16 to 10
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    orText: {
        marginHorizontal: 12,
        color: '#A0A0A0',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        marginBottom: 20,
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 16,
        color: '#333333',
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    accountText: {
        fontSize: 14,
        color: '#666666',
    },
    signInLink: {
        fontSize: 14,
        color: '#00A651',
        fontWeight: '500',
    },
    disabledButton: {
        opacity: 0.6,
    },
    inputError: {
        borderColor: '#FF6B6B',
        borderWidth: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'stretch',
    },
    modalLogo: {
        width: 40,
        height: 40,
        alignSelf: 'center',
        marginBottom: 8,
        resizeMode: 'contain',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    modalIcon: {
        marginRight: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalScroll: {
        marginBottom: 16,
    },
    modalText: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 8,
        lineHeight: 20,
    },
    modalButton: {
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: '#00A651',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    modalHighlight: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#F0FDF4',
        marginBottom: 12,
    },
    modalHighlightTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#047857',
        marginBottom: 4,
    },
    modalList: {
        marginBottom: 12,
    },
    modalListItem: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
        lineHeight: 20,
    },
    modalFooterText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 4,
    },
});
