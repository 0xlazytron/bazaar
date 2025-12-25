import { ImageSourcePropType } from 'react-native';

export type ProductType = 'Featured' | 'Ending Soon' | 'Newly Listed' | 'Popular';

export interface ProductCardProps {
  id: string;
  image: ImageSourcePropType;
  title: string;
  description: string;
  currentBid: number;
  timeLeft: string;
  bids: number;
  type?: ProductType;
}

export type ProductCondition = 'New' | 'Used';