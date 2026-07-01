function normalizeDateValue(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function normalizeRecordsPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.records)) {
    return payload.records;
  }

  return [];
}

export function parseRecordExport(rawText) {
  const text = String(rawText || '').trim();
  if (!text) {
    return [];
  }

  const parsed = JSON.parse(text);
  const records = normalizeRecordsPayload(parsed);

  return records.map((record) => {
    const id = String(record?.id ?? record?.ID ?? '').trim();
    const application = String(record?.application ?? record?.tableName ?? record?.app ?? '').trim();
    const lastModified = String(
      record?.lastModified ?? record?.lastModifiedDate ?? record?.updatedAt ?? record?.modifiedAt ?? ''
    ).trim();

    if (!id) {
      throw new Error('Record is missing an ID.');
    }

    const normalizedDate = normalizeDateValue(lastModified);
    if (!normalizedDate) {
      throw new Error(`Record ${id} has an invalid last-modified date.`);
    }

    return {
      id,
      application: application || '-',
      lastModified: normalizedDate,
    };
  });
}

function buildDocumentLines(title, metadata, records) {
  const lines = [title];

  if (metadata.environmentLabel) {
    lines.push(`Environment: ${metadata.environmentLabel}`);
  }
  if (metadata.url) {
    lines.push(`URL: ${metadata.url}`);
  }
  if (metadata.username) {
    lines.push(`Username: ${metadata.username}`);
  }
  if (metadata.tableName) {
    lines.push(`Application/table: ${metadata.tableName}`);
  }

  lines.push('');
  lines.push('ID | Application | Last modified');

  records.forEach((record) => {
    lines.push(`${record.id} | ${record.application} | ${record.lastModified}`);
  });

  return lines.join('\n');
}

export function compareEnvironmentRecords({
  mainEnvironment,
  newEnvironment,
  mainRecords,
  newRecords,
}) {
  const mainMap = new Map(mainRecords.map((record) => [record.id, record]));
  const newMap = new Map(newRecords.map((record) => [record.id, record]));
  const allIds = Array.from(new Set([...mainRecords.map((record) => record.id), ...newRecords.map((record) => record.id)])).sort(
    (left, right) => left.localeCompare(right, undefined, { numeric: true })
  );

  const mismatches = [];

  allIds.forEach((id) => {
    const mainRecord = mainMap.get(id);
    const newRecord = newMap.get(id);

    if (!mainRecord || !newRecord || mainRecord.lastModified !== newRecord.lastModified) {
      mismatches.push({
        id,
        mainApplication: mainRecord?.application || mainEnvironment.tableName || '-',
        newApplication: newRecord?.application || newEnvironment.tableName || '-',
        mainLastModified: mainRecord?.lastModified || '',
        newLastModified: newRecord?.lastModified || '',
        reason: !mainRecord
          ? 'Missing in main environment'
          : !newRecord
            ? 'Missing in new environment'
            : 'Different last-modified date',
      });
    }
  });

  const mainDocument = buildDocumentLines('Generated document', {
    environmentLabel: 'Main environment',
    url: mainEnvironment.url,
    username: mainEnvironment.username,
    tableName: mainEnvironment.tableName,
  }, mainRecords);

  const newDocument = buildDocumentLines('Generated document', {
    environmentLabel: 'New environment',
    url: newEnvironment.url,
    username: newEnvironment.username,
    tableName: newEnvironment.tableName,
  }, newRecords);

  const blackListLines = ['Black listed file', 'IDs with different dates from the main environment'];

  if (mismatches.length === 0) {
    blackListLines.push('No differences found.');
  } else {
    mismatches.forEach((entry) => {
      blackListLines.push(
        `${entry.id} | main app: ${entry.mainApplication} | main date: ${entry.mainLastModified || '-'} | new app: ${entry.newApplication} | new date: ${entry.newLastModified || '-'} | ${entry.reason}`
      );
    });
  }

  return {
    mainDocument,
    newDocument,
    blackListFile: blackListLines.join('\n'),
    mismatches,
  };
}
