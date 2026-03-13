import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Keyboard, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { sendPasswordResetEmail } from '../../lib/auth';
import { auth } from '../../lib/firebase';
import { validateForgotPasswordForm, ValidationError } from '../../lib/validation';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: ValidationError }>({});

    const handleResetPassword = async () => {
        // Clear previous errors
        setErrors({});
        
        // Validate form
        const validation = validateForgotPasswordForm(email);
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
            await sendPasswordResetEmail(auth, email);
            setEmailSent(true);
            Alert.alert(
                'Reset Email Sent',
                'Check your email for password reset instructions.',
                [
                    { text: 'OK', onPress: () => router.back() }
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <Image
                    source={require('../../assets/images/logo/logo.png')}
                    style={styles.logo}
                />
                <ThemedText style={styles.title}>Reset Password</ThemedText>
                <ThemedText style={styles.subtitle}>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </ThemedText>

                {!emailSent && (
                    <>
                        <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>Email</ThemedText>
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
                </View>

                        <TouchableOpacity 
                    style={[styles.resetButton, loading && styles.disabledButton]} 
                    onPress={handleResetPassword}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <LoadingSpinner size={20} color="#FFFFFF" />
                            <ThemedText style={[styles.resetButtonText, styles.loadingText]}>Sending...</ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={styles.resetButtonText}>Send Reset Email</ThemedText>
                    )}
                </TouchableOpacity>
                    </>
                )}

                {emailSent && (
                    <View style={styles.successContainer}>
                        <ThemedText style={styles.successText}>
                            ✅ Reset email sent successfully!
                        </ThemedText>
                        <ThemedText style={styles.successSubtext}>
                            Check your email and follow the instructions to reset your password.
                        </ThemedText>
                    </View>
                )}

                <View style={styles.backContainer}>
                    <ThemedText style={styles.backText}>Remember your password? </ThemedText>
                    <Link href="/auth/sign-in" asChild>
                        <TouchableOpacity>
                            <ThemedText style={styles.linkText}>Sign In</ThemedText>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    logo: {
        width: 180,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: '#000000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6C6C6C',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 24,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        color: '#000000',
        marginBottom: 8,
        fontFamily: 'Poppins-Medium',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000000',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    resetButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#00A651',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
    },
    disabledButton: {
        opacity: 0.6,
    },
    inputError: {
        borderColor: '#FF4444',
        borderWidth: 1,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginLeft: 8,
    },
    successContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 40,
    },
    successText: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        color: '#00A651',
        marginBottom: 12,
        textAlign: 'center',
    },
    successSubtext: {
        fontSize: 14,
        color: '#6C6C6C',
        textAlign: 'center',
        lineHeight: 20,
    },
    backContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 40,
    },
    backText: {
        color: '#6C6C6C',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    linkText: {
        color: '#00A651',
        fontFamily: 'Poppins-Bold',
        fontSize: 14,
        marginLeft: 4,
    },
});