const $=id=>document.getElementById(id);
const getData=(key, fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const saveData=(key,val)=>localStorage.setItem(key,JSON.stringify(val));
const today=()=>new Date().toISOString().split("T")[0];
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function showMessage(id,msg){if($(id))$(id).textContent=msg}

function setupSignup(){const f=$("signup-form");if(!f)return;f.addEventListener("submit",e=>{e.preventDefault();const user={name:$("signup-name").value.trim(),email:$("signup-email").value.trim().toLowerCase(),password:$("signup-password").value};saveData("petnestUser",user);showMessage("signup-message","Account created successfully. Redirecting to login...");setTimeout(()=>location.href="login.html",700)})}
function setupLogin(){const f=$("login-form");if(!f)return;f.addEventListener("submit",e=>{e.preventDefault();const user=getData("petnestUser",null),email=$("login-email").value.trim().toLowerCase(),pass=$("login-password").value;if(!user||user.email!==email||user.password!==pass){showMessage("login-message","Invalid email or password.");return}saveData("petnestSession",{name:user.name,email:user.email,loginAt:new Date().toISOString()});showMessage("login-message","Login successful. Opening dashboard...");setTimeout(()=>location.href="dashboard.html",500)})}
function logout(){localStorage.removeItem("petnestSession");location.href="login.html"}
function isLoggedIn(){return !!getData("petnestSession",null)}
function protectPrivatePages(){const pages=["dashboard.html","pet-profile.html","health.html","vaccinations.html","reminders.html","timeline.html"],current=location.pathname.split("/").pop();if(pages.includes(current)&&!isLoggedIn())location.href="login.html"}

let cart=getData("petnestCart",[]);
function addToCart(name,price,image){const found=cart.find(x=>x.name===name);if(found)found.qty++;else cart.push({name,price,image,qty:1});saveData("petnestCart",cart);renderCart();alert(name+" added to cart.");}
function removeFromCart(i){cart.splice(i,1);saveData("petnestCart",cart);renderCart()}
function changeQty(i,d){cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);saveData("petnestCart",cart);renderCart()}
function renderCart(){const count=$("cart-count")||document.querySelector(".cart-count");if(count)count.textContent=cart.reduce((a,x)=>a+x.qty,0);const box=$("cart-items"),total=$("cart-total");if(!box)return;box.innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-row"><img src="${esc(x.image)}" alt=""><div><b>${esc(x.name)}</b><div>${money(x.price)} × ${x.qty}</div><div class="qty"><button onclick="changeQty(${i},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${i},1)">+</button></div></div><button class="delete-btn" onclick="removeFromCart(${i})">Remove</button></div>`).join(""):`<p class="muted">Your cart is empty.</p>`;if(total)total.textContent=money(cart.reduce((a,x)=>a+x.price*x.qty,0))}
function openCart(){$("cart-sidebar")?.classList.add("open");$("cart-overlay")?.classList.add("open");renderCart()}
function closeCart(){$("cart-sidebar")?.classList.remove("open");$("cart-overlay")?.classList.remove("open")}
function checkout(){if(!cart.length){alert("Your cart is empty.");return}alert("Demo checkout complete. No real payment is processed.");cart=[];saveData("petnestCart",cart);renderCart();closeCart()}
function toggleMenu(){$("main-nav")?.classList.toggle("show")}

function savePetProfile(){const p={name:$("pet-name").value.trim(),breed:$("pet-breed").value.trim(),age:$("pet-age").value,weight:$("pet-weight").value,activity:$("pet-activity").value,species:$("pet-species")?.value||"Dog",preferences:$("pet-preferences").value.trim()};saveData("petnestPet",p);showMessage("pet-profile-message","Pet profile saved successfully.");addTimelineSilent("Pet profile updated","General","Profile information was updated.");}
function loadPetProfile(){const p=getData("petnestPet",{});["name","breed","age","weight","activity","preferences"].forEach(k=>{const el=$("pet-"+k);if(el)el.value=p[k]||""});if($("pet-species"))$("pet-species").value=p.species||"Dog"}
function clearPetProfile(){localStorage.removeItem("petnestPet");loadPetProfile();showMessage("pet-profile-message","Pet profile cleared.")}

function saveHealthRecord(){const records=getData("petnestHealth",[]);const r={id:Date.now(),date:today(),weight:$("health-weight").value,activity:$("health-activity").value,appetite:$("health-appetite").value,water:$("health-water").value,observation:$("health-observation").value.trim()};records.unshift(r);saveData("petnestHealth",records);showMessage("health-message","Wellness record saved.");$("health-observation").value="";loadHealthRecords();analyzeWellness();addTimelineSilent("Wellness check logged","Health",`Weight: ${r.weight||"—"} kg; Activity: ${r.activity}.`)}
function loadHealthRecords(){const box=$("health-records");if(!box)return;const rs=getData("petnestHealth",[]);box.innerHTML=rs.length?rs.map(r=>`<div class="record-item"><div><b>${esc(r.date)}</b><div class="muted">Weight ${esc(r.weight)} kg • Activity ${esc(r.activity)} • Appetite ${esc(r.appetite)} • Water ${esc(r.water)}</div>${r.observation?`<div>${esc(r.observation)}</div>`:""}</div><button class="delete-btn" onclick="deleteHealthRecord(${r.id})">Delete</button></div>`).join(""):`<p class="muted">No wellness records yet.</p>`}
function deleteHealthRecord(id){saveData("petnestHealth",getData("petnestHealth",[]).filter(x=>x.id!==id));loadHealthRecords();analyzeWellness()}
function clearHealthHistory(){if(confirm("Clear all wellness records?")){localStorage.removeItem("petnestHealth");loadHealthRecords();analyzeWellness()}}
function analyzeWellness(){const box=$("analyzer-result");if(!box)return;const rs=getData("petnestHealth",[]);if(rs.length<2){box.innerHTML="<p>Add at least two records to generate a trend review.</p>";return}const latest=rs[0],prev=rs[1],notes=[];if(latest.weight&&prev.weight){const diff=Number(latest.weight)-Number(prev.weight);if(Math.abs(diff)>=0.5)notes.push(`Weight changed by ${diff>0?"+":""}${diff.toFixed(1)} kg since the previous record.`)}if(latest.activity!==prev.activity)notes.push(`Activity changed from ${prev.activity} to ${latest.activity}.`);if(latest.appetite!=="Normal")notes.push(`Appetite is recorded as ${latest.appetite.toLowerCase()}.`);if(latest.water!=="Normal")notes.push(`Water intake is recorded as ${latest.water.toLowerCase()}.`);box.innerHTML=notes.length?`<b>Changes to monitor</b><ul>${notes.map(esc).map(x=>`<li>${x}</li>`).join("")}</ul><p class="muted">This is a summary of owner-entered data, not a medical diagnosis. Persistent or concerning changes should be discussed with a veterinarian.</p>`:"<b>No major change detected in the latest two entries.</b><p class='muted'>Continue recording observations consistently.</p>"}

function saveVaccination(){const rs=getData("petnestVaccines",[]),r={id:Date.now(),name:$("vaccine-name").value.trim(),date:$("vaccine-date").value,next:$("vaccine-next-date").value,notes:$("vaccine-notes").value.trim()};rs.unshift(r);saveData("petnestVaccines",rs);showMessage("vaccine-message","Vaccination saved.");$("vaccine-name").value="";$("vaccine-notes").value="";loadVaccinations();addTimelineSilent("Vaccination recorded","Vaccination",r.name)}
function loadVaccinations(){const box=$("vaccination-list");if(!box)return;const rs=getData("petnestVaccines",[]);box.innerHTML=rs.length?rs.map(r=>`<div class="record-item"><div><b>${esc(r.name)}</b><div class="muted">Given: ${esc(r.date)} ${r.next?`• Next due: ${esc(r.next)}`:""}</div>${r.notes?`<div>${esc(r.notes)}</div>`:""}</div><button class="delete-btn" onclick="deleteVaccination(${r.id})">Delete</button></div>`).join(""):`<p class="muted">No vaccinations recorded yet.</p>`;const sum=$("vaccine-summary");if(sum){const upcoming=rs.filter(r=>r.next&&r.next>=today()).length;sum.innerHTML=`<div class="snapshot"><b>${rs.length}</b><span>Total records</span></div><div class="snapshot"><b>${upcoming}</b><span>Upcoming dates saved</span></div>`}}
function deleteVaccination(id){saveData("petnestVaccines",getData("petnestVaccines",[]).filter(x=>x.id!==id));loadVaccinations()}

let reminderFilter="all";
function saveReminder(){
  const rs=getData("petnestReminders",[]);
  const r={
    id:Date.now(),
    title:$("reminder-title").value.trim(),
    type:$("reminder-type").value,
    date:$("reminder-date").value,
    time:$("reminder-time")?.value||"09:00",
    leadDays:Number($("reminder-timing")?.value ?? $("reminder-lead")?.value ?? 0),
    notes:$("reminder-notes").value.trim(),
    completed:false
  };
  if(!r.date){showMessage("reminder-message","Please choose a reminder date.");return}
  rs.push(r);saveData("petnestReminders",rs);
  showMessage("reminder-message","Reminder added. PetNest will check its notification time while the website is open.");
  $("reminder-title").value="";$("reminder-notes").value="";
  loadReminders();renderOverdueReminders();renderCareSuggestions();loadDashboard();
  addTimelineSilent("Reminder created","General",r.title);
}
function filterReminders(f){reminderFilter=f;loadReminders()}
function reminderDateTime(r){
  const [y,m,d]=(r.date||today()).split("-").map(Number);
  const [hh,mm]=(r.time||"09:00").split(":").map(Number);
  return new Date(y,m-1,d,hh||0,mm||0,0,0);
}
function notificationDateTime(r){
  const due=reminderDateTime(r);
  due.setDate(due.getDate()-Number(r.leadDays||0));
  return due;
}
function formatReminderTiming(r){
  const lead=Number(r.leadDays||0);
  const timing=lead===0?"on the day":lead===1?"1 day before":lead===3?"3 days before":lead===7?"1 week before":`${lead} days before`;
  return `${r.date||"No date"} at ${r.time||"09:00"} • Notify ${timing}`;
}
function loadReminders(){
  const box=$("reminder-list");if(!box)return;
  let rs=getData("petnestReminders",[]);
  if(reminderFilter==="pending")rs=rs.filter(r=>!r.completed);
  if(reminderFilter==="completed")rs=rs.filter(r=>r.completed);
  if(reminderFilter==="overdue")rs=rs.filter(r=>!r.completed&&r.date<today());
  rs.sort((a,b)=>reminderDateTime(a)-reminderDateTime(b));
  box.innerHTML=rs.length?rs.map(r=>`<div class="record-item ${r.completed?"done":""} ${!r.completed&&r.date<today()?"overdue-item":""}"><div><b>${esc(r.title)}</b><div class="muted">${esc(r.type)} • ${esc(formatReminderTiming(r))}</div>${!r.completed&&r.date<today()?'<span class="overdue-label">OVERDUE</span>':""}${r.notes?`<div>${esc(r.notes)}</div>`:""}</div><div><button class="complete-btn" onclick="completeReminder(${r.id})">${r.completed?"Undo":"Complete"}</button><button class="delete-btn" onclick="deleteReminder(${r.id})">Delete</button></div></div>`).join(""):`<p class="muted">No reminders in this view.</p>`;
}
function renderOverdueReminders(){
  const rs=getData("petnestReminders",[]).filter(r=>!r.completed&&r.date<today()).sort((a,b)=>a.date.localeCompare(b.date));
  const markup=rs.length?rs.map(r=>`<div class="record-item overdue-item"><div><b>${esc(r.title)}</b><div class="muted">${esc(r.type)} • Due ${esc(r.date)} at ${esc(r.time||"09:00")}</div><span class="overdue-label">Overdue</span></div><div><button class="complete-btn" onclick="completeReminder(${r.id})">Complete</button><button class="delete-btn" onclick="deleteReminder(${r.id})">Delete</button></div></div>`).join(""):`<p class="muted">No overdue reminders. You're all caught up.</p>`;
  if($("overdue-reminders"))$("overdue-reminders").innerHTML=markup;
  if($("dashboard-overdue-reminders"))$("dashboard-overdue-reminders").innerHTML=markup;
  if($("overdue-alerts")){
    $("overdue-alerts").innerHTML=rs.length?`<div class="info-banner warning"><i class='bx bx-error'></i><div><strong>${rs.length} overdue reminder${rs.length===1?"":"s"}</strong><br><span>Please review your overdue care tasks below.</span></div></div>`:"";
  }
}
function completeReminder(id){const rs=getData("petnestReminders",[]);const r=rs.find(x=>x.id===id);if(r)r.completed=!r.completed;saveData("petnestReminders",rs);loadReminders();renderOverdueReminders();loadDashboard()}
function deleteReminder(id){saveData("petnestReminders",getData("petnestReminders",[]).filter(x=>x.id!==id));loadReminders();renderOverdueReminders();renderCareSuggestions();loadDashboard()}

function notificationSupported(){
  return "Notification" in window;
}

function isNotificationContextSupported(){
  return window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function enableNotifications(){
  requestNotificationPermission();
}

async function requestNotificationPermission(){
  if(!notificationSupported()){
    showNotificationStatus("This browser does not support browser notifications.");
    return;
  }

  if(!isNotificationContextSupported()){
    showNotificationStatus("Open PetNest with VS Code Live Server (localhost) or HTTPS to use notifications.");
    return;
  }

  try{
    let permission=Notification.permission;

    if(permission!=="granted"){
      permission=await Notification.requestPermission();
    }

    updateNotificationStatus();

    if(permission==="granted"){
      showNotificationStatus("Notifications are enabled. PetNest will check your reminders automatically while this site is open.");

      // Give the user an immediate confirmation that browser notifications work.
      try{
        const test=new Notification("PetNest notifications enabled",{
          body:"Your reminder alerts are ready.",
          tag:"petnest-notification-test"
        });
        test.onclick=()=>{window.focus();test.close()};
      }catch(error){
        console.error("PetNest test notification failed:",error);
        showNotificationStatus("Permission is enabled, but the browser did not display the test notification.");
      }

      checkReminderNotifications();
      startReminderMonitor();
    }else if(permission==="denied"){
      showNotificationStatus("Notifications are blocked. Allow notifications for this site in your browser settings, then reload PetNest.");
    }else{
      showNotificationStatus("Notification permission was not granted.");
    }
  }catch(error){
    console.error("PetNest notification permission error:",error);
    showNotificationStatus("Could not enable notifications in this browser.");
  }
}

function showNotificationStatus(message){
  const box=$("notification-status");
  if(box)box.innerHTML=`<i class='bx bx-bell'></i> ${esc(message)}`;
}

function updateNotificationStatus(){
  const status=$("notification-status");
  if(!status)return;

  if(!notificationSupported()){
    status.innerHTML="<i class='bx bx-error-circle'></i> Browser notifications are not supported.";
    return;
  }

  if(!isNotificationContextSupported()){
    status.innerHTML="<i class='bx bx-lock-alt'></i> Use VS Code Live Server (localhost) or HTTPS for notifications.";
    return;
  }

  const state=Notification.permission;
  if(state==="granted"){
    status.innerHTML="<i class='bx bx-check-circle'></i> Notifications are enabled.";
  }else if(state==="denied"){
    status.innerHTML="<i class='bx bx-block'></i> Notifications are blocked in browser settings.";
  }else{
    status.innerHTML="<i class='bx bx-bell'></i> Notifications are not enabled yet.";
  }
}

function notificationKey(r){
  return `${r.id}:${r.date}:${r.time||"09:00"}:${Number(r.leadDays||0)}`;
}

function checkReminderNotifications(){
  if(!notificationSupported()||Notification.permission!=="granted")return;
  if(!isNotificationContextSupported())return;

  const now=new Date();
  const rs=getData("petnestReminders",[]);
  const sent=getData("petnestNotifiedReminders",[]);
  let changed=false;

  rs.forEach(r=>{
    if(r.completed||!r.date)return;

    const due=reminderDateTime(r);
    const notifyAt=notificationDateTime(r);
    const dueEnd=new Date(due);
    dueEnd.setHours(23,59,59,999);
    const key=notificationKey(r);

    // Notify from the selected notification time until the end of the reminder day.
    // This also handles opening the website late: the missed alert is shown once.
    if(now>=notifyAt&&now<=dueEnd&&!sent.includes(key)){
      const pet=getData("petnestPet",{});
      const petName=pet.name?`${pet.name}'s `:"";
      const lead=Number(r.leadDays||0);
      const dueText=due.toLocaleString(undefined,{
        day:"numeric",
        month:"short",
        hour:"numeric",
        minute:"2-digit"
      });
      const body=lead===0
        ? `${petName}${r.title} is due now (${dueText}).`
        : `${petName}${r.title} is scheduled for ${dueText}.`;

      try{
        const notification=new Notification("PetNest care reminder",{
          body,
          tag:key,
          renotify:true
        });
        notification.onclick=()=>{
          window.focus();
          location.href="reminders.html";
          notification.close();
        };

        sent.push(key);
        changed=true;
      }catch(error){
        console.error("PetNest reminder notification failed:",error);
      }
    }
  });

  if(changed)saveData("petnestNotifiedReminders",sent);
}

let reminderMonitor=null;
function startReminderMonitor(){
  if(reminderMonitor)clearInterval(reminderMonitor);

  updateNotificationStatus();
  checkReminderNotifications();

  // Frontend-only reminder checking: works while PetNest is open.
  reminderMonitor=setInterval(()=>{
    checkReminderNotifications();
  },15000);
}

function generateCareSuggestions(){
  const p=getData("petnestPet",{}),health=getData("petnestHealth",[]),vaccines=getData("petnestVaccines",[]),reminders=getData("petnestReminders",[]);
  const suggestions=[];
  if(!p.name)suggestions.push(["bx-user-plus","Complete the pet profile","Add your pet's name, species, age and preferences to personalize the dashboard.","pet-profile.html"]);
  if(!health.length)suggestions.push(["bx-line-chart","Start wellness tracking","Record weight, activity, appetite and water intake to create a baseline.","health.html"]);
  else{
    const last=health.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""))[0];
    const days=last?.date?Math.floor((new Date(today()+"T00:00:00")-new Date(last.date+"T00:00:00"))/86400000):999;
    if(days>=7)suggestions.push(["bx-calendar-check","Log a wellness update",`Your latest saved wellness entry is ${days} days old. Add a new observation if useful.`,"health.html"]);
  }
  const upcomingVaccines=vaccines.filter(v=>v.next&&v.next>=today()).sort((a,b)=>a.next.localeCompare(b.next));
  const overdueVaccines=vaccines.filter(v=>v.next&&v.next<today());
  if(overdueVaccines.length)suggestions.push(["bx-injection","Review recorded vaccine dates",`${overdueVaccines.length} saved vaccination record(s) have a past next-due date. Confirm the schedule with your veterinarian.`,"vaccinations.html"]);
  else if(upcomingVaccines.length)suggestions.push(["bx-injection","Upcoming vaccination date",`${upcomingVaccines[0].name} has a saved next-due date of ${upcomingVaccines[0].next}.`,"vaccinations.html"]);
  else suggestions.push(["bx-injection","Review vaccination records","Add the dates from your pet's vaccination record, including next-due dates provided by your veterinarian.","vaccinations.html"]);
  if(!reminders.some(r=>!r.completed))suggestions.push(["bx-bell-plus","Set a routine care reminder","Add a grooming, vet, dental-care or food-reorder reminder that fits your routine.","reminders.html"]);
  if(p.activity==="Low")suggestions.push(["bx-walk","Review activity routine","If you have questions about suitable activity for your pet, discuss an appropriate routine with your veterinarian.","pet-profile.html"]);
  if(p.preferences&&/allerg|sensitiv|special|prescription/i.test(p.preferences))suggestions.push(["bx-bowl-hot","Check saved care preferences","Review your saved food or care preferences before choosing products.","index.html#products"]);
  return suggestions.slice(0,6);
}
function renderCareSuggestions(){
  const suggestions=generateCareSuggestions();
  const html=suggestions.length?suggestions.map(s=>`<a class="suggestion-card" href="${s[3]}"><i class='bx ${s[0]}'></i><div><b>${esc(s[1])}</b><p>${esc(s[2])}</p></div></a>`).join(""):`<p class="muted">No suggestions right now.</p>`;
  if($("reminder-care-suggestions"))$("reminder-care-suggestions").innerHTML=html;
  if($("dashboard-care-suggestions"))$("dashboard-care-suggestions").innerHTML=html;
}

