import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { onAuthStateChange } from '../lib/auth';
import { getFirebaseInitError, isFirebaseReady } from '../lib/firebase';
import { useToast } from './components/ToastContext';

const { width } = Dimensions.get('window');

// Arrow right icon component
const ArrowRightIcon = ({ color = "#FFFFFF" }) => (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <Path
            d="M8 1L15 8L8 15M15 8H1"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const AUTH_SESSION_FLAG = 'bazaar_has_logged_in_before';

export default function SplashScreen() {
    console.log('SplashScreen: Component initialized');

    const [fontsLoaded] = useFonts({
        'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    });
    const { showToast } = useToast();

    console.log('SplashScreen: Fonts loaded:', fontsLoaded);

    useEffect(() => {
        if (!fontsLoaded) return;
        if (!isFirebaseReady()) return;

        let handled = false;
        let unsubscribe: (() => void) | undefined;

        const checkAuth = async () => {
            try {
                const hasLoggedInBefore = await AsyncStorage.getItem(AUTH_SESSION_FLAG);

                unsubscribe = onAuthStateChange((user) => {
                    if (handled) return;
                    handled = true;

                    if (user) {
                        if (!hasLoggedInBefore) {
                            AsyncStorage.setItem(AUTH_SESSION_FLAG, '1').catch(() => { });
                        }
                        router.replace('/(tabs)');
                    } else {
                        if (hasLoggedInBefore) {
                            showToast('Session expired, please sign in again', 'info');
                        }
                        router.replace('/auth/sign-in');
                    }
                });
            } catch (error) {
                console.error('Error checking auth session:', error);
                router.replace('/auth/sign-in');
            }
        };

        checkAuth().catch(() => {
            router.replace('/auth/sign-in');
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [fontsLoaded, showToast]);

    if (!fontsLoaded) {
        console.log('SplashScreen: Fonts not loaded yet, returning null');
        return null;
    }

    if (!isFirebaseReady()) {
        const err = getFirebaseInitError();
        return (
            <View style={styles.container}>
                <View style={styles.contentContainer}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/logo/logo.png')}
                            style={styles.logo}
                        />
                        <Text style={styles.tagline}>App configuration error</Text>
                        <Text style={styles.accountText}>
                            Missing build-time environment variables. Rebuild the APK with Firebase env values configured.
                        </Text>
                        {!!err?.message && (
                            <Text style={styles.accountText}>
                                {err.message}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    console.log('SplashScreen: Rendering splash screen');

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/images/logo/logo.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.tagline}>Sell & Buy in Minutes</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/auth/sign-up')}
                    >
                        <Text style={styles.buttonText}>Let&apos;s get started</Text>
                    </TouchableOpacity>

                    <View style={styles.accountContainer}>
                        <Text style={styles.accountText}>I already have an account</Text>
                        <TouchableOpacity
                            style={styles.arrowCircle}
                            onPress={() => router.push('/auth/sign-in')}
                        >
                            <ArrowRightIcon color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
    },
    contentContainer: {
        width: width - 54,
        position: 'absolute',
        left: 27,
        top: '22%',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 220,
    },
    logoContainer: {
        width: 400,
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
    },
    tagline: {
        fontFamily: 'Poppins-Bold',
        fontSize: 24,
        textAlign: 'center',
        color: '#1F2937',
        marginBottom: 60,
        marginTop: -40, // Negative margin to pull the tagline up closer to the logo
    },
    buttonContainer: {
        width: '100%',
        gap: 10,
        marginTop: 20, // Add extra space from the top
    },
    button: {
        height: 62,
        backgroundColor: '#16A34A',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    buttonText: {
        fontSize: 22,
        color: '#F3F3F3',
        textAlign: 'center',
    },
    accountContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
    },
    accountText: {
        fontSize: 15,
        color: '#202020',
        opacity: 0.9,
        marginRight: 10,
    },
    arrowCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#16A34A',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    arrowText: {
        color: '#FFFFFF',
        fontSize: 18,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',

    },
});
