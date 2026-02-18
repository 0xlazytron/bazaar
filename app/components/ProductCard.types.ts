import { ImageSourcePropType } from "react-native";

export type ProductType =
  | "Featured"
  | "Ending Soon"
  | "Newly Listed"
  | "Popular";

export interface ProductCardProps {
  id: string;
  image: ImageSourcePropType;
  title: string;
  description: string;
  currentBid: number;
  buyNowPrice?: number;
  timeLeft: string;
  bids: number;
  type?: ProductType;
  onPress?: () => void;
}

export type ProductCondition = "New" | "Used";