function addTimelineSilent(title,type,details){const rs=getData("petnestTimeline",[]);rs.unshift({id:Date.now()+Math.random(),title,type,details,date:today()});saveData("petnestTimeline",rs)}
function addTimelineEvent(){const title=$("timeline-title").value.trim(),date=$("timeline-date").value||today();if(!title)return;const rs=getData("petnestTimeline",[]);rs.unshift({id:Date.now(),title,type:$("timeline-type").value,details:$("timeline-details").value.trim(),date});saveData("petnestTimeline",rs);showMessage("timeline-message","Timeline event added.");$("timeline-title").value="";$("timeline-details").value="";loadTimeline()}
function loadTimeline(){const box=$("timeline-list");if(!box)return;const rs=getData("petnestTimeline",[]).sort((a,b)=>b.date.localeCompare(a.date));box.innerHTML=rs.length?rs.map(r=>`<div class="timeline-item"><div class="timeline-date">${esc(r.date)} • ${esc(r.type)}</div><div class="timeline-content"><h3>${esc(r.title)}</h3>${r.details?`<p>${esc(r.details)}</p>`:""}<button class="delete-btn" onclick="deleteTimeline(${r.id})">Delete</button></div></div>`).join(""):`<p class="muted">No timeline events yet.</p>`}
function deleteTimeline(id){saveData("petnestTimeline",getData("petnestTimeline",[]).filter(x=>x.id!==id));loadTimeline()}
function clearTimeline(){if(confirm("Clear the entire timeline?")){localStorage.removeItem("petnestTimeline");loadTimeline()}}

