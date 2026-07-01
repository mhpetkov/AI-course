import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from './src/context/LanguageContext';
import EnvironmentCompareScreen from './src/screens/EnvironmentCompareScreen';

export default function App() {
  return (
    <LanguageProvider>
      <EnvironmentCompareScreen />
      <StatusBar style="auto" />
    </LanguageProvider>
  );
}
