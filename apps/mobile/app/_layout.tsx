import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../src/session/AppContext';
import { colors } from '../src/ui/theme';

const CompatibleStack = Stack as unknown as React.ComponentType<any>;
export default function RootLayout() {
  return <AppProvider><StatusBar style="dark" /><CompatibleStack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.ink, contentStyle: { backgroundColor: colors.background } }} /></AppProvider>;
}
