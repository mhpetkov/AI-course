import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { compareEnvironmentRecords, parseRecordExport } from '../features/environmentComparison/comparisonUtils';

const DEFAULT_MAIN_RECORDS = JSON.stringify(
  [
    { id: '1001', application: 'MainApp.Records', lastModified: '2026-06-01' },
    { id: '1002', application: 'MainApp.Records', lastModified: '2026-06-02' },
    { id: '1003', application: 'MainApp.Records', lastModified: '2026-06-03' },
  ],
  null,
  2
);

const DEFAULT_NEW_RECORDS = JSON.stringify(
  [
    { id: '1001', application: 'NewApp.Records', lastModified: '2026-06-01' },
    { id: '1002', application: 'NewApp.Records', lastModified: '2026-06-05' },
    { id: '1003', application: 'NewApp.Records', lastModified: '2026-06-03' },
  ],
  null,
  2
);

function padTimestampValue(value) {
  return String(value).padStart(2, '0');
}

function createExportTimestamp(date = new Date()) {
  return [
    date.getFullYear(),
    padTimestampValue(date.getMonth() + 1),
    padTimestampValue(date.getDate()),
  ].join('-') + `_${padTimestampValue(date.getHours())}-${padTimestampValue(date.getMinutes())}-${padTimestampValue(date.getSeconds())}`;
}

