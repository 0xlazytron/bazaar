import { Link } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

export default function SignUp() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.container}>
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
                        style={styles.input}
                        autoCapitalize="words"
                        placeholderTextColor="#A0A0A0"
                    />

                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        placeholder="your@email.com"
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#A0A0A0"
                    />

                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="•••••••"
                            style={styles.passwordInput}
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

                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="•••••••"
                            style={styles.passwordInput}
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
                </View>

                <Text style={styles.termsText}>
                    By signing up, you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>.
                </Text>

                <TouchableOpacity style={styles.createButton}>
                    <Text style={styles.createButtonText}>Create account</Text>
                </TouchableOpacity>

                <View style={styles.orContainer}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>or</Text>
                    <View style={styles.orLine} />
                </View>

                <TouchableOpacity style={styles.googleButton}>
                    <Image
                        source={require('../../assets/images/google.png')}
                        style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.signInContainer}>
                    <Text style={styles.accountText}>Already have an account? </Text>
                    <Link href="/auth/sign-in" asChild>
                        <TouchableOpacity>
                            <Text style={styles.signInLink}>Sign in</Text>
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
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingTop: 50,
    },
    logo: {
        width: 180,
        height: 100,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 2,
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
        marginBottom: 32,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 24,
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
        marginBottom: 24,
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
        marginBottom: 24,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        marginBottom: 24,
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
});