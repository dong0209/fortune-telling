/* 主流程：讀取表單 → 向伺服器要報告 → 繪製；登入狀態改變時重新推演 */
function readInput(){
  var noTime=$("noTime").checked||!$("bt").value;
  return {date:$("bd").value,time:noTime?null:$("bt").value,noTime:noTime,gender:$("gM").checked?"男":"女",city:+$("city").value,q:$("q").value,yrs:+$("yrs").value,name:$("nm").value.trim(),solar:$("solar").checked};
}
async function run(){
  $("err").hidden=true;
  if(!API.ready){
    $("verdictBlock").innerHTML='<p class="notice">網站尚未連上會員系統。請在 <code>docs/assets/config.js</code> 填入 Supabase 網址與金鑰，並依 DEPLOY.md 部署伺服器函式。</p>';
    return;
  }
  var inp=readInput();
  if(!inp.date){$("err").textContent="請輸入出生日期。";$("err").hidden=false;return}
  $("go").disabled=true;
  if(!STATE.rep)loading("verdictBlock","正在推演命盤…");
  try{
    var r=await API.analyze("report",inp);
    STATE.rep=r.result;STATE.input=inp;
    renderAll(r.result);applyTierUI(r.tier);
  }catch(e){$("err").textContent=e.message;$("err").hidden=false;if(!STATE.rep)$("verdictBlock").innerHTML='<p class="err">'+esc(e.message)+'</p>'}
  finally{$("go").disabled=false}
}
async function refreshAccount(){
  try{STATE.user=await API.user();STATE.profile=STATE.user?await API.profile():null}catch(e){STATE.profile=null}
  renderAccount();
}
$("f").addEventListener("submit",function(e){e.preventDefault();$("sampleNote").hidden=true;run().then(function(){if(window.innerWidth<880)$("verdictBlock").scrollIntoView({behavior:"smooth"})})});
// 側欄放得進視窗才固定在畫面上；放不下（例如勾選選項讓欄位變長、視窗縮小）就跟著頁面捲動
function fitForm(){var a=document.querySelector("aside.form");a.classList.toggle("tall",a.offsetHeight>window.innerHeight-32)}
if(window.ResizeObserver)new ResizeObserver(fitForm).observe(document.querySelector("aside.form"));
fitForm();
var rzT;window.addEventListener("resize",function(){fitForm();clearTimeout(rzT);rzT=setTimeout(renderChart,120)});
bindTools();
applyParams();
// 回呼裡不能直接呼叫 Supabase（官方說明會造成死結），延後到下一輪事件迴圈
API.onAuth(function(ev){if(ev==="SIGNED_IN"||ev==="SIGNED_OUT"||ev==="USER_UPDATED")setTimeout(function(){if($("loginDlg").open)$("loginDlg").close();refreshAccount().then(run)},0)});
refreshAccount().then(run);
