import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#0F172A' }}>
        <Text style={{ fontSize: 20, fontFamily: 'DMSans_700Bold', color: '#F1F5F9' }}>
          This screen doesn't exist.
        </Text>
        <Link href="/" style={{ marginTop: 15, paddingVertical: 15 }}>
          <Text style={{ fontSize: 14, color: '#2596be', fontFamily: 'DMSans_500Medium' }}>
            Go to home screen
          </Text>
        </Link>
      </View>
    </>
  );
}
