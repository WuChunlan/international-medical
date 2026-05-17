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
  isActive: number;
}

export interface Doctor {
  id: number;
  hospitalId: number;
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
}

export interface MediaItem {
  id: number;
  entityType: string;
  entityId: number;
  mediaType: 'image' | 'video';
  url: string;
  isCover: number;
  sortOrder: number;
}

export interface HospitalDetail {
  hospital: Hospital;
  doctors: Doctor[];
  equipments: Equipment[];
  mediaList: MediaItem[];
}

export interface SpecialProduct {
  id: number;
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
}

export interface ProductVariant {
  id: number;
  productId: number;
  nameZh: string;
  nameEn: string;
  descZh: string | null;
  descEn: string | null;
  price: number | null;
}

export interface ProductDetail {
  product: SpecialProduct;
  variants: ProductVariant[];
  mediaList: MediaItem[];
}

export interface BrowseHistory {
  id: number;
  userId: number;
  targetType: 'hospital' | 'product';
  targetId: number;
  targetNameZh: string;
  targetNameEn: string;
  createdAt: string;
}

export interface User {
  username: string;
  role: string;
  token: string;
}
