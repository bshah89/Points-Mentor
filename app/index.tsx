import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6366F1" size="large" />
      </View>
    );
  }

  // If Supabase is not configured or user is signed in, go to main app
  if (!isConfigured || session) {
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}
