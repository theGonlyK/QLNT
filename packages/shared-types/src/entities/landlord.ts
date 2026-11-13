export type PackageTier = 'FREE' | 'PRO';

export interface Landlord {
  id: string; // UUID v4
  name: string;
  phone: string;
  email: string;
  reputation_stars: number;
  package_tier: PackageTier;
  created_at: string;
  updated_at: string;
}
