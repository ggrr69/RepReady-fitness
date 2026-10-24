/* Goodstride Club: local-only nutrition, habits and dashboard layer.
   This adds wellness views while preserving the original workout program engine. */
(() => {
  const $ = (id) => document.getElementById(id);
  const WELL_KEY = 'goodstride-wellness-v1';
  const defaultWell = () => ({ foods: [], habits: { water:false, mobility:false, protein:false }, extraMobility:false });
  let well;
  try { well = JSON.parse(localStorage.getItem(WELL_KEY)) || defaultWell(); } catch { well = defaultWell(); }
  well.habits = { ...defaultWell().habits, ...(well.habits || {}) };
  well.foods = Array.isArray(well.foods) ? well.foods : [];
  const saveWell = () => { try { localStorage.setItem(WELL_KEY, JSON.stringify(well)); } catch {} };
  let scanner = null;
  const foodSearchResults = $('foodSearchResults');
  const number = (v) => Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
  function showFoodResults(items, source) {
    if (!items.length) { foodSearchResults.innerHTML = '<p class="muted small">No matching foods found. Try another search or enter the details manually.</p>'; return; }
    foodSearchResults.innerHTML = items.map((f,i)=>'<button type="button" class="food-result" data-food-result="'+i+'"><strong>'+safe(f.name)+'</strong><small>'+Math.round(f.cal)+' cal · '+Math.round(f.protein)+' g protein · '+Math.round(f.carbs)+' g carbs · '+Math.round(f.fat)+' g fat'+(f.serving?' · '+safe(f.serving):'')+'</small></button>').join('');
    foodSearchResults.querySelectorAll('[data-food-result]').forEach(b=>b.addEventListener('click',()=> {
      const f=items[Number(b.dataset.foodResult)];
      $('foodName').value=f.name; $('foodCalories').value=Number(f.cal.toFixed(1)); $('foodProtein').value=Number(f.protein.toFixed(1)); $('foodCarbs').value=Number(f.carbs.toFixed(1)); $('foodFat').value=Number(f.fat.toFixed(1)); setSuggestedPortions(f.name); $('foodPortion').value='100'; $('foodServingGrams').value=100; $('customGramsWrap').classList.add('hidden');
      $('foodForm').scrollIntoView({behavior:'smooth',block:'start'});
    }));
  }
  function fromOFF(p) {
    const n=p.nutriments||{};
    return {name:p.product_name||p.product_name_en||'Packaged food',cal:number(n['energy-kcal_100g']??n['energy-kcal']),protein:number(n.proteins_100g),carbs:number(n.carbohydrates_100g),fat:number(n.fat_100g),serving:'per 100 g'};
  }
  async function lookupBarcode(code) {
    if(!/^\d{8,14}$/.test(code)){foodSearchResults.innerHTML='<p class="muted small">Enter a valid barcode number.</p>';return;}
    foodSearchResults.innerHTML='<p class="muted small">Looking up product…</p>';
    try {
      const res=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'?fields=product_name,product_name_en,nutriments,serving_size');
      const data=await res.json();
      if(data.status!==1||!data.product){foodSearchResults.innerHTML='<p class="muted small">Product not found. You can enter its label values manually.</p>';return;}
      const f=fromOFF(data.product); if(data.product.serving_size)f.serving=data.product.serving_size+' (database values may be per 100 g)';
      showFoodResults([f],'barcode');
    } catch { foodSearchResults.innerHTML='<p class="muted small">Couldn’t reach the product database. Check your connection and try again.</p>'; }
  }
  async function searchFoods(query) {
    if(!query.trim())return;
    foodSearchResults.innerHTML='<p class="muted small">Searching everyday foods and packaged products…</p>';
    let everyday=[];
    try {
      const url='https://api.nal.usda.gov/fdc/v1/foods/search?query='+encodeURIComponent(query)+'&pageSize=10&api_key=DEMO_KEY';
      const response=await fetch(url);
      if(response.ok){
        const data=await response.json();
        everyday=(data.foods||[]).map(f=>{
          const ns=f.foodNutrients||[];
          const nutrient=id=>{const n=ns.find(x=>x.nutrientId===id);return number(n?.value);};
          return {name:f.description||f.lowercaseDescription||'Food',cal:nutrient(1008),protein:nutrient(1003),carbs:nutrient(1005),fat:nutrient(1004),serving:'per 100 g',source:'USDA'};
        }).filter(f=>f.name&&f.cal>0);
      }
    } catch {}
    let packaged=[];
    try {
      const url='https://world.openfoodfacts.org/cgi/search.pl?search_terms='+encodeURIComponent(query)+'&search_simple=1&action=process&json=1&page_size=8&fields=product_name,nutriments,serving_size';
      const response=await fetch(url);
      if(response.ok){
        const data=await response.json();
        packaged=(data.products||[]).filter(p=>p.product_name&&p.nutriments).map(p=>fromOFF(p));
      }
    } catch {}
    const combined=[...everyday,...packaged].filter((f,i,a)=>a.findIndex(x=>x.name.toLowerCase()===f.name.toLowerCase())===i).slice(0,15);
    if(combined.length){showFoodResults(combined,'search');return;}
    foodSearchResults.innerHTML='<p class="muted small">No matching foods found in either database. Try a different search or enter the nutrition label manually.</p>';
  }
  const safe = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const totals = () => well.foods.reduce((a,f) => ({cal:a.cal+f.cal, protein:a.protein+f.protein, carbs:a.carbs+(f.carbs||0), fat:a.fat+(f.fat||0)}),{cal:0,protein:0,carbs:0,fat:0});
  const habits = [
    {id:'water',name:'Drink some water',desc:'Hydration is a small win worth repeating.',icon:'◌'},
    {id:'protein',name:'Get a protein serving',desc:'Build meals around a helpful protein source.',icon:'◒'},
    {id:'mobility',name:'Move for 15 minutes',desc:'Stretch, walk, or do comfortable mobility work.',icon:'↗'}
  ];
  function updateDashboard() {
    const t=totals(), done=habits.filter(h=>well.habits[h.id]).length;
    $('todayCalories').textContent=t.cal.toLocaleString(); $('todayProtein').textContent=t.protein;
    $('todayCalBar').style.width=Math.min(100,t.cal/1850*100)+'%';
    $('todayHabits').textContent=done;
    $('caloriesTotal').textContent=t.cal.toLocaleString(); $('proteinTotal').textContent=t.protein;
    $('carbsTotal').textContent=t.carbs+' / 150 g'; $('fatTotal').textContent=t.fat+' / 60 g';
    $('calorieBar').style.width=Math.min(100,t.cal/1850*100)+'%'; $('proteinBar').style.width=Math.min(100,t.protein/180*100)+'%';
    $('progressFoodDays').textContent=t.cal.toLocaleString()+' calories'; $('progressHabitCount').textContent=done+' / 3';
    const currentTitle=$('currentTitle')?.textContent;
    $('progressProgram').textContent=(currentTitle && currentTitle!=='Choose a program')?currentTitle:'Not chosen yet';
    $('todayWorkoutText').textContent=(currentTitle && currentTitle!=='Choose a program')?'Your plan is ready whenever you are.':'Choose a program or keep it a recovery day.';
  }
  function renderFood() {
    const t=totals();
    $('foodLog').innerHTML=well.foods.length ? well.foods.map(f=>'<article class="food-item"><div class="food-dot">＋</div><div class="food-copy"><strong>'+safe(f.name)+'</strong><small>'+f.protein+' g protein'+((f.carbs||f.fat)?' · '+(f.carbs||0)+' g carbs · '+(f.fat||0)+' g fat':'')+'</small></div><div class="food-kcal">'+f.cal+' cal</div><button class="remove-food" data-remove-food="'+f.id+'" aria-label="Remove '+safe(f.name)+'">×</button></article>').join('') : '<div class="empty-state"><div class="empty-icon">＋</div><h3>Your food log starts here</h3><p>Add a food above. You can keep it simple and track calories and protein first.</p></div>';
    document.querySelectorAll('[data-remove-food]').forEach(b=>b.addEventListener('click',()=>{well.foods=well.foods.filter(f=>f.id!==b.dataset.removeFood);saveWell();renderFood();updateDashboard()}));
  }
  function renderHabits() {
    $('habitList').innerHTML=habits.map(h=>'<label class="habit-item '+(well.habits[h.id]?'done':'')+'"><input class="habit-check" type="checkbox" data-habit="'+h.id+'" '+(well.habits[h.id]?'checked':'')+'><span class="well-icon">'+h.icon+'</span><span class="habit-copy"><strong>'+h.name+'</strong><p>'+h.desc+'</p></span></label>').join('');
    document.querySelectorAll('[data-habit]').forEach(c=>c.addEventListener('change',()=>{well.habits[c.dataset.habit]=c.checked;saveWell();renderHabits();updateDashboard()}));
    $('mobilityDone').textContent=well.extraMobility?'✓ Mobility complete today':'✓ Mark mobility complete';
    $('mobilityDone').classList.toggle('secondary',well.extraMobility);
  }
  function showView(view) {
    const map={today:'todayView',workouts:'programsView',programs:'programsView',workout:'workoutView',nutrition:'nutritionView',habits:'habitsView',progress:'progressView',profile:'profileView'};
    document.querySelectorAll('.view').forEach(s=>s.classList.add('hidden'));
    const target=$(map[view]||'todayView'); if(target)target.classList.remove('hidden');
    document.querySelectorAll('.main-tabs .tab').forEach(b=>b.classList.toggle('active',b.dataset.view===(view==='programs'?'workouts':view)));
    if(view==='workout' && typeof window.renderWorkout==='function') window.renderWorkout();
    if(view==='workouts') $('programsView').classList.remove('hidden');
    try { window.scrollTo({top:0,behavior:'smooth'}); } catch {}
    updateDashboard();
  }
  // Existing workout code's callbacks resolve this global function, so its editor stays intact.
  window.setTab = showView;
  document.querySelectorAll('.main-tabs .tab').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  document.querySelectorAll('[data-well-goto]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.wellGoto)));
  const portionPresets = {
    banana:[['1 small banana',101],['1 medium banana',118],['1 large banana',136]],
    egg:[['1 large egg',50],['2 large eggs',100],['3 large eggs',150]],
    rice:[['½ cup cooked',79],['1 cup cooked',158],['1½ cups cooked',237]],
    chicken:[['3 oz cooked',85],['4 oz cooked',113],['6 oz cooked',170]],
    yogurt:[['½ cup',122],['1 cup',245]],
    oatmeal:[['½ cup cooked',117],['1 cup cooked',234]],
    apple:[['1 small apple',149],['1 medium apple',182],['1 large apple',223]]
  };
  function setSuggestedPortions(name) {
    const lower=name.toLowerCase();
    let key=Object.keys(portionPresets).find(k=>lower.includes(k));
    let options=key?portionPresets[key]:[['½ serving',50],['100 g (standard)',100],['1 cup (approx.)',150],['1 oz',28.35],['3 oz',85],['4 oz',113],['6 oz',170]];
    $('foodPortion').innerHTML=options.map(o=>'<option value="'+o[1]+'">'+o[0]+'</option>').join('')+'<option value="custom">Enter grams…</option>';
    $('portionHint').textContent=key?'Approximate portion weights; adjust if your portion differs.':'Choose a familiar portion or enter a custom weight.';
  }
  $('foodPortion').addEventListener('change',()=>{
    const custom=$('foodPortion').value==='custom';
    $('customGramsWrap').classList.toggle('hidden',!custom);
  });
  function addFoodFromForm() {
    const name=$('foodName').value.trim();
    const baseCal=$('foodCalories').value.trim()===''?NaN:Number($('foodCalories').value);
    const baseProtein=$('foodProtein').value.trim()===''?NaN:Number($('foodProtein').value);
    const baseCarbs=$('foodCarbs').value.trim()===''?0:Number($('foodCarbs').value);
    const baseFat=$('foodFat').value.trim()===''?0:Number($('foodFat').value);
    const grams=$('foodPortion').value==='custom' ? ($('foodServingGrams').value.trim()===''?NaN:Number($('foodServingGrams').value)) : Number($('foodPortion').value);
    const missing=[];
    if(!name)missing.push('food name');
    if(!Number.isFinite(baseCal)||baseCal<0)missing.push('calories');
    if(!Number.isFinite(baseProtein)||baseProtein<0)missing.push('protein');
    if(!Number.isFinite(grams)||grams<=0)missing.push('serving size');
    if(missing.length){$('foodFormMessage').textContent='Please check: '+missing.join(', ')+'. Select a search result again if the fields did not fill in.';return;}
    const factor=grams/100;
    const cal=Math.round(baseCal*factor), protein=Number((baseProtein*factor).toFixed(1)), carbs=Number((baseCarbs*factor).toFixed(1)), fat=Number((baseFat*factor).toFixed(1));
    well.foods.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:name+' ('+grams+' g)',cal,protein,carbs,fat,grams});
    saveWell(); $('foodForm').reset(); $('foodPortion').innerHTML='<option value="100">100 g (standard)</option><option value="50">½ serving</option><option value="150">1 cup (approx.)</option><option value="28.35">1 oz</option><option value="85">3 oz</option><option value="113">4 oz</option><option value="170">6 oz</option><option value="custom">Enter grams…</option>'; $('customGramsWrap').classList.add('hidden'); $('foodServingGrams').value=100; $('foodCarbs').value=0; $('foodFat').value=0;
    $('foodFormMessage').textContent='Added '+name+' — '+cal+' calories.';
    renderFood(); updateDashboard();
  }
  $('foodForm').addEventListener('submit',e=>{e.preventDefault();addFoodFromForm()});
  $('addFoodBtn').addEventListener('click',addFoodFromForm);
  $('searchFoodBtn').addEventListener('click',()=>searchFoods($('foodSearch').value));
  $('foodSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchFoods($('foodSearch').value)}});
  $('lookupBarcodeBtn').addEventListener('click',()=>lookupBarcode($('barcodeInput').value.trim()));
  $('barcodeInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupBarcode($('barcodeInput').value.trim())}});
  $('scanBarcodeBtn').addEventListener('click',async()=>{
    const reader=$('barcodeReader');
    if(scanner){try{await scanner.stop();}catch{} scanner=null;reader.classList.add('hidden');$('scanBarcodeBtn').textContent='Scan';return;}
    if(!window.Html5Qrcode){foodSearchResults.innerHTML='<p class="muted small">Camera scanner could not load. Enter the barcode number instead.</p>';return;}
    reader.classList.remove('hidden'); $('scanBarcodeBtn').textContent='Stop scan';
    scanner=new Html5Qrcode('barcodeReader');
    try{await scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:240,height:140}},async(decoded)=>{$('barcodeInput').value=decoded;try{await scanner.stop();}catch{}scanner=null;reader.classList.add('hidden');$('scanBarcodeBtn').textContent='Scan';lookupBarcode(decoded);},()=>{});}
    catch{scanner=null;reader.classList.add('hidden');$('scanBarcodeBtn').textContent='Scan';foodSearchResults.innerHTML='<p class="muted small">Camera access wasn’t available. Allow camera access in your browser settings or enter the barcode number.</p>';}
  });
  $('clearFoodLog').addEventListener('click',()=>{if(!well.foods.length)return;if(confirm("Clear today's food log?")){well.foods=[];saveWell();renderFood();updateDashboard()}});
  $('toggleMacroDetails').addEventListener('click',()=>{const el=$('macroDetails');const hidden=el.classList.toggle('hidden');$('toggleMacroDetails').textContent=hidden?'Show carbs & fat ▾':'Hide carbs & fat ▴'});
  $('mobilityDone').addEventListener('click',()=>{well.extraMobility=!well.extraMobility;well.habits.mobility=well.extraMobility;saveWell();renderHabits();updateDashboard()});
  $('todayDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
  renderFood();renderHabits();updateDashboard();showView('today');
})();
