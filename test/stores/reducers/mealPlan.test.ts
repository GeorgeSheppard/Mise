import {
  addOrUpdatePlan,
  removeRecipeFromPlan,
  buildAddRecipePayload,
  isoToTimestamp,
} from "../../../core/meal_plan/meal_plan_utilities";
import { IRecipe } from "../../../core/types/recipes";

// Helper to build a minimal IRecipe for testing
function makeRecipe(overrides?: Partial<IRecipe>): IRecipe {
  return {
    uuid: "recipe-1",
    name: "Test Recipe",
    description: "",
    images: [],
    components: [
      {
        name: "Main",
        uuid: "comp-1",
        ingredients: [],
        instructions: [],
        servings: 2,
      },
    ],
    ...overrides,
  };
}

function makeMultiComponentRecipe(): IRecipe {
  return makeRecipe({
    uuid: "recipe-2",
    components: [
      {
        name: "Sauce",
        uuid: "comp-a",
        ingredients: [],
        instructions: [],
        servings: 4,
      },
      {
        name: "Pasta",
        uuid: "comp-b",
        ingredients: [],
        instructions: [],
        servings: 4,
      },
    ],
  });
}

// ── removeRecipeFromPlan ──

describe("removeRecipeFromPlan", () => {
  const ts1 = isoToTimestamp("2022-07-16");
  const ts2 = isoToTimestamp("2022-07-17");

  test("removes a recipe with single component from a day", () => {
    const plan = [
      {
        date: ts1,
        plan: [{ recipeId: "r1", components: [{ componentId: "c1", servings: 3 }] }],
      },
    ];
    const result = removeRecipeFromPlan(plan, "r1", ts1);
    expect(result).toStrictEqual([{ date: ts1, plan: [] }]);
  });

  test("removes a recipe with multiple components from a day", () => {
    const plan = [
      {
        date: ts1,
        plan: [
          {
            recipeId: "r1",
            components: [
              { componentId: "c1", servings: 2 },
              { componentId: "c2", servings: 3 },
            ],
          },
        ],
      },
    ];
    const result = removeRecipeFromPlan(plan, "r1", ts1);
    expect(result).toStrictEqual([{ date: ts1, plan: [] }]);
  });

  test("removes recipe from day with multiple recipes (others stay)", () => {
    const plan = [
      {
        date: ts1,
        plan: [
          { recipeId: "r1", components: [{ componentId: "c1", servings: 2 }] },
          { recipeId: "r2", components: [{ componentId: "c2", servings: 3 }] },
        ],
      },
    ];
    const result = removeRecipeFromPlan(plan, "r1", ts1);
    expect(result).toStrictEqual([
      {
        date: ts1,
        plan: [{ recipeId: "r2", components: [{ componentId: "c2", servings: 3 }] }],
      },
    ]);
  });

  test("removes non-existent recipe (no-op, plan unchanged)", () => {
    const plan = [
      {
        date: ts1,
        plan: [{ recipeId: "r1", components: [{ componentId: "c1", servings: 2 }] }],
      },
    ];
    const result = removeRecipeFromPlan(plan, "r999", ts1);
    expect(result).toStrictEqual(plan);
  });

  test("removes from non-existent date (no-op, plan unchanged)", () => {
    const plan = [
      {
        date: ts1,
        plan: [{ recipeId: "r1", components: [{ componentId: "c1", servings: 2 }] }],
      },
    ];
    const result = removeRecipeFromPlan(plan, "r1", ts2);
    expect(result).toStrictEqual(plan);
  });

  test("preserves other dates in the plan", () => {
    const plan = [
      {
        date: ts1,
        plan: [{ recipeId: "r1", components: [{ componentId: "c1", servings: 2 }] }],
      },
      {
        date: ts2,
        plan: [{ recipeId: "r2", components: [{ componentId: "c2", servings: 5 }] }],
      },
    ];
    const result = removeRecipeFromPlan(plan, "r1", ts1);
    expect(result).toStrictEqual([
      { date: ts1, plan: [] },
      {
        date: ts2,
        plan: [{ recipeId: "r2", components: [{ componentId: "c2", servings: 5 }] }],
      },
    ]);
  });

  test("does not mutate the original plan", () => {
    const original = [
      {
        date: ts1,
        plan: [{ recipeId: "r1", components: [{ componentId: "c1", servings: 2 }] }],
      },
    ];
    removeRecipeFromPlan(original, "r1", ts1);
    expect(original[0].plan).toHaveLength(1);
    expect(original[0].plan[0].recipeId).toBe("r1");
  });
});

