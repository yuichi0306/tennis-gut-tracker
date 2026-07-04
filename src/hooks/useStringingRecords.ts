import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { StringingRecord } from '../types';
import { stringingStorage } from '../lib/storage';

export function useStringingRecords() {
  const [records, setRecords] = useState<StringingRecord[]>([]);

  useEffect(() => {
    setRecords(stringingStorage.getAll());
  }, []);

  function addRecord(record: Omit<StringingRecord, 'id'>) {
    const newRecord: StringingRecord = { ...record, id: uuidv4() };
    const next = [...records, newRecord];
    setRecords(next);
    stringingStorage.save(next);
    return newRecord;
  }

  function deleteRecord(id: string) {
    const next = records.filter((r) => r.id !== id);
    setRecords(next);
    stringingStorage.save(next);
  }

  return { records, addRecord, deleteRecord };
}
