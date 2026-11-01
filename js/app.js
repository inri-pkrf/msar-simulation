/* לוגיקת המשחק. הפרמטרים שאפשר לשנות נמצאים בראש הקובץ. */
(function () {
  "use strict";
  const STRESS_START = 55; // לחץ התחלתי באחוזים
  const GOOD_DELTA = -14; // שינוי בלחץ אחרי תשובה נכונה
  const BAD_DELTA = 16; // שינוי בלחץ אחרי תשובה שגויה
  const IDLE_MS = 120000; // זמן ללא מגע עד חזרה למסך הפתיחה (2 דקות)

  const EV = window.SCENARIOS;
  const $ = (id) => document.getElementById(id);
  const chat = $("chat"),
    tray = $("tray");
  let i = 0,
    stress = STRESS_START,
    good = 0,
    idle;

  const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
  const nowT = () =>
    new Date().toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // 65 -> "שעה ו־5 דקות", 130 -> "שעתיים ו־10 דקות"
  function fmtMin(m) {
    if (m < 60) return m + " דקות";
    const h = Math.floor(m / 60),
      r = m % 60;
    const hs = h === 1 ? "שעה" : h === 2 ? "שעתיים" : h + " שעות";
    return r ? `${hs} ו־${r} דקות` : hs;
  }

  function setStress(v) {
    stress = Math.max(5, Math.min(100, v));
    const f = $("fill");
    f.style.width = stress + "%";
    f.style.background =
      stress < 40 ? "var(--ok)" : stress < 70 ? "var(--warn)" : "var(--bad)";
    $("pct").textContent = stress + "%";
  }
  function scrollDown() {
    chat.scrollTop = chat.scrollHeight;
    requestAnimationFrame(() => {
      chat.scrollTop = chat.scrollHeight;
    });
  }
  function msg(cls, who, txt) {
    const d = document.createElement("div");
    d.className = "m " + cls;
    d.innerHTML =
      (who ? `<div class="who">${who}</div>` : "") +
      `<div>${txt}</div><div class="t">${nowT()}</div>`;
    chat.appendChild(d);
    scrollDown();
    return d;
  }
  function typing(cls) {
    const d = document.createElement("div");
    d.className = "m " + cls;
    d.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    chat.appendChild(d);
    scrollDown();
    return d;
  }
  function sys(t) {
    const d = document.createElement("div");
    d.className = "sys";
    d.textContent = t;
    chat.appendChild(d);
    scrollDown();
  }

  function showEvent() {
    const e = EV[i];
    tray.innerHTML = "";
    $("phase").textContent = e.ph;
    $("evn").textContent = `הודעה ${i + 1} מתוך ${EV.length}`;
    $("clock").textContent = `⏱ חלפו ${fmtMin(e.min)} מהפגיעה`;
    sys(`${e.ph} · חלפו ${fmtMin(e.min)} מהפגיעה`);
    const tp = typing("in");
    setTimeout(() => {
      tp.remove();
      msg("in", "🔔 " + e.who, e.q);
      setTimeout(() => {
        tray.innerHTML = '<div class="hint">בחירת ההנחיה שלך:</div>';
        shuffle(e.o).forEach((o, k) => {
          const b = document.createElement("button");
          b.className = "opt";
          b.type = "button";
          b.innerHTML = `<b>${"אבג"[k]}</b><span>${o.t}</span>`;
          b.onclick = () => pick(o);
          tray.appendChild(b);
        });
      }, 500);
    }, 1100);
  }

  function pick(o) {
    tray.innerHTML = "";
    msg("out", "ההנחיה שלך", o.t);
    const tp = typing("in");
    setTimeout(() => {
      tp.remove();
      if (o.ok) {
        good++;
        setStress(stress + GOOD_DELTA);
        msg("ok", "✅ חמ״ל · משוב", o.f);
      } else {
        setStress(stress + BAD_DELTA);
        msg(
          "bad",
          "⚠️ התראה: החמרה במצב",
          o.f +
            "<br><b>הנחיית פיקוד העורף:</b> מומלץ לעיין בעקרונות המנחים לניהול מס״ר.",
        );
      }
      const last = i >= EV.length - 1;
      const b = document.createElement("button");
      b.className = "btn";
      b.type = "button";
      b.textContent = last ? "לסיכום המשמרת ◀" : "להודעה הבאה ◀";
      b.onclick = () => {
        if (last) finish();
        else {
          i++;
          showEvent();
        }
      };
      tray.appendChild(b);
    }, 1000);
  }

  function finish() {
    const r =
      good >= 5
        ? ["🏅", "ניהול מצטיין של המס״ר"]
        : good >= 3
          ? ["👍", "בדרך הנכונה"]
          : ["📚", "כדאי לחזור על העקרונות"];
    const o = $("end");
    o.classList.remove("hide");
    o.innerHTML = `<div class="ico">${r[0]}</div><h1>${r[1]}</h1>
  <div class="big">${good}/${EV.length}</div>
  <h2>החלטות נכונות · לחץ סופי בחמ״ל: ${stress}%</h2>
  <div class="card"><b>5 דגשים לניהול המס״ר:</b><br>
  1. תשומת לב ניהולית למרחב הכניסה והרישום - צוואר הבקבוק<br>
  2. הפעלת ״חמ״לון מס״ר״ לתמונת מצב שוטפת<br>
  3. ניהול ממשקי המידע מול גורמי חוץ ומכלולי הרשות<br>
  4. צוות המס״ר הוא המשאב הקריטי<br>
  5. מידע לתושבים - המון, בכל מקום, ובפשטות</div>
  <button class="btn" id="again" type="button">למשמרת חדשה ↻</button>`;
    $("again").onclick = init;
  }

  function init() {
    i = 0;
    good = 0;
    setStress(STRESS_START);
    chat.innerHTML = "";
    tray.innerHTML = "";
    $("end").classList.add("hide");
    $("start").classList.remove("hide");
    $("phase").textContent = "שלב א׳ · הקמה";
    $("evn").textContent = `הודעה 1 מתוך ${EV.length}`;
    $("clock").textContent = `⏱ חלפו ${fmtMin(EV[0].min)} מהפגיעה`;
  }
/* מסך מלא */
const fsBtn=$("fs"),root=document.documentElement;
const canFs=root.requestFullscreen||root.webkitRequestFullscreen;
if(!canFs){fsBtn.classList.add("hide")}
fsBtn.onclick=()=>{
  const on=document.fullscreenElement||document.webkitFullscreenElement;
  if(on){(document.exitFullscreen||document.webkitExitFullscreen).call(document)}
  else{(root.requestFullscreen||root.webkitRequestFullscreen).call(root)}
};
function fsLabel(){
  const on=document.fullscreenElement||document.webkitFullscreenElement;
  fsBtn.textContent=on?"⛶":"⛶";
}
document.addEventListener("fullscreenchange",fsLabel);
document.addEventListener("webkitfullscreenchange",fsLabel);

  $("go").onclick = () => {
    $("start").classList.add("hide");
    showEvent();
  };
  document.addEventListener("pointerdown", () => {
    clearTimeout(idle);
    idle = setTimeout(init, IDLE_MS);
  });
  init();
  /* שומר שהצ'אט תמיד יהיה גלול להודעה האחרונה */
new MutationObserver(scrollDown).observe(chat,{childList:true,subtree:true});
new ResizeObserver(scrollDown).observe(chat);
})();
