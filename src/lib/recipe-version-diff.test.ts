import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  diffRecipeLines,
  findPreviousRecipeMarkdown,
  isDetailRecipeMarkdown,
  isModifiedRecipeMarkdown,
  parseModifiedRecipeTitle,
  recipeDiffHasVisibleChanges,
  stripRecipeDecor,
} from "./recipe-version-diff.ts";

const originalFriedRice = `Easy And Simple Fried Rice
A quick and flavorful dish that combines cooked rice with a savory mix of vegetables and seasonings.

**Nutrition (Per Serving):**
- Calories: 115.2 kcal
- Protein: 2.68 g
- Carbohydrates: 18.41 g
- Fat: 3.46 g

**Ingredients (Servings: 3):**
- 1 tablespoon oil
- 3 tablespoons fresh ginger, chopped
- 2 cups onions, thinly sliced
- 4 cups cooked rice, chilled

**Cooking Steps:**
1. Heat oil in a large nonstick skillet over medium heat.
2. Add sliced onion to pan; reduce heat to medium-low.
3. Add rice; cook 4 minutes or until heated, stirring frequently.
`;

const modifiedFriedRice = `**🍽️ Easy And Simple Fried Rice (Modified)**

A lighter version with less oil and onion.

**🔥 Nutrition (Per Serving):**
- Calories: 98.0 kcal
- Protein: 2.68 g
- Carbohydrates: 18.41 g
- Fat: 2.10 g

**🥗 Ingredients (Servings: 3):**
- 1 teaspoon oil
- 3 tablespoons fresh ginger, chopped
- 1 cup onions, thinly sliced
- 4 cups cooked rice, chilled

**👨‍🍳 Cooking Steps:**
1. Heat oil in a large nonstick skillet over medium heat.
2. Add sliced onion to pan; reduce heat to medium-low.
3. Add rice; cook 4 minutes or until heated, stirring frequently.
`;

const secondModifiedFriedRice = `**🍽️ Easy And Simple Fried Rice (Modified)**

A lighter version with less oil and onion.

**🔥 Nutrition (Per Serving):**
- Calories: 90.0 kcal
- Protein: 2.68 g
- Carbohydrates: 18.41 g
- Fat: 1.80 g

**🥗 Ingredients (Servings: 2):**
- 1 teaspoon oil
- 3 tablespoons fresh ginger, chopped
- 1 cup onions, thinly sliced
- 3 cups cooked rice, chilled

**👨‍🍳 Cooking Steps:**
1. Heat oil in a large nonstick skillet over medium heat.
2. Add sliced onion to pan; reduce heat to medium-low.
3. Add rice; cook 4 minutes or until heated, stirring frequently.
`;

const unrelatedRecipe = `**Spaghetti Carbonara**

**Ingredients (Servings: 2):**
- 200g spaghetti
- 2 eggs

**Cooking Steps:**
1. Boil pasta.
2. Toss with eggs.
`;

describe("parseModifiedRecipeTitle", () => {
  it("reads English modified first line", () => {
    assert.equal(
      parseModifiedRecipeTitle(modifiedFriedRice),
      "Easy And Simple Fried Rice",
    );
  });

  it("reads Vietnamese modified first line", () => {
    const vi = "**🍽️ Phở Bò (Đã chỉnh sửa)**\n\n**🥗 Nguyên liệu:**\n- xương";
    assert.equal(parseModifiedRecipeTitle(vi), "Phở Bò");
  });

  it("does not treat the original chat card as modified", () => {
    assert.equal(parseModifiedRecipeTitle(originalFriedRice), null);
    assert.equal(isModifiedRecipeMarkdown(originalFriedRice), false);
  });
});

describe("isDetailRecipeMarkdown", () => {
  it("matches the original screenshot-style recipe card", () => {
    assert.equal(isDetailRecipeMarkdown(originalFriedRice), true);
  });

  it("matches a modified recipe body", () => {
    assert.equal(isDetailRecipeMarkdown(modifiedFriedRice), true);
  });
});

