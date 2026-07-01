import { compareEnvironmentRecords, parseRecordExport } from './comparisonUtils';

describe('parseRecordExport', () => {
  it('parses an array payload and normalizes application and dates', () => {
    const records = parseRecordExport(
      JSON.stringify([
        { id: '1001', application: 'MainApp.Records', lastModified: '2026-06-01' },
        { ID: '1002', app: 'NewApp.Records', modifiedAt: '2026-06-02T10:00:00Z' },
      ])
    );

    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({
      id: '1001',
      application: 'MainApp.Records',
      lastModified: '2026-06-01T00:00:00.000Z',
    });
    expect(records[1]).toEqual({
      id: '1002',
      application: 'NewApp.Records',
      lastModified: '2026-06-02T10:00:00.000Z',
    });
  });

  it('parses records nested under a records property', () => {
    const records = parseRecordExport(
      JSON.stringify({
        records: [{ id: '7', tableName: 'App.Table', updatedAt: '2026-06-03' }],
      })
    );

    expect(records).toEqual([
      {
        id: '7',
        application: 'App.Table',
        lastModified: '2026-06-03T00:00:00.000Z',
      },
    ]);
  });

  it('throws when the JSON is invalid', () => {
    expect(() => parseRecordExport('not json')).toThrow();
  });
});

describe('compareEnvironmentRecords', () => {
  const mainEnvironment = {
    url: 'https://main.example.com',
    username: 'main.user',
    tableName: 'MainApp.Records',
  };

  const newEnvironment = {
    url: 'https://new.example.com',
    username: 'new.user',
    tableName: 'NewApp.Records',
  };

  it('builds documents and a blacklist when one ID differs', () => {
    const result = compareEnvironmentRecords({
      mainEnvironment,
      newEnvironment,
      mainRecords: [
        { id: '1001', application: 'MainApp.Records', lastModified: '2026-06-01T00:00:00.000Z' },
        { id: '1002', application: 'MainApp.Records', lastModified: '2026-06-02T00:00:00.000Z' },
      ],
      newRecords: [
        { id: '1001', application: 'NewApp.Records', lastModified: '2026-06-01T00:00:00.000Z' },
        { id: '1002', application: 'NewApp.Records', lastModified: '2026-06-05T00:00:00.000Z' },
      ],
    });

    expect(result.mismatches).toHaveLength(1);
    expect(result.blackListFile).toContain('1002');
    expect(result.blackListFile).toContain('main app: MainApp.Records');
    expect(result.blackListFile).toContain('new app: NewApp.Records');
    expect(result.mainDocument).toContain('ID | Application | Last modified');
    expect(result.mainDocument).toContain('1001 | MainApp.Records');
    expect(result.newDocument).toContain('1002 | NewApp.Records');
  });

  it('reports no mismatches when dates match', () => {
    const result = compareEnvironmentRecords({
      mainEnvironment,
      newEnvironment,
      mainRecords: [
        { id: '1001', application: 'MainApp.Records', lastModified: '2026-06-01T00:00:00.000Z' },
      ],
      newRecords: [
        { id: '1001', application: 'NewApp.Records', lastModified: '2026-06-01T00:00:00.000Z' },
      ],
    });

    expect(result.mismatches).toHaveLength(0);
    expect(result.blackListFile).toContain('No differences found.');
  });
});