// ── buildAddRecipePayload ──

describe("buildAddRecipePayload", () => {
  test("uses component servings as the increase", () => {
    const recipe = makeRecipe();
    const result = buildAddRecipePayload(recipe, "2026-02-19");
    expect(result.components).toEqual([
      { recipeId: "recipe-1", componentId: "comp-1", servingsIncrease: 2 },
    ]);
  });

  test("defaults to 1 when component has no servings", () => {
    const recipe = makeRecipe({
      components: [
        { name: "Main", uuid: "comp-1", ingredients: [], instructions: [] },
      ],
    });
    const result = buildAddRecipePayload(recipe, "2026-02-19");
    expect(result.components).toEqual([
      { recipeId: "recipe-1", componentId: "comp-1", servingsIncrease: 1 },
    ]);
  });

  test("includes all components for multi-component recipe", () => {
    const recipe = makeMultiComponentRecipe();
    const result = buildAddRecipePayload(recipe, "2026-02-19");
    expect(result.components).toEqual([
      { recipeId: "recipe-2", componentId: "comp-a", servingsIncrease: 4 },
      { recipeId: "recipe-2", componentId: "comp-b", servingsIncrease: 4 },
    ]);
  });

  test("handles component with zero servings", () => {
    const recipe = makeRecipe({
      components: [
        {
          name: "Main",
          uuid: "comp-1",
          ingredients: [],
          instructions: [],
          servings: 0,
        },
      ],
    });
    const result = buildAddRecipePayload(recipe, "2026-02-19");
    expect(result.components).toEqual([
      { recipeId: "recipe-1", componentId: "comp-1", servingsIncrease: 0 },
    ]);
  });

  test("converts ISO date to Unix timestamp", () => {
    const recipe = makeRecipe();
    const result = buildAddRecipePayload(recipe, "2026-02-19");
    expect(result.timestamp).toBe(isoToTimestamp("2026-02-19"));
  });

  test("includes all components with mixed servings", () => {
    const recipe = makeRecipe({
      components: [
        {
          name: "Sauce",
          uuid: "comp-a",
          ingredients: [],
          instructions: [],
          servings: 2,
        },
        {
          name: "Pasta",
          uuid: "comp-b",
          ingredients: [],
          instructions: [],
        }, // undefined servings
        {
          name: "Garnish",
          uuid: "comp-c",
          ingredients: [],
          instructions: [],
          servings: 0,
        },
      ],
    });
    const result = buildAddRecipePayload(recipe, "2026-02-19");
    expect(result.components).toEqual([
      { recipeId: "recipe-1", componentId: "comp-a", servingsIncrease: 2 },
      { recipeId: "recipe-1", componentId: "comp-b", servingsIncrease: 1 },
      { recipeId: "recipe-1", componentId: "comp-c", servingsIncrease: 0 },
    ]);
  });
});

// ── addOrUpdatePlan ──

