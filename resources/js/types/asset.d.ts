import { Tag } from "./machine";

export interface AssetGroup {
  id: number;
  name: string;
  slug: string;
  maintenance_type: 'group' | 'individual';
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: number;
  name: string;
  slug: string;
  status: string;
  tags: Tag;
  image_url: string | null;
  asset_group_id: number | null;
  asset_group?: AssetGroup; // Optional relationship loaded from backend
  created_at: string;
  updated_at: string;
}
