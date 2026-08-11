/**
 * 从实体中取指定字段的当前语言值。
 * 优先级：translations[field] > entity[fieldZh/fieldEn] > entity[fieldZh]
 *
 * @param entity  含 translations 和 Zh/En 双字段的对象
 * @param field   字段基础名，如 "name"、"intro"、"address"
 * @param lang    当前语言代码，如 "zh"、"en"、"fr"、"es"
 */
export function t9n(
  entity: { translations?: Record<string, string> },
  field: string,
  lang: string,
): string {
  const e = entity as Record<string, unknown> & { translations?: Record<string, string> };
  // 非内置语种：先查翻译表结果
  if (lang !== 'zh' && lang !== 'en') {
    const translated = e.translations?.[field];
    if (translated) return translated;
    return (e[`${field}Zh`] as string) ?? '';
  }
  const key = lang === 'zh' ? `${field}Zh` : `${field}En`;
  return (e[key] as string) ?? (e[`${field}Zh`] as string) ?? '';
}
