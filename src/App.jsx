import { useEffect, useMemo, useState } from "react";
import { MEALS, DEFAULT_PLAN, getMeal, labelPlan, autoBuildPlan } from "./data/meals.js";
import { blankDay, loadData, loadSettings, normalizeDay, saveData, saveSettings, todayKey } from "./data/storage.js";
import "./styles.css";

const tabs = ["Dashboard", "Calendar", "Meals", "Groceries", "Progress", "Settings"];

function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [settings, setSettings] = useState(loadSettings);
  const [allData, setAllData] = useState(loadData);
  const [activeDate, setActiveDate] = useState(todayKey());

  const day = normalizeDay(allData[activeDate], DEFAULT_PLAN);
  const plannedMeals = useMemo(() => labelPlan(day.selectedMeals), [day.selectedMeals]);

  useEffect(() => saveData(allData), [allData]);
  useEffect(() => saveSettings(settings), [settings]);

  const updateDay = (updates) => {
    setAllData((current) => ({
      ...current,
      [activeDate]: { ...day, ...updates }
    }));
  };

  const completedNutrition = plannedMeals.reduce((totals, meal) => {
    if (day.completedMeals[meal.id]) {
      totals.calories += meal.calories;
      totals.protein += meal.protein;
    }
    return totals;
  }, { calories: 0, protein: 0 });

  const waterOz = day.waterCups * 8;
  const waterLiters = waterOz * 0.0295735;
  const checklistDone =
    plannedMeals.filter(m => day.completedMeals[m.id]).length +
    Number(day.waterCups >= settings.water) +
    Number(Boolean(day.weight)) +
    Number(day.workout) +
    Number(day.movement) +
    Number(Boolean(day.notes.trim()));
  const checklistTotal = plannedMeals.length + 5;
  const checklistPct = Math.round((checklistDone / checklistTotal) * 100);

  const moveMeal = (from, to) => {
    if (to < 0 || to >= day.selectedMeals.length) return;
    const next = [...day.selectedMeals];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateDay({ selectedMeals: next });
  };

  const removeMeal = (id) => {
    const nextCompleted = { ...day.completedMeals };
    delete nextCompleted[id];
    updateDay({
      selectedMeals: day.selectedMeals.filter(item => item !== id),
      completedMeals: nextCompleted
    });
  };

  const addMeal = (id) => {
    if (day.selectedMeals.includes(id)) return;
    const meal = getMeal(id);
    const next = [...day.selectedMeals];
    const order = { breakfast: 0, snack: 1, lunch: 2, dinner: 4 };
    let position = next.length;
    for (let i = 0; i < next.length; i += 1) {
      const current = getMeal(next[i]);
      if ((order[current.category] ?? 9) > (order[meal.category] ?? 9)) {
        position = i;
        break;
      }
    }
    next.splice(position, 0, id);
    updateDay({ selectedMeals: next });
  };

  const autoBuild = () => {
    updateDay({
      selectedMeals: autoBuildPlan(settings.calories, settings.protein),
      completedMeals: {}
    });
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">LEAN FITNESS OS</p>
          <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, Simon</h1>
          <p>{activeDate === todayKey() ? "Today" : activeDate} · {settings.goal === "bulk" ? "Lean bulk" : settings.goal === "lose" ? "Weight loss" : "Body recomposition"}</p>
        </div>
        <div className="goal-cards">
          <GoalCard title="Checklist" value={`${checklistPct}%`} met={checklistPct === 100} />
          <GoalCard title="Calories" value={`${completedNutrition.calories} / ${settings.calories}`} met={completedNutrition.calories >= settings.calories * .95 && completedNutrition.calories <= settings.calories * 1.1} />
          <GoalCard title="Protein" value={`${completedNutrition.protein}g / ${settings.protein}g`} met={completedNutrition.protein >= settings.protein} />
          <GoalCard title="Water" value={`${day.waterCups} / ${settings.water} cups`} met={day.waterCups >= settings.water} />
        </div>
      </header>

      <nav className="tabs">
        {tabs.map(tab => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </nav>

      {activeTab === "Dashboard" && (
        <main className="grid">
          <section className="card span-2">
            <div className="section-heading">
              <div>
                <p className="eyebrow">TODAY'S PLAN</p>
                <h2>Meals in consumption order</h2>
              </div>
              <button className="primary" onClick={autoBuild}>Auto Build Day</button>
            </div>
            <div className="meal-list">
              {plannedMeals.map((meal,index) => (
                <MealRow
                  key={meal.id}
                  meal={meal}
                  checked={Boolean(day.completedMeals[meal.id])}
                  onCheck={(checked) => updateDay({ completedMeals: { ...day.completedMeals, [meal.id]: checked } })}
                  onRemove={() => removeMeal(meal.id)}
                  onUp={() => moveMeal(index,index-1)}
                  onDown={() => moveMeal(index,index+1)}
                />
              ))}
            </div>
          </section>

          <section className="card">
            <p className="eyebrow">HYDRATION</p>
            <h2>Water goal</h2>
            <div className="water-progress"><div style={{width:`${Math.min(100,(day.waterCups/settings.water)*100)}%`}} /></div>
            <div className="water-stats">
              <strong>{day.waterCups} cups</strong>
              <span>{waterOz} oz</span>
              <span>{waterLiters.toFixed(2)} L</span>
            </div>
            <div className="water-buttons">
              <button onClick={() => updateDay({ waterCups: Math.max(0,day.waterCups-1) })}>−</button>
              <button className="primary" onClick={() => updateDay({ waterCups: day.waterCups+1 })}>+ 1 cup</button>
            </div>
          </section>

          <section className="card">
            <p className="eyebrow">DAILY CHECK-IN</p>
            <h2>Activity and weight</h2>
            <label className="check-row"><input type="checkbox" checked={day.workout} onChange={e => updateDay({workout:e.target.checked})}/> Workout completed</label>
            <label className="check-row"><input type="checkbox" checked={day.movement} onChange={e => updateDay({movement:e.target.checked})}/> 20–30 minute walk</label>
            <input type="number" placeholder="Morning weight" value={day.weight ?? ""} onChange={e => updateDay({weight:e.target.value ? Number(e.target.value) : null})}/>
            <textarea placeholder="Energy, hunger, workout quality..." value={day.notes} onChange={e => updateDay({notes:e.target.value})}/>
          </section>
        </main>
      )}

      {activeTab === "Meals" && (
        <main className="card">
          <div className="section-heading">
            <div><p className="eyebrow">MEAL LIBRARY</p><h2>Add healthy options</h2></div>
            <button className="primary" onClick={autoBuild}>Auto Build Day</button>
          </div>
          <div className="library-grid">
            {MEALS.map(meal => (
              <article className="library-card" key={meal.id}>
                <div className="meal-icon">{meal.icon}</div>
                <div><span className={`badge ${meal.category}`}>{meal.type}</span><h3>{meal.name}</h3><p>{meal.description}</p><small>{meal.calories} cal · {meal.protein}g protein · {meal.prep} min</small></div>
                <button onClick={() => addMeal(meal.id)}>{day.selectedMeals.includes(meal.id) ? "Added" : "Add"}</button>
              </article>
            ))}
          </div>
        </main>
      )}

      {activeTab === "Calendar" && <Calendar data={allData} activeDate={activeDate} setActiveDate={setActiveDate} setActiveTab={setActiveTab} />}
      {activeTab === "Settings" && <Settings settings={settings} setSettings={setSettings} />}
      {activeTab === "Groceries" && <Placeholder title="Groceries" text="Store-based lists for Walmart, Trader Joe’s, and Whole Foods are the next module." />}
      {activeTab === "Progress" && <Placeholder title="Progress" text="Weight trends, consistency charts, measurements, and progress photos will live here." />}
    </div>
  );
}

function GoalCard({title,value,met}) {
  return <div className={`goal-card ${met ? "met" : ""}`}><span>{title}</span><strong>{value}</strong></div>;
}

function MealRow({meal,checked,onCheck,onRemove,onUp,onDown}) {
  return (
    <article className={`meal-row ${checked ? "done" : ""}`}>
      <div className="reorder">
        <button onClick={onUp}>▲</button>
        <button onClick={onDown}>▼</button>
      </div>
      <div className="meal-icon">{meal.icon}</div>
      <input type="checkbox" checked={checked} onChange={e => onCheck(e.target.checked)} />
      <div className="meal-copy">
        <span className={`badge ${meal.category}`}>{meal.label}</span>
        <h3>{meal.name}</h3>
        <p>{meal.description}</p>
        <small>{meal.calories} calories · {meal.protein}g protein · {meal.prep} min</small>
      </div>
      <button className="remove" onClick={onRemove}>Remove</button>
    </article>
  );
}

function Calendar({data,activeDate,setActiveDate,setActiveTab}) {
  const [cursor,setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year,month,1).getDay();
  const count = new Date(year,month+1,0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({length:count},(_,i)=>i+1)];

  return (
    <main className="card">
      <div className="calendar-heading">
        <button onClick={() => setCursor(new Date(year,month-1,1))}>‹</button>
        <h2>{cursor.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h2>
        <button onClick={() => setCursor(new Date(year,month+1,1))}>›</button>
      </div>
      <div className="calendar-grid">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <strong key={d}>{d}</strong>)}
        {cells.map((day,index) => {
          if (!day) return <div key={`e${index}`} />;
          const key = new Date(year,month,day).toLocaleDateString("en-CA");
          const hasData = Boolean(data[key]);
          return <button key={key} className={`${hasData ? "saved" : ""} ${key === activeDate ? "selected" : ""}`} onClick={() => { setActiveDate(key); setActiveTab("Dashboard"); }}>
            <span>{day}</span>{hasData && <i>●</i>}
          </button>;
        })}
      </div>
      <p className="muted">Tap any past or future date to review or plan it.</p>
    </main>
  );
}

