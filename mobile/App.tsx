import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Simple test app to verify basic rendering works
export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App mounted - testing basic render');
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#84cc16" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>FormUp Mobile</Text>
      <Text style={styles.text}>App is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: '#84cc16',
    fontSize: 24,
    fontWeight: 'bold',
  },
  text: {
    color: '#fafafa',
    fontSize: 16,
  },
});
