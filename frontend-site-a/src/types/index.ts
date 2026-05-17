export interface Hospital {
  id: number;
  nameZh: string;
  nameEn: string;
  introZh: string;
  introEn: string;
  coverImageUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
  isActive: number;
  equipments?: Equipment[];
}

export interface Equipment {
  id: number;
  hospitalId: number;
  nameZh: string;
  nameEn: string;
  descZh: string | null;
  descEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface MedicalCase {
  id: number;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  coverImageUrl: string | null;
}

export interface SpecialProduct {
  id: number;
  nameZh: string;
  nameEn: string;
  summaryZh: string;
  summaryEn: string;
  coverImageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
}

export interface SiteConfig {
  configKey: string;
  valueZh: string;
  valueEn: string;
}
