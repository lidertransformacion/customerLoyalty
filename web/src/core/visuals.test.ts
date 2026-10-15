import { describe, expect, it } from "vitest";

import { items } from "@/src/data/menu";

import { photoForCategory } from "./visuals";
import { visualFor } from "./visuals";

const byId = (id: string) => items.find((item) => item.id === id)!;

describe("visualFor", () => {
  it("shows roasted coffee as a product render of its profile", () => {
    const visual = visualFor(byId("rock-340"));
    expect(visual.kind).toBe("product");
    if (visual.kind === "product") {
      expect(visual.profile).toBe("ROCK");
      expect(visual.src).toMatch(/^\/products\/rock/);
    }
  });

  it("pours for filter coffee", () => {
    const visual = visualFor(byId("fil-paz-12"));
    expect(visual.kind).toBe("photo");
    if (visual.kind === "photo") expect(visual.photo.mood).toBe("pour");
  });

  it("steams for espresso drinks and sweats for iced ones", () => {
    const hot = visualFor(byId("cap-blend"));
    const iced = visualFor(byId("iced-lat"));
    expect(hot.kind === "photo" && hot.photo.mood).toBe("hot");
    expect(iced.kind === "photo" && iced.photo.mood).toBe("cold");
  });

  it("is cold for cold brew and fizzy for signature drinks", () => {
    expect(visualFor(byId("cb-lata")).kind === "photo" && (visualFor(byId("cb-lata")) as { photo: { mood: string } }).photo.mood).toBe("cold");
    const soda = visualFor(byId("lumina"));
    expect(soda.kind === "photo" && soda.photo.mood).toBe("fizz");
  });

  it("falls back to a still photograph for food", () => {
    const cake = visualFor(byId("zanahoria"));
    expect(cake.kind).toBe("photo");
    if (cake.kind === "photo") expect(cake.photo.src).toMatch(/^\/menu\//);
  });

  it("gives every category a photo", () => {
    for (const category of ["filter", "espresso", "bowls", "unknown"]) {
      expect(photoForCategory(category).src).toMatch(/^\/menu\//);
    }
  });
});
