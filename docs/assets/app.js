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
  try{STATE.birth=STATE.user?await API.birth():null}catch(e){STATE.birth=null}
  $("rememberRow").hidden=!STATE.user;if(!STATE.user)$("remember").checked=false;
  renderAccount();
}
// 帳號裡記住的生辰：填回表單並勾選「記住」。每次載入頁面只帶入一次，免得蓋掉正在修改的內容；
// 分享連結與範例報告優先，「記住」也不勾，免得按下推演時把別人的生辰存進自己的帳號
var birthUsed=false;
function useSavedBirth(){
  if(birthUsed||!STATE.birth||SAMPLE||new URLSearchParams(location.search).get("b"))return;
  birthUsed=true;fillForm(STATE.birth);$("sampleNote").hidden=true;$("remember").checked=true;
}
// 按下「推演命盤」且勾選「記住」才存；不勾就不動帳號裡的資料，刪除只能從帳號選單的「刪除我的生辰」
async function syncBirth(){
  $("rememberMsg").hidden=true;
  if(!STATE.user||!STATE.input||!$("remember").checked)return;
  var msg=$("rememberMsg");msg.hidden=false;
  try{await API.saveBirth(STATE.input);STATE.birth=STATE.input;msg.textContent="已記住你的生辰，下次登入會自動帶入。"}
  catch(e){msg.textContent="記住生辰失敗："+e.message}
  renderAccount();
}
async function forgetBirth(){
  if(!confirm("要刪除帳號裡記住的生辰嗎？目前畫面上的命盤不受影響。"))return;
  try{await API.deleteBirth();STATE.birth=null;$("remember").checked=false;$("rememberMsg").hidden=false;$("rememberMsg").textContent="已刪除帳號裡的生辰。"}
  catch(e){alert("刪除失敗："+e.message)}
  renderAccount();
}
$("f").addEventListener("submit",function(e){e.preventDefault();$("sampleNote").hidden=true;exitSample();setMode("report");run().then(function(){
  if(STATE.rep&&$("err").hidden)syncBirth();
  if(window.innerWidth<880)$("verdictBlock").scrollIntoView({behavior:"smooth"})})});
// 左欄放得進視窗才固定在畫面上；放不下（例如展開表單、視窗縮小）就跟著頁面捲動
function fitForm(){var a=$("side");a.classList.toggle("tall",a.offsetHeight>window.innerHeight-32)}
if(window.ResizeObserver)new ResizeObserver(fitForm).observe($("side"));
fitForm();
var rzT;window.addEventListener("resize",function(){fitForm();clearTimeout(rzT);rzT=setTimeout(renderChart,120)});
bindTools();
applyParams();
// 回呼裡不能直接呼叫 Supabase（官方說明會造成死結），延後到下一輪事件迴圈
// 範例報告模式不向伺服器排盤；登入狀態改變時也只更新帳號資訊
API.onAuth(function(ev){if(ev==="SIGNED_IN"||ev==="SIGNED_OUT"||ev==="USER_UPDATED")setTimeout(function(){if($("loginDlg").open)$("loginDlg").close();refreshAccount().then(function(){if(!SAMPLE){if(ev==="SIGNED_IN")useSavedBirth();run()}})},0)});
if(sampleTierFromURL()){refreshAccount();loadSample(sampleTierFromURL())}
else refreshAccount().then(function(){useSavedBirth();run()});
