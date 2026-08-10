import { useEffect, useState } from 'react';
import api from '../api';

export interface ContactEntry {
  name: string;
  phone: string;
}

let cached: ContactEntry[] | null = null;
const listeners: Array<(c: ContactEntry[]) => void> = [];

export function useContacts() {
  const [contacts, setContacts] = useState<ContactEntry[]>(cached ?? []);

  useEffect(() => {
    if (cached !== null) {
      setContacts(cached);
      return;
    }
    listeners.push(setContacts);
    if (listeners.length === 1) {
      api.get('/api/config/contact_contacts')
        .then(r => {
          const raw = r.data?.valueZh || r.data?.valueEn || '[]';
          let parsed: ContactEntry[] = [];
          try { parsed = JSON.parse(raw); } catch { /* ignore */ }
          if (!Array.isArray(parsed)) parsed = [];
          cached = parsed;
          listeners.forEach(fn => fn(parsed));
        })
        .catch(() => {
          cached = [];
          listeners.forEach(fn => fn([]));
        });
    }
    return () => {
      const idx = listeners.indexOf(setContacts);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return contacts;
}
