import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Keyboard, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { signInWithEmail, signInWithGoogle, isGoogleSignInAvailable } from '../../lib/auth';
import { validateSignInForm, ValidationError } from '../../lib/validation';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: ValidationError }>({});

    const handleSignIn = async () => {
        // Clear previous errors
        setErrors({});
        
        // Validate form
        const validation = validateSignInForm(email, password);
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
            await signInWithEmail(email, password);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Sign In Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            // Check if Google Sign-In is available
            const isAvailable = await isGoogleSignInAvailable();
            if (!isAvailable) {
                Alert.alert(
                    'Google Sign-In Unavailable',
                    'Google Sign-In is not available on this device. Please use email sign-in or update Google Play Services.'
                );
                return;
            }
            
            await signInWithGoogle();
            router.replace('/(tabs)');
        } catch (error: any) {
            let errorMessage = error.message;
            
            // Provide user-friendly error messages
            if (errorMessage.includes('cancelled')) {
                return; // Don't show error for cancelled sign-in
            } else if (errorMessage.includes('Play Services')) {
                errorMessage = 'Please update Google Play Services and try again.';
            } else if (errorMessage.includes('not implemented')) {
                errorMessage = 'Google Sign-In is not available on this device. Please use email sign-in.';
            }
            
            Alert.alert('Google Sign In Failed', errorMessage);
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
                <ThemedText style={styles.title}>Welcome Back</ThemedText>
                <ThemedText style={styles.subtitle}>Sign In to start buying and selling</ThemedText>

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

                <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>Password</ThemedText>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="••••••••"
                            style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor="#A0A0A0"
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <ThemedText>{showPassword ? '👁️‍🗨️' : '👁️'}</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <ErrorMessage error={errors.password} />
                </View>

                <Link href="/auth/forgot-password" asChild>
                    <TouchableOpacity style={styles.forgotPasswordContainer}>
                        <ThemedText style={styles.forgotPassword}>Forgot password?</ThemedText>
                    </TouchableOpacity>
                </Link>

                <TouchableOpacity 
                    style={[styles.signInButton, loading && styles.disabledButton]} 
                    onPress={handleSignIn}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <LoadingSpinner size={20} color="#FFFFFF" />
                            <ThemedText style={[styles.signInButtonText, styles.loadingText]}>Signing in...</ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={styles.signInButtonText}>Sign in</ThemedText>
                    )}
                </TouchableOpacity>

                <View style={styles.orContainer}>
                    <View style={styles.orLine} />
                    <ThemedText style={styles.orText}>or</ThemedText>
                    <View style={styles.orLine} />
                </View>

                <TouchableOpacity 
                    style={[styles.googleButton, loading && styles.disabledButton]} 
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                >
                    <Image
                        source={require('../../assets/images/google.png')}
                        style={styles.googleIcon}
                    />
                    <ThemedText style={styles.googleButtonText}>
                        {loading ? 'Signing in...' : 'Continue with Google'}
                    </ThemedText>
                </TouchableOpacity>

                <View style={styles.signUpContainer}>
                    <ThemedText style={styles.accountText}>Don&apos;t have an account? </ThemedText>
                    <Link href="/auth/sign-up" asChild>
                        <TouchableOpacity>
                            <ThemedText style={styles.linkText}>Sign Up</ThemedText>
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
    },
    inputContainer: {
        width: '100%',
        marginBottom: 16,
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
    passwordContainer: {
        position: 'relative',
        width: '100%',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 12,
        padding: 4,
    },
    forgotPasswordContainer: {
        width: '100%',
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    forgotPassword: {
        color: '#00A651',
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
    },
    signInButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#00A651',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    signInButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 20,
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
        width: '100%',
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        marginBottom: 30,
    },
    googleIcon: {
        width: 22,
        height: 22,
        marginRight: 12,
    },
    googleButtonText: {
        color: '#000000',
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
    },
    signUpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 40,
    },
    accountText: {
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
});