function loadDashboard(){
  const s=getData("petnestSession",{}),
        p=getData("petnestPet",{}),
        h=getData("petnestHealth",[]),
        v=getData("petnestVaccines",[]),
        r=getData("petnestReminders",[]),
        t=getData("petnestTimeline",[]);

  if($("welcome-name"))$("welcome-name").textContent=s.name||"Pet Parent";
  if($("dashboard-pet-name"))$("dashboard-pet-name").textContent=p.name||"Your Pet";
  if($("dashboard-pet-breed"))$("dashboard-pet-breed").textContent=p.breed?`${p.species||"Pet"} • ${p.breed}`:"Add a pet profile to begin.";
  if($("dashboard-pet-age"))$("dashboard-pet-age").textContent=p.age?p.age+" yrs":"—";
  if($("dashboard-pet-weight"))$("dashboard-pet-weight").textContent=p.weight?p.weight+" kg":"—";

  if($("health-count"))$("health-count").textContent=h.length;
  if($("vaccine-count"))$("vaccine-count").textContent=v.length;
  if($("reminder-count"))$("reminder-count").textContent=r.filter(x=>!x.completed).length;
  if($("timeline-count"))$("timeline-count").textContent=t.length;

  const up=$("upcoming-reminders");
  if(up){
    const upcoming=r
      .filter(x=>!x.completed&&x.date>=today())
      .sort((a,b)=>reminderDateTime(a)-reminderDateTime(b))
      .slice(0,5);

    up.innerHTML=upcoming.length
      ? upcoming.map(x=>{
          const d=reminderDateTime(x);
          return `<div class="list-item">
            <div>
              <b>${esc(x.title)}</b>
              <div class="muted">${esc(x.type)} • ${esc(formatReminderTiming(x))}</div>
            </div>
            <strong>${esc(d.toLocaleDateString(undefined,{day:"numeric",month:"short"}))}</strong>
          </div>`;
        }).join("")
      : `<p class="muted">No upcoming reminders.</p>`;
  }

  const snap=$("dashboard-wellness");
  if(snap){
    const last=h[0];
    snap.innerHTML=`
      <div class="snapshot"><b>${last?.weight||p.weight||"—"} kg</b><span>Latest weight</span></div>
      <div class="snapshot"><b>${last?.activity||"—"}</b><span>Activity</span></div>
      <div class="snapshot"><b>${last?.appetite||"—"}</b><span>Appetite</span></div>
      <div class="snapshot"><b>${last?.water||"—"}</b><span>Water</span></div>`;
  }

  renderCareSuggestions();
  renderOverdueReminders();
  analyzeWellness();
}