function sanitizeFileNamePart(value) {
  return String(value || 'extract')
    .trim()
    .replace(/[<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createEmptyEnvironmentFields(isMain) {
  return {
    url: isMain ? 'https://main.example.com' : 'https://new.example.com',
    username: isMain ? 'main.user' : 'new.user',
    password: '',
    tableName: isMain ? 'MainApp.Records' : 'NewApp.Records',
    recordsJson: isMain ? DEFAULT_MAIN_RECORDS : DEFAULT_NEW_RECORDS,
  };
}

function EnvironmentFieldGroup({ title, fields, onChange, labels, placeholder }) {
  return (
    <View style={styles.environmentCard}>
      <Text style={styles.environmentTitle}>{title}</Text>

      <Text style={styles.fieldLabel}>{labels.urlLabel}</Text>
      <TextInput
        value={fields.url}
        onChangeText={(value) => onChange('url', value)}
        placeholder={labels.urlPlaceholder}
        style={styles.input}
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
      />

      <Text style={styles.fieldLabel}>{labels.usernameLabel}</Text>
      <TextInput
        value={fields.username}
        onChangeText={(value) => onChange('username', value)}
        placeholder={labels.usernamePlaceholder}
        style={styles.input}
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
      />

      <Text style={styles.fieldLabel}>{labels.passwordLabel}</Text>
      <TextInput
        value={fields.password}
        onChangeText={(value) => onChange('password', value)}
        placeholder={labels.passwordPlaceholder}
        style={styles.input}
        placeholderTextColor="#94A3B8"
        secureTextEntry
        autoCapitalize="none"
      />

      <Text style={styles.fieldLabel}>{labels.tableLabel}</Text>
      <TextInput
        value={fields.tableName}
        onChangeText={(value) => onChange('tableName', value)}
        placeholder={labels.tablePlaceholder}
        style={styles.input}
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
      />

      <Text style={styles.fieldLabel}>{labels.recordInputLabel}</Text>
      <TextInput
        value={fields.recordsJson}
        onChangeText={(value) => onChange('recordsJson', value)}
        placeholder={placeholder}
        style={styles.textArea}
        placeholderTextColor="#94A3B8"
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

export default function EnvironmentCompareScreen() {
  const { t } = useLanguage();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [mainEnvironment, setMainEnvironment] = useState(() => createEmptyEnvironmentFields(true));
  const [newEnvironment, setNewEnvironment] = useState(() => createEmptyEnvironmentFields(false));
  const [comparisonResult, setComparisonResult] = useState(null);
  const [extractedSection, setExtractedSection] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const labels = useMemo(
    () => ({
      urlLabel: t('compare.urlLabel'),
      usernameLabel: t('compare.usernameLabel'),
      passwordLabel: t('compare.passwordLabel'),
      tableLabel: t('compare.tableLabel'),
      recordInputLabel: t('compare.recordInputLabel'),
      urlPlaceholder: 'https://example.com',
      usernamePlaceholder: 'user.name',
      passwordPlaceholder: '••••••••',
      tablePlaceholder: 'Application.Table',
    }),
    [t]
  );

  const isFormComplete = useMemo(() => {
    const requiredFields = [
      mainEnvironment.url,
      mainEnvironment.username,
      mainEnvironment.tableName,
      mainEnvironment.recordsJson,
      newEnvironment.url,
      newEnvironment.username,
      newEnvironment.tableName,
      newEnvironment.recordsJson,
    ];

    return requiredFields.every((value) => String(value).trim().length > 0);
  }, [mainEnvironment, newEnvironment]);

  const updateMainField = (field, value) => {
    setMainEnvironment((prev) => ({ ...prev, [field]: value }));
  };

  const updateNewField = (field, value) => {
    setNewEnvironment((prev) => ({ ...prev, [field]: value }));
  };

  const resultSections = useMemo(() => {
    if (!comparisonResult) {
      return [];
    }

    return [
      {
        key: 'mainDocument',
        title: t('compare.outputMain'),
        fileName: t('compare.outputMain'),
        hint: t('compare.documentHint'),
        content: comparisonResult.mainDocument,
      },
      {
        key: 'newDocument',
        title: t('compare.outputTarget'),
        fileName: t('compare.outputTarget'),
        hint: t('compare.documentHint'),
        content: comparisonResult.newDocument,
      },
      {
        key: 'blackListFile',
        title: t('compare.blackListTitle'),
        fileName: t('compare.blackListTitle'),
        hint: t('compare.mismatchCount', { count: comparisonResult.mismatches.length }),
        content: comparisonResult.blackListFile,
      },
    ];
  }, [comparisonResult, t]);

  const downloadTextDocument = (fileName, content) => {
    const normalizedFileName = sanitizeFileNamePart(fileName) || 'extract';
    const safeFileName = `${normalizedFileName}_${createExportTimestamp()}.txt`;

    if (Platform.OS !== 'web') {
      throw new Error('File download is only available on web.');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = downloadUrl;
    anchor.download = safeFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleRunComparison = () => {
    if (!isFormComplete) {
      setErrorMessage(t('compare.requiredField'));
      return;
    }

    try {
      const mainRecords = parseRecordExport(mainEnvironment.recordsJson);
      const newRecords = parseRecordExport(newEnvironment.recordsJson);

      const result = compareEnvironmentRecords({
        mainEnvironment,
        newEnvironment,
        mainRecords,
        newRecords,
      });

      setComparisonResult(result);
      setExtractedSection('');
      setErrorMessage('');
      setDialogVisible(false);
    } catch (error) {
      setComparisonResult(null);
      setExtractedSection('');
      setErrorMessage(error instanceof Error ? error.message : t('compare.invalidJson'));
    }
  };

  const handleExtractResult = async (sectionKey, fileName, content) => {
    try {
      downloadTextDocument(fileName, content);

      setExtractedSection(sectionKey);
      setErrorMessage('');
    } catch {
      setExtractedSection('');
      setErrorMessage(t('compare.extractError'));
    }
  };

  const handleClearResults = () => {
    setComparisonResult(null);
    setExtractedSection('');
    setErrorMessage('');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <LanguageToggle />

        <View style={styles.hero}>
          <Text style={styles.title}>{t('compare.title')}</Text>
          <Text style={styles.subtitle}>{t('compare.subtitle')}</Text>
          <View style={styles.heroActions}>
            <Pressable
              style={styles.primaryButton}
              accessibilityRole="button"
              accessibilityLabel={t('compare.runButton')}
              testID="run-comparison-button"
              onPress={() => {
                if (isFormComplete) {
                  handleRunComparison();
                  return;
                }

                setDialogVisible(true);
              }}
            >
              <Text style={styles.primaryButtonText}>{t('compare.runButton')}</Text>
            </Pressable>

            <Pressable
              style={styles.heroSecondaryButton}
              accessibilityRole="button"
              accessibilityLabel={t('compare.editInputsButton')}
              testID="edit-inputs-button"
              onPress={() => setDialogVisible(true)}
            >
              <Text style={styles.heroSecondaryButtonText}>{t('compare.editInputsButton')}</Text>
            </Pressable>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('compare.sourceLabel')}</Text>
            <Text style={styles.summaryValue}>{mainEnvironment.url}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('compare.targetLabel')}</Text>
            <Text style={styles.summaryValue}>{newEnvironment.url}</Text>
          </View>
        </View>

        {comparisonResult ? (
          <View style={styles.resultsStack}>
            <View style={styles.summaryHighlightCard}>
              <Text style={styles.summaryHighlightLabel}>{t('compare.mismatchSummary', { count: comparisonResult.mismatches.length })}</Text>
              <Text style={styles.summaryHighlightValue}>
                {comparisonResult.mismatches.length}
              </Text>
            </View>

            {resultSections.map((section) => (
              <View key={section.key} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultHeaderText}>
                    <Text style={styles.resultTitle}>{section.title}</Text>
                    <Text style={styles.resultHint}>{section.hint}</Text>
                  </View>

                  <Pressable
                    style={[
                      styles.extractButton,
                      extractedSection === section.key ? styles.extractButtonActive : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('compare.extractButton')} ${section.title}`}
                    testID={`extract-button-${section.key}`}
                    onPress={() => {
                      void handleExtractResult(section.key, section.fileName, section.content);
                    }}
                  >
                    <Text style={styles.extractButtonText}>
                      {extractedSection === section.key
                        ? t('compare.extractSuccess')
                        : t('compare.extractButton')}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.documentBlock}>{section.content}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('compare.emptyOutput')}</Text>
          </View>
        )}

        <Pressable
          style={styles.secondaryButton}
          onPress={handleClearResults}
          accessibilityRole="button"
          accessibilityLabel={t('compare.clearButton')}
          testID="clear-results-button"
        >
          <Text style={styles.secondaryButtonText}>{t('compare.clearButton')}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={() => setDialogVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('compare.modalTitle')}</Text>
                <Pressable
                  onPress={() => setDialogVisible(false)}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close comparison inputs"
                  testID="close-dialog-button"
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>{t('compare.subtitle')}</Text>

              <EnvironmentFieldGroup
                title={t('compare.sourceLabel')}
                fields={mainEnvironment}
                onChange={updateMainField}
                labels={labels}
                placeholder={t('compare.recordInputPlaceholder')}
              />

              <EnvironmentFieldGroup
                title={t('compare.targetLabel')}
                fields={newEnvironment}
                onChange={updateNewField}
                labels={labels}
                placeholder={t('compare.recordInputPlaceholder')}
              />

              <Pressable
                style={styles.primaryButton}
                onPress={handleRunComparison}
                disabled={!isFormComplete}
                accessibilityRole="button"
                accessibilityLabel={t('compare.runButton')}
                testID="run-comparison-dialog-button"
              >
                <Text style={styles.primaryButtonText}>{t('compare.runButton')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
    gap: 14,
    paddingBottom: 120,
  },
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 18,
    gap: 10,
  },
  heroActions: {
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#CBD5E1',
  },
  primaryButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroSecondaryButton: {
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  heroSecondaryButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 14,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  resultsStack: {
    gap: 12,
  },
  summaryHighlightCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  summaryHighlightLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryHighlightValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    borderRadius: 14,
    gap: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  resultHeaderText: {
    flex: 1,
    gap: 6,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultHint: {
    fontSize: 12,
    color: '#64748B',
  },
  extractButton: {
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  extractButtonActive: {
    backgroundColor: '#DCFCE7',
  },
  extractButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0C4A6E',
  },
  documentBlock: {
    fontSize: 12,
    lineHeight: 18,
    color: '#0F172A',
    fontFamily: 'Courier New',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    borderRadius: 14,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748B',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },
  environmentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 8,
  },
  environmentTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
  },
  textArea: {
    minHeight: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 13,
  },
});
