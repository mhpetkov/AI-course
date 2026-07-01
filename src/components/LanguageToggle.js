import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('common.language')}</Text>
      <Pressable
        style={styles.button}
        onPress={toggleLanguage}
        accessibilityRole="button"
        accessibilityLabel={language === 'en' ? t('common.english') : t('common.bulgarian')}
        testID="language-toggle-button"
      >
        <Text style={styles.buttonText}>{language === 'en' ? t('common.english') : t('common.bulgarian')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  buttonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
