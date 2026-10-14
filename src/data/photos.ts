import type { ImageSourcePropType } from "react-native";

import bar from "../../assets/menu/bar.jpg";
import bowls from "../../assets/menu/bowls.jpg";
import bread from "../../assets/menu/bread.jpg";
import brunch from "../../assets/menu/brunch.jpg";
import cakes from "../../assets/menu/cakes.jpg";
import coffee from "../../assets/menu/coffee.jpg";
import drinks from "../../assets/menu/drinks.jpg";
import espresso from "../../assets/menu/espresso.jpg";
import filter from "../../assets/menu/filter.jpg";
import matcha from "../../assets/menu/matcha.jpg";
import sandwiches from "../../assets/menu/sandwiches.jpg";
import sweet from "../../assets/menu/sweet.jpg";
import toast from "../../assets/menu/toast.jpg";

export const photos: Record<string, ImageSourcePropType> = {
  "bar.jpg": bar,
  "bowls.jpg": bowls,
  "bread.jpg": bread,
  "brunch.jpg": brunch,
  "cakes.jpg": cakes,
  "coffee.jpg": coffee,
  "drinks.jpg": drinks,
  "espresso.jpg": espresso,
  "filter.jpg": filter,
  "matcha.jpg": matcha,
  "sandwiches.jpg": sandwiches,
  "sweet.jpg": sweet,
  "toast.jpg": toast,
};

export const coverPhoto = coffee;

export function photoFor(name: string): ImageSourcePropType {
  return photos[name] ?? coffee;
}