function Settings({settings,setSettings}) {
  const update = (key,value) => setSettings(current => ({...current,[key]:value}));
  const calculate = () => {
    const inches = settings.heightFeet * 12 + settings.heightInches;
    const cm = inches * 2.54;
    const kg = settings.weight * .453592;
    const bmr = 10*kg + 6.25*cm - 5*settings.age + (settings.sex === "male" ? 5 : -161);
    const maintenance = bmr * Number(settings.activity);
    const adjustment = settings.goal === "lose" ? -500 : settings.goal === "lean" ? -250 : settings.goal === "bulk" ? 250 : 0;
    update("calories",Math.max(1200,Math.round((maintenance+adjustment)/10)*10));
    update("protein",Math.round(settings.weight * (settings.goal === "lose" ? 1 : settings.goal === "bulk" ? .85 : .9)));
    update("water",Math.max(8,Math.round(settings.weight*.55/8)));
  };

  return (
    <main className="card settings">
      <p className="eyebrow">PROFILE & GOALS</p><h2>Personalized targets</h2>
      <div className="form-grid">
        <label>Height feet<input type="number" value={settings.heightFeet} onChange={e=>update("heightFeet",Number(e.target.value))}/></label>
        <label>Height inches<input type="number" value={settings.heightInches} onChange={e=>update("heightInches",Number(e.target.value))}/></label>
        <label>Weight<input type="number" value={settings.weight} onChange={e=>update("weight",Number(e.target.value))}/></label>
        <label>Age<input type="number" value={settings.age} onChange={e=>update("age",Number(e.target.value))}/></label>
        <label>Goal<select value={settings.goal} onChange={e=>update("goal",e.target.value)}><option value="lean">Get lean</option><option value="lose">Lose weight</option><option value="maintain">Maintain</option><option value="bulk">Lean bulk</option></select></label>
        <label>Activity<select value={settings.activity} onChange={e=>update("activity",Number(e.target.value))}><option value="1.2">Sedentary</option><option value="1.375">Light</option><option value="1.55">Moderate</option><option value="1.725">Very active</option></select></label>
        <label>Calories<input type="number" value={settings.calories} onChange={e=>update("calories",Number(e.target.value))}/></label>
        <label>Protein<input type="number" value={settings.protein} onChange={e=>update("protein",Number(e.target.value))}/></label>
        <label>Water cups<input type="number" value={settings.water} onChange={e=>update("water",Number(e.target.value))}/></label>
      </div>
      <button className="primary" onClick={calculate}>Recalculate Recommendations</button>
    </main>
  );
}

function Placeholder({title,text}) {
  return <main className="card placeholder"><p className="eyebrow">COMING NEXT</p><h2>{title}</h2><p>{text}</p></main>;
}

export default App;
