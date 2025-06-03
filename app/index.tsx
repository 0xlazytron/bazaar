import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const [fontsLoaded] = useFonts({
        'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/auth/sign-up');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    if (!fontsLoaded) {
        return null;
    }

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
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Let&apos;s get started</Text>
                    </TouchableOpacity>

                    <View style={styles.accountContainer}>
                        <Text style={styles.accountText}>I already have an account</Text>
                        <View style={styles.arrowCircle}>
                            <Text style={styles.arrowText}>→</Text>
                        </View>
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
    },
    arrowText: {
        color: '#FFFFFF',
        fontSize: 18,
    },
});