describe("findPreviousRecipeMarkdown", () => {
  it("compares the latest modified recipe with the original card", () => {
    const messages = [
      { isUser: false, text: originalFriedRice },
      { isUser: true, text: "Make it lighter" },
      { isUser: false, text: modifiedFriedRice },
    ];
    assert.equal(
      findPreviousRecipeMarkdown({ messages, currentIndex: 2 }),
      originalFriedRice,
    );
  });

  it("prefers the previous modified version over the original", () => {
    const messages = [
      { isUser: false, text: originalFriedRice },
      { isUser: false, text: modifiedFriedRice },
      { isUser: false, text: secondModifiedFriedRice },
    ];
    assert.equal(
      findPreviousRecipeMarkdown({ messages, currentIndex: 2 }),
      modifiedFriedRice,
    );
  });

  it("skips unrelated recipes and user messages", () => {
    const messages = [
      { isUser: false, text: originalFriedRice },
      { isUser: false, text: unrelatedRecipe },
      { isUser: true, text: "**🍽️ Easy And Simple Fried Rice (Modified)**" },
      { isUser: false, text: modifiedFriedRice },
    ];
    assert.equal(
      findPreviousRecipeMarkdown({ messages, currentIndex: 3 }),
      originalFriedRice,
    );
  });

  it("returns null when the current message is not a modified recipe", () => {
    const messages = [{ isUser: false, text: originalFriedRice }];
    assert.equal(
      findPreviousRecipeMarkdown({ messages, currentIndex: 0 }),
      null,
    );
  });
});

describe("diffRecipeLines", () => {
  it("does not flag emoji/suffix-only header differences", () => {
    const hunks = diffRecipeLines(
      "**Nutrition (Per Serving):**",
      "**🔥 Nutrition (Per Serving):**",
    );
    assert.equal(hunks.length, 1);
    assert.equal(hunks[0].op, "equal");
  });

  it("highlights only changed ingredient lines, not nutrition", () => {
    const hunks = diffRecipeLines(originalFriedRice, modifiedFriedRice);
    const changed = hunks.filter((h) => h.op === "changed");
    assert.equal(
      hunks.some((h) => hunkIsHighlightSafe(h) && h.text.includes("kcal")),
      false,
    );
    assert.equal(
      hunks.some((h) => hunkIsHighlightSafe(h) && h.text.includes("Heat oil")),
      false,
    );
    assert.equal(
      changed.some((h) => h.text.includes("1 teaspoon oil")),
      true,
    );
    assert.equal(
      changed.some((h) => h.text.includes("1 cup onions")),
      true,
    );
    assert.equal(
      changed.some((h) =>
        stripRecipeDecor(h.previous ?? "").includes("1 tablespoon oil"),
      ),
      true,
    );
    assert.equal(recipeDiffHasVisibleChanges(hunks), true);
  });

  it("latest modified diffs ingredients against the previous modified, not original", () => {
    const vsOriginal = diffRecipeLines(originalFriedRice, secondModifiedFriedRice);
    const vsPrevious = diffRecipeLines(modifiedFriedRice, secondModifiedFriedRice);
    const originalHighlights = vsOriginal.filter(hunkIsHighlightSafe).length;
    const previousHighlights = vsPrevious.filter(hunkIsHighlightSafe).length;
    assert.ok(previousHighlights < originalHighlights);
    assert.equal(
      vsPrevious.some(
        (h) => hunkIsHighlightSafe(h) && h.text.includes("3 cups cooked rice"),
      ),
      true,
    );
  });
});

function hunkIsHighlightSafe(hunk: { op: string; text: string }): boolean {
  return (
    hunk.text.trim() !== "" &&
    (hunk.op === "added" || hunk.op === "removed" || hunk.op === "changed")
  );
}
