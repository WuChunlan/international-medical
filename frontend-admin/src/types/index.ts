export interface Hospital {
  id: number;
  nameZh: string;
  nameEn: string;
  introZh: string;
  introEn: string;
  coverImageUrl: string | null;
  addressZh: string | null;
  addressEn: string | null;
  phone: string | null;
  contactPerson: string | null;
  contactInfo: string | null;
  sortOrder: number;
  isActive: number;
  auditStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  hasPendingEdit?: boolean;
}

export interface Doctor {
  id: number;
  hospitalId: number | null;
  createdUser?: number | null;
  nameZh: string;
  nameEn: string;
  specialtyZh: string;
  specialtyEn: string;
  bioZh: string | null;
  bioEn: string | null;
  photoUrl: string | null;
  pricePerVisit: number | null;
  titleZh: string | null;
  titleEn: string | null;
  sortOrder: number;
  isActive: number;
  auditStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  hasPendingEdit?: boolean;
}

export interface Equipment {
  id: number;
  hospitalId: number | null;
  createdUser?: number | null;
  nameZh: string;
  nameEn: string;
  descZh: string | null;
  descEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: number;
  auditStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  hasPendingEdit?: boolean;
}

export interface HospitalEnvironment {
  id: number;
  hospitalId: number;
  nameZh: string;
  nameEn: string;
  descZh: string | null;
  descEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: number;
  auditStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  hasPendingEdit?: boolean;
}

export interface ServiceTeam {
  id: number;
  nameZh: string;
  nameEn: string;
  introZh: string | null;
  introEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: number;
}

export interface SpecialProduct {
  id: number;
  hospitalId: number | null;
  nameZh: string;
  nameEn: string;
  summaryZh: string;
  summaryEn: string;
  detailZh: string | null;
  detailEn: string | null;
  coverImageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  contactPerson: string | null;
  contactInfo: string | null;
  sortOrder: number;
  isActive: number;
  auditStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  hasPendingEdit?: boolean;
  variants?: ProductVariantDTO[];
}

export interface ProductVariantDTO {
  nameZh: string;
  nameEn: string;
  descZh: string | null;
  descEn: string | null;
  price: number | null;
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  nameZh: string;
  nameEn: string;
  descZh: string | null;
  descEn: string | null;
  price: number | null;
  sortOrder: number;
  isActive: number;
}

export interface MediaItem {
  id: number | null;   // null for pending_add items
  entityType: string;
  entityId: number;
  mediaType: 'image' | 'video';
  url: string;
  isCover: number;
  sortOrder: number;
  status?: 'approved' | 'pending_add';
}

export interface User {
  id: number;
  username?: string;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  email: string;
  phone: string | null;
  roleId: number;
  hospitalId?: number | null;
  idCardNumber: string | null;
  passportNumber: string | null;
  idCardCountry: string | null;
  inviteCode?: string | null;
  canInvite?: number | null;
  referredBy?: number | null;
  isActive: number;
  createdAt: string;
}

export interface MedicalCase {
  id: number;
  hospitalId: number | null;
  hospitalNameZh?: string | null;
  hospitalNameEn?: string | null;
  titleZh: string;
  titleEn: string;
  summaryZh: string | null;
  summaryEn: string | null;
  detailZh: string | null;
  detailEn: string | null;
  coverImageUrl: string | null;
  sortOrder: number;
  isActive: number;
  createdAt?: string;
  createdUser?: number | null;
  auditStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  hasPendingEdit?: boolean;
}

export interface SiteConfig {
  id: number;
  configKey: string;
  valueZh: string;
  valueEn: string;
  description: string;
}

export interface ServiceFeature {
  id: number;
  nameZh: string;
  nameEn: string;
  introZh: string | null;
  introEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: number;
  teamIds?: number[];
  createdUser?: number | null;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface PendingItem<T = Record<string, unknown>> {
  data: T
  isEdit: boolean
  currentData: T | null
  pendingChangeId?: number | null
}
