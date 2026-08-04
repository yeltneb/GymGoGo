export const MEALS = [
  { id:"b1", type:"Breakfast", category:"breakfast", name:"Egg White Oatmeal", description:"2 eggs, egg whites, oats, and berries", calories:410, protein:38, icon:"🍳", prep:12 },
  { id:"b2", type:"Breakfast", category:"breakfast", name:"Protein Oatmeal", description:"Oats, whey, banana, and cinnamon", calories:430, protein:32, icon:"🥣", prep:6 },
  { id:"b3", type:"Breakfast", category:"breakfast", name:"Greek Yogurt Bowl", description:"Greek yogurt, berries, oats, and chia", calories:360, protein:30, icon:"🫐", prep:5 },
  { id:"b4", type:"Breakfast", category:"breakfast", name:"Turkey Egg Wrap", description:"Eggs, turkey, tortilla, and spinach", calories:420, protein:37, icon:"🌯", prep:10 },

  { id:"l1", type:"Lunch", category:"lunch", name:"Chicken Rice Bowl", description:"Chicken breast, rice, and vegetables", calories:470, protein:46, icon:"🍚", prep:20 },
  { id:"l2", type:"Lunch", category:"lunch", name:"Turkey Wrap", description:"Turkey, whole-wheat wrap, vegetables, and cheese", calories:450, protein:44, icon:"🌯", prep:10 },
  { id:"l3", type:"Lunch", category:"lunch", name:"Tuna Rice Bowl", description:"Tuna, rice, cucumber, tomato, and dressing", calories:440, protein:44, icon:"🐟", prep:10 },
  { id:"l4", type:"Lunch", category:"lunch", name:"Turkey Chili", description:"Lean turkey, beans, tomato, and vegetables", calories:480, protein:40, icon:"🥘", prep:35 },

  { id:"d1", type:"Dinner", category:"dinner", name:"Lean Steak & Potato", description:"Lean steak, potato, and green vegetables", calories:570, protein:41, icon:"🥩", prep:25 },
  { id:"d2", type:"Dinner", category:"dinner", name:"Salmon & Rice", description:"Salmon, rice, and vegetables", calories:560, protein:42, icon:"🐟", prep:25 },
  { id:"d3", type:"Dinner", category:"dinner", name:"Chicken Stir Fry", description:"Chicken, vegetables, rice, and light sauce", calories:500, protein:44, icon:"🍲", prep:20 },
  { id:"d4", type:"Dinner", category:"dinner", name:"Turkey Meatballs", description:"Turkey meatballs, whole-grain pasta, and marinara", calories:540, protein:42, icon:"🍝", prep:30 },

  { id:"s1", type:"Snack", category:"snack", name:"Greek Yogurt", description:"Nonfat Greek yogurt", calories:130, protein:23, icon:"🥛", prep:1 },
  { id:"s2", type:"Snack", category:"snack", name:"Protein Shake", description:"Whey protein mixed with water", calories:130, protein:25, icon:"🥤", prep:2 },
  { id:"s3", type:"Snack", category:"snack", name:"Cottage Cheese", description:"Low-fat cottage cheese", calories:140, protein:20, icon:"🥣", prep:1 },
  { id:"s4", type:"Snack", category:"snack", name:"Apple & String Cheese", description:"Apple and light string cheese", calories:180, protein:7, icon:"🍎", prep:1 },
  { id:"s5", type:"Snack", category:"snack", name:"Turkey Roll-Ups", description:"Turkey breast and light cheese", calories:180, protein:22, icon:"🧀", prep:4 },
  { id:"s6", type:"Snack", category:"snack", name:"Edamame", description:"Steamed edamame", calories:220, protein:20, icon:"🫛", prep:5 }
];

export const DEFAULT_PLAN = ["b1","s1","l1","s4","d3","s3"];

export const getMeal = (id) => MEALS.find((meal) => meal.id === id);

export function labelPlan(ids) {
  const selected = ids.map(getMeal).filter(Boolean);
  const snackIndexes = selected.map((m,i) => m.category === "snack" ? i : -1).filter(i => i >= 0);

  return selected.map((meal,index) => {
    let label = meal.type;
    if (meal.category === "snack") {
      const snackNumber = snackIndexes.indexOf(index);
      if (snackIndexes.length === 1) label = "Snack";
      else if (snackNumber === 0) label = "Morning Snack";
      else if (snackNumber === snackIndexes.length - 1) label = "Evening Snack";
      else label = "Afternoon Snack";
    }
    return { ...meal, label };
  });
}

export function autoBuildPlan(calorieTarget, proteinTarget) {
  const groups = {
    breakfast: MEALS.filter(m => m.category === "breakfast"),
    lunch: MEALS.filter(m => m.category === "lunch"),
    dinner: MEALS.filter(m => m.category === "dinner"),
    snack: MEALS.filter(m => m.category === "snack")
  };

  let best = null;
  const pick = (items) => items[Math.floor(Math.random() * items.length)];

  for (let i = 0; i < 4500; i += 1) {
    const raw = [
      pick(groups.breakfast),
      pick(groups.snack),
      pick(groups.lunch),
      pick(groups.snack),
      pick(groups.dinner),
      pick(groups.snack)
    ];
    const unique = [...new Map(raw.map(m => [m.id, m])).values()];
    const calories = unique.reduce((sum,m) => sum + m.calories, 0);
    const protein = unique.reduce((sum,m) => sum + m.protein, 0);
    const score = Math.abs(calories - calorieTarget) + Math.abs(protein - proteinTarget) * 12;
    if (!best || score < best.score) best = { ids: unique.map(m => m.id), score };
  }

  return best.ids;
}
