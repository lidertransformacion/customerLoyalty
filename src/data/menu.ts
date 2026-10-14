import { pointsForPrice } from "@/src/data/program";
import { fold } from "@/src/format";

import raw from "./menu.json";

export type Category = {
  id: string;
  name: string;
  photo: string;
  intro: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  profile?: string;
  vegan: boolean;
  nuts: boolean;
  extra: boolean;
};

type RawMenu = {
  categories: Category[];
  items: (Omit<MenuItem, "vegan" | "nuts" | "extra"> & {
    vegan?: boolean;
    nuts?: boolean;
    extra?: boolean;
  })[];
};

const data = raw as RawMenu;

export const categories: Category[] = data.categories;

export const items: MenuItem[] = data.items.map((item) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  price: item.price,
  description: item.description,
  ...(item.profile ? { profile: item.profile } : {}),
  vegan: item.vegan ?? false,
  nuts: item.nuts ?? false,
  extra: item.extra ?? false,
}));

export function categoryById(id: string): Category | undefined {
  return categories.find((category) => category.id === id);
}

export function itemById(id: string): MenuItem | undefined {
  return items.find((item) => item.id === id);
}

export function pointsForItem(item: MenuItem): number {
  return pointsForPrice(item.price);
}

export type MenuFilter = {
  text: string;
  category: string | null;
  ceiling: number | null;
  plant: boolean;
  noNuts: boolean;
};

export function filterMenu(filter: MenuFilter): MenuItem[] {
  const text = fold(filter.text.trim());
  return items.filter((item) => {
    if (item.extra) return false;
    if (filter.category && item.category !== filter.category) return false;
    if (filter.ceiling !== null && item.price > filter.ceiling) return false;
    if (filter.plant && !item.vegan) return false;
    if (filter.noNuts && item.nuts) return false;
    if (!text) return true;
    const chapter = categoryById(item.category)?.name ?? "";
    return (
      fold(item.name).includes(text) ||
      fold(item.description).includes(text) ||
      fold(chapter).includes(text)
    );
  });
}

export type Chapter = {
  category: Category;
  items: MenuItem[];
  rest: number;
};

export function menuChapters(): Chapter[] {
  return categories
    .filter((category) => category.id !== "extras")
    .map((category) => {
      const all = items.filter(
        (item) => item.category === category.id && !item.extra,
      );
      return {
        category,
        items: all.slice(0, 4),
        rest: Math.max(0, all.length - 4),
      };
    });
}