describe("addOrUpdatePlan", () => {
  const ts1 = isoToTimestamp("2022-07-16");
  const ts2 = isoToTimestamp("2022-07-17");

  test("can add a recipe", () => {
    expect(
      addOrUpdatePlan([{ date: ts1, plan: [] }], {
        timestamp: ts1,
        components: [
          { recipeId: "11", componentId: "1", servingsIncrease: 3 },
        ],
      })
    ).toStrictEqual([
      {
        date: ts1,
        plan: [
          { recipeId: "11", components: [{ componentId: "1", servings: 3 }] },
        ],
      },
    ]);
  });

  test("can reduce serving quantity on existing recipe", () => {
    expect(
      addOrUpdatePlan(
        [
          {
            date: ts1,
            plan: [
              {
                recipeId: "11",
                components: [{ componentId: "1", servings: 3 }],
              },
            ],
          },
        ],
        {
          timestamp: ts1,
          components: [
            { recipeId: "11", componentId: "1", servingsIncrease: -1 },
          ],
        }
      )
    ).toStrictEqual([
      {
        date: ts1,
        plan: [
          { recipeId: "11", components: [{ componentId: "1", servings: 2 }] },
        ],
      },
    ]);
  });

  test("can reduce serving quantity with two existing recipes in the plan", () => {
    expect(
      addOrUpdatePlan(
        [
          {
            date: ts1,
            plan: [
              {
                recipeId: "11",
                components: [{ componentId: "1", servings: 2 }],
              },
              {
                recipeId: "22",
                components: [{ componentId: "2", servings: 3 }],
              },
            ],
          },
        ],
        {
          timestamp: ts1,
          components: [
            {
              recipeId: "22",
              componentId: "2",
              servingsIncrease: -1,
            },
          ],
        }
      )
    ).toStrictEqual([
      {
        date: ts1,
        plan: [
          { recipeId: "11", components: [{ componentId: "1", servings: 2 }] },
          { recipeId: "22", components: [{ componentId: "2", servings: 2 }] },
        ],
      },
    ]);
  });

  test("can reduce servings with multiple components", () => {
    expect(
      addOrUpdatePlan(
        [
          {
            date: ts1,
            plan: [
              {
                recipeId: "11",
                components: [
                  { componentId: "1", servings: 2 },
                  { componentId: "2", servings: 4 },
                ],
              },
            ],
          },
        ],
        {
          timestamp: ts1,
          components: [
            { recipeId: "11", componentId: "2", servingsIncrease: -1 },
          ],
        }
      )
    ).toStrictEqual([
      {
        date: ts1,
        plan: [
          {
            recipeId: "11",
            components: [
              { componentId: "1", servings: 2 },
              { componentId: "2", servings: 3 },
            ],
          },
        ],
      },
    ]);
  });

  test("can reduce servings with multiple components and multiple recipes", () => {
    expect(
      addOrUpdatePlan(
        [
          {
            date: ts1,
            plan: [
              {
                recipeId: "11",
                components: [
                  { componentId: "1", servings: 2 },
                  { componentId: "2", servings: 4 },
                ],
              },
              {
                recipeId: "22",
                components: [
                  { componentId: "3", servings: 6 },
                  { componentId: "4", servings: 8 },
                ],
              },
            ],
          },
        ],
        {
          timestamp: ts1,
          components: [
            { recipeId: "22", componentId: "4", servingsIncrease: -2 },
            {
              recipeId: "11",
              componentId: "2",
              servingsIncrease: -2,
            },
          ],
        }
      )
    ).toStrictEqual([
      {
        date: ts1,
        plan: [
          {
            recipeId: "11",
            components: [
              { componentId: "1", servings: 2 },
              { componentId: "2", servings: 2 },
            ],
          },
          {
            recipeId: "22",
            components: [
              { componentId: "3", servings: 6 },
              { componentId: "4", servings: 6 },
            ],
          },
        ],
      },
    ]);
  });

  test("allows servings to reach zero", () => {
    expect(
      addOrUpdatePlan(
        [
          {
            date: ts1,
            plan: [
              {
                recipeId: "r1",
                components: [{ componentId: "c1", servings: 1 }],
              },
            ],
          },
        ],
        {
          timestamp: ts1,
          components: [
            { recipeId: "r1", componentId: "c1", servingsIncrease: -1 },
          ],
        }
      )
    ).toStrictEqual([
      {
        date: ts1,
        plan: [
          { recipeId: "r1", components: [{ componentId: "c1", servings: 0 }] },
        ],
      },
    ]);
  });

  test("removes component when servings go below zero", () => {
    expect(
      addOrUpdatePlan(
        [
          {
            date: ts1,
            plan: [
              {
                recipeId: "r1",
                components: [{ componentId: "c1", servings: 1 }],
              },
            ],
          },
        ],
        {
          timestamp: ts1,
          components: [
            { recipeId: "r1", componentId: "c1", servingsIncrease: -2 },
          ],
        }
      )
    ).toStrictEqual([{ date: ts1, plan: [] }]);
  });

  test("removes recipe when all components removed", () => {
    expect(
      addOrUpdatePlan(
        [
          {
            date: ts1,
            plan: [
              {
                recipeId: "r1",
                components: [
                  { componentId: "c1", servings: 0 },
                  { componentId: "c2", servings: 0 },
                ],
              },
            ],
          },
        ],
        {
          timestamp: ts1,
          components: [
            { recipeId: "r1", componentId: "c1", servingsIncrease: -1 },
            { recipeId: "r1", componentId: "c2", servingsIncrease: -1 },
          ],
        }
      )
    ).toStrictEqual([{ date: ts1, plan: [] }]);
  });

  test("returns plan unchanged when timestamp not found", () => {
    const plan = [
      {
        date: ts1,
        plan: [
          { recipeId: "r1", components: [{ componentId: "c1", servings: 2 }] },
        ],
      },
    ];
    expect(
      addOrUpdatePlan(plan, {
        timestamp: ts2,
        components: [
          { recipeId: "r1", componentId: "c1", servingsIncrease: 1 },
        ],
      })
    ).toStrictEqual(plan);
  });

  test("does not mutate the original plan", () => {
    const original = [
      {
        date: ts1,
        plan: [
          { recipeId: "r1", components: [{ componentId: "c1", servings: 2 }] },
        ],
      },
    ];
    addOrUpdatePlan(original, {
      timestamp: ts1,
      components: [
        { recipeId: "r1", componentId: "c1", servingsIncrease: 1 },
      ],
    });
    expect(original[0].plan[0].components[0].servings).toBe(2);
  });

  test("preserves other dates in the plan", () => {
    expect(
      addOrUpdatePlan(
        [
          {
            date: ts1,
            plan: [
              {
                recipeId: "r1",
                components: [{ componentId: "c1", servings: 1 }],
              },
            ],
          },
          {
            date: ts2,
            plan: [
              {
                recipeId: "r2",
                components: [{ componentId: "c2", servings: 5 }],
              },
            ],
          },
        ],
        {
          timestamp: ts1,
          components: [
            { recipeId: "r1", componentId: "c1", servingsIncrease: 2 },
          ],
        }
      )
    ).toStrictEqual([
      {
        date: ts1,
        plan: [
          { recipeId: "r1", components: [{ componentId: "c1", servings: 3 }] },
        ],
      },
      {
        date: ts2,
        plan: [
          { recipeId: "r2", components: [{ componentId: "c2", servings: 5 }] },
        ],
      },
    ]);
  });

  test("adds a new component to an existing recipe", () => {
    expect(
      addOrUpdatePlan(
        [
          {
            date: ts1,
            plan: [
              {
                recipeId: "r1",
                components: [{ componentId: "c1", servings: 2 }],
              },
            ],
          },
        ],
        {
          timestamp: ts1,
          components: [
            { recipeId: "r1", componentId: "c2", servingsIncrease: 3 },
          ],
        }
      )
    ).toStrictEqual([
      {
        date: ts1,
        plan: [
          {
            recipeId: "r1",
            components: [
              { componentId: "c1", servings: 2 },
              { componentId: "c2", servings: 3 },
            ],
          },
        ],
      },
    ]);
  });
});
