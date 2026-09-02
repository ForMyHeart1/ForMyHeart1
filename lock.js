/* ============================================================
   lock.js — قفل ماشین‌حساب با دو رمز مخفی (بدون بیومتریک)
   صفحه‌ی اول همیشه یه ماشین‌حساب واقعیه.

   مرحله‌ی اول: یه عبارت خاص رو محاسبه می‌کنی (مثلاً 1207+0=)
                → یه نقطه‌ی خیلی کوچیک گوشه‌ی صفحه سبز می‌شه
   مرحله‌ی دوم: همون نقطه رو لمس می‌کنی، صفحه پاک می‌شه،
                یه عبارت خاص دیگه وارد می‌کنی (مثلاً 808*2=)
                → اگه درست بود، اپ واقعی باز می‌شه
   ============================================================ */

// این دو رمز رو به هرچی دوست داری تغییر بده (فقط رقم و عملگر ساده: + - * /)
const SECRET_TRIGGER_1 = "1207+0";
const SECRET_TRIGGER_2 = "808*2";

// بعد از باز شدن مرحله‌ی اول یا دوم، اگه ظرف این‌همه ثانیه استفاده نشه، خودش قفل می‌شه
const STAGE_TIMEOUT_MS = 20000;

let display = "";
let stage1Unlocked = false; // نقطه سبز شده، ولی هنوز لمس نشده
let stage2Active = false;   // نقطه لمس شده، الان منتظر رمز دومه
let stageTimer = null;

const calcDisplay = document.getElementById("calc-display");
const dot = document.getElementById("secret-dot");

// ---------- منطق ماشین‌حساب واقعی ----------
function calcPress(val){
  if(val === "C"){
    display = "";
  } else if(val === "="){
    evaluateExpression();
    return;
  } else if(val === "⌫"){
    display = display.slice(0, -1);
  } else {
    display += val;
  }
  calcDisplay.textContent = display || "0";
}

function normalized(str){
  return str.trim().replace(/\s/g, "");
}

function evaluateExpression(){
  const raw = normalized(display);

  // ---------- مرحله‌ی دوم فعاله: منتظر رمز دوم ----------
  if(stage2Active){
    if(raw === SECRET_TRIGGER_2){
      clearTimeout(stageTimer);
      calcDisplay.textContent = "";
      // یه تاخیر کوچیک، بعد اپ واقعی باز می‌شه
      setTimeout(()=> window.unlockRealApp(), 250);
      return;
    }
    // رمز دوم اشتباه بود → همه‌چیز دوباره کاملاً قفل می‌شه (بدون هیچ نشونه‌ای)
    stage2Active = false;
    resetStage1();
  }

  // ---------- چک کردن رمز اول (قبل از محاسبه‌ی واقعی) ----------
  if(raw === SECRET_TRIGGER_1){
    unlockStage1();
  }

  // ---------- محاسبه‌ی واقعی و عادی (همیشه اجرا می‌شه، برای اینکه شبیه ماشین‌حساب واقعی بمونه) ----------
  try{
    if(!/^[0-9+\-*/.() ]+$/.test(raw)){
      calcDisplay.textContent = "Error";
      display = "";
      return;
    }
    const result = Function('"use strict"; return (' + raw + ")")();
    display = String(result);
    calcDisplay.textContent = display;
  } catch(err){
    calcDisplay.textContent = "Error";
    display = "";
  }
}

// ---------- مرحله‌ی اول: باز شدن نقطه‌ی کوچیک مخفی ----------
function unlockStage1(){
  stage1Unlocked = true;
  dot.classList.add("armed");
  clearTimeout(stageTimer);
  stageTimer = setTimeout(resetStage1, STAGE_TIMEOUT_MS);
}

function resetStage1(){
  stage1Unlocked = false;
  stage2Active = false;
  dot.classList.remove("armed");
}

// ---------- لمس نقطه: رفتن به مرحله‌ی دوم ----------
dot.addEventListener("click", ()=>{
  if(!stage1Unlocked) return; // اگه رمز اول درست وارد نشده، این نقطه هیچ‌کاری نمی‌کنه

  stage1Unlocked = false;
  stage2Active = true;
  dot.classList.remove("armed"); // نقطه دوباره عادی می‌شه، انگار هیچ‌اتفاقی نیفتاده

  display = "";
  calcDisplay.textContent = "0";

  clearTimeout(stageTimer);
  stageTimer = setTimeout(resetStage1, STAGE_TIMEOUT_MS);
});
