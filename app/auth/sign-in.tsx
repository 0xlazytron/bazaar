import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Image, Keyboard, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';

export default function SignIn() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = () => {
        // Add your sign-in logic here
        // For now, we'll just navigate to the home screen
        router.replace('/(tabs)');
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
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>Password</ThemedText>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="••••••••"
                            style={[styles.input, styles.passwordInput]}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor="#A0A0A0"
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <ThemedText>{showPassword ? '👁️' : '👁️'}</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.forgotPasswordContainer}>
                    <ThemedText style={styles.forgotPassword}>Forgot password?</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                    <ThemedText style={styles.signInButtonText}>Sign in</ThemedText>
                </TouchableOpacity>

                <View style={styles.orContainer}>
                    <View style={styles.orLine} />
                    <ThemedText style={styles.orText}>or</ThemedText>
                    <View style={styles.orLine} />
                </View>

                <TouchableOpacity style={styles.googleButton}>
                    <Image
                        source={require('../../assets/images/google.png')}
                        style={styles.googleIcon}
                    />
                    <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
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
    }
});