import { v4 as uuidv4 } from 'uuid';
import type { StringingRecord } from '../types';
import { useData } from '../context/DataContext';

export function useStringingRecords() {
  const { stringingRecords: records, setStringingRecords } = useData();

  function addRecord(record: Omit<StringingRecord, 'id'>) {
    const newRecord: StringingRecord = { ...record, id: uuidv4() };
    setStringingRecords((prev) => [...prev, newRecord]);
    return newRecord;
  }

  function updateRecord(id: string, record: Omit<StringingRecord, 'id'>) {
    setStringingRecords((prev) => prev.map((r) => (r.id === id ? { ...record, id } : r)));
  }

  function deleteRecord(id: string) {
    setStringingRecords((prev) => prev.filter((r) => r.id !== id));
  }

  return { records, addRecord, updateRecord, deleteRecord };
}
