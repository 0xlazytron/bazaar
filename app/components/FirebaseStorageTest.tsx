import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { testStorageConnectivity, validateStorageUrl } from '../../lib/storage';

export const FirebaseStorageTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = useCallback(async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🧪 Starting Firebase Storage tests...');
      
      // Test 1: Storage connectivity
      addResult('Testing storage connectivity...');
      const isConnected = await testStorageConnectivity();
      addResult(isConnected ? '✅ Storage connectivity: PASS' : '❌ Storage connectivity: FAIL');
      
      // Test 2: URL validation
      const testUrls = [
        'https://firebasestorage.googleapis.com/v0/b/bazaar-b558d.appspot.com/o/listings%2F1759182418933?alt=media&token=test',
        'https://firebasestorage.googleapis.com/v0/b/bazaar-b558d.firebasestorage.app/o/listings%2F1759182418933?alt=media&token=test'
      ];
      
      testUrls.forEach((url, index) => {
        const isValid = validateStorageUrl(url);
        addResult(`${isValid ? '✅' : '❌'} URL ${index + 1} validation: ${isValid ? 'PASS' : 'FAIL'}`);
      });
      
      addResult('🏁 Tests completed');
    } catch (error) {
      addResult(`❌ Test error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    runTests();
  }, [runTests]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Storage Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={runTests}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Running Tests...' : 'Run Tests'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 6,
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});