function subscribeNewsletter(e){e.preventDefault();const input=$("newsletter-email");if(!input)return;const email=input.value.trim().toLowerCase(),subs=getData("petnestSubscribers",[]);if(!subs.includes(email))subs.push(email);saveData("petnestSubscribers",subs);alert("Thank you for subscribing to PetNest!");input.value=""}

function setDefaults(){["reminder-date","timeline-date"].forEach(id=>{if($(id)&&!$(id).value)$(id).value=today()});if($("vaccine-date")&&!$("vaccine-date").value)$("vaccine-date").value=today()}
document.addEventListener("DOMContentLoaded",()=>{protectPrivatePages();setupSignup();setupLogin();loadPetProfile();loadHealthRecords();loadVaccinations();loadReminders();loadTimeline();loadDashboard();renderCareSuggestions();renderCart();setDefaults();startReminderMonitor()});
window.addToCart=addToCart;window.openCart=openCart;window.closeCart=closeCart;window.changeQty=changeQty;window.removeFromCart=removeFromCart;window.checkout=checkout;window.toggleMenu=toggleMenu;window.logout=logout;window.savePetProfile=savePetProfile;window.clearPetProfile=clearPetProfile;window.saveHealthRecord=saveHealthRecord;window.deleteHealthRecord=deleteHealthRecord;window.clearHealthHistory=clearHealthHistory;window.analyzeWellness=analyzeWellness;window.saveVaccination=saveVaccination;window.deleteVaccination=deleteVaccination;window.saveReminder=saveReminder;window.filterReminders=filterReminders;window.completeReminder=completeReminder;window.deleteReminder=deleteReminder;window.enableNotifications=enableNotifications;window.requestNotificationPermission=requestNotificationPermission;window.renderCareSuggestions=renderCareSuggestions;window.requestNotificationPermission=requestNotificationPermission;window.addTimelineEvent=addTimelineEvent;window.deleteTimeline=deleteTimeline;window.clearTimeline=clearTimeline;window.subscribeNewsletter=subscribeNewsletter;