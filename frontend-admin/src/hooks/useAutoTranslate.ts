import { useCallback, useEffect, useRef } from 'react';
import type { FormInstance } from 'antd';
import api from '../api';

async function translateZhToEn(text: string): Promise<string> {
  if (!text?.trim()) return '';
  const res = await api.post<string>('/api/admin/translate', { text });
  const translated = res.data;
  if (!translated?.trim()) throw new Error('No translation returned');
  return translated;
}

// Map of zh field name → en field name
const FIELD_PAIRS: Record<string, string> = {
  nameZh: 'nameEn',
  introZh: 'introEn',
  summaryZh: 'summaryEn',
  detailZh: 'detailEn',
  descZh: 'descEn',
  addressZh: 'addressEn',
  titleZh: 'titleEn',
  specialtyZh: 'specialtyEn',
  bioZh: 'bioEn',
};

export function useAutoTranslate(form: FormInstance) {
  const pendingRef = useRef<Record<string, boolean>>({});

  // Warm up the backend connection on mount (optional)
  useEffect(() => {}, []);

  const translateField = useCallback(async (zhField: string) => {
    const enField = FIELD_PAIRS[zhField];
    if (!enField) return;

    const zhValue: string = form.getFieldValue(zhField);
    if (!zhValue?.trim()) return;

    const enValue: string = form.getFieldValue(enField);
    if (enValue?.trim()) return;

    if (pendingRef.current[zhField]) return;
    pendingRef.current[zhField] = true;

    try {
      const translated = await translateZhToEn(zhValue);
      const currentEn: string = form.getFieldValue(enField);
      if (!currentEn?.trim()) {
        form.setFieldValue(enField, translated);
      }
    } catch {
      // Silent fail — user can fill in manually
    } finally {
      pendingRef.current[zhField] = false;
    }
  }, [form]);

  const translateAll = useCallback(async () => {
    await Promise.allSettled(
      Object.entries(FIELD_PAIRS).map(async ([zhField, enField]) => {
        const zhValue: string = form.getFieldValue(zhField);
        if (!zhValue?.trim()) return;
        try {
          const translated = await translateZhToEn(zhValue);
          form.setFieldValue(enField, translated);
        } catch { /* silent */ }
      })
    );
  }, [form]);

  return { translateField, translateAll };
}
