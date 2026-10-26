/* 範例報告：網址加上 ?sample=free|paid|vip，顯示虛構人物張三豐在各等級實際會看到的內容。
 * 資料由 tests/build-sample.mjs 事先產生（assets/sample/*.json），不會呼叫伺服器；VIP 專屬區塊只露出上半部。 */
var SAMPLE=null, SAMPLE_TIERS=["free","paid","vip"], realAnalyze=API.analyze;
var VIP_PANELS=["p-meihua","p-ninestar","p-qimen","p-hd"];
function sampleTierFromURL(){var t=new URLSearchParams(location.search).get("sample");return SAMPLE_TIERS.indexOf(t)>=0?t:null}

// 範例模式下的「伺服器」：只回答事先算好的查詢
async function sampleAnalyze(action,input,params){
  var S=SAMPLE;params=params||{};
  if(action==="compare"){
    if(JSON.stringify(params.systems)===JSON.stringify(SAMPLE.defaultSystems))return {tier:S.tier,result:S.compare};
    throw new Error("範例只示範預設的學派組合。用自己的生日排盤後，就能自由選擇要比對的學派。");
  }
  if(action==="month"&&S.month&&S.month[+params.i])return {tier:S.tier,result:S.month[+params.i]};
  if(action==="qimenDay"&&S.qimenDay){
    if(params.date===S.today)return {tier:S.tier,result:S.qimenDay};
    throw new Error("範例只提供 "+S.today.replace(/-/g,"/")+" 的擇時。用自己的生日排盤後，可以查任何日期。");
  }
  throw new Error("這是範例報告，這項查詢要用自己的生日排盤後才能使用。");
}

function fillSampleForm(inp){
  $("bd").value=inp.date;$("bt").value=inp.time||"";$("noTime").checked=!!inp.noTime;$("bt").disabled=!!inp.noTime;
  (inp.gender==="男"?$("gM"):$("gF")).checked=true;setCity(inp.city);
  $("q").value=inp.q;$("yrs").value=String(inp.yrs);$("nm").value=inp.name||"";$("solar").checked=inp.solar!==false;
}

function renderSampleBar(){
  var S=SAMPLE, inp=S.input;
  $("sampleBar").innerHTML='<div class="sample-head"><div><p class="eyebrow"><span>範例報告</span>Sample</p>'+
    '<h2>'+esc(S.person.name)+'<span class="muted small">（'+esc(S.person.note)+'）</span></h2>'+
    '<p class="small muted">'+esc(inp.date.replace(/-/g,"/")+" "+(inp.time||"")+" 生於"+cityLabel(inp.city)+"・"+inp.gender)+'。以 '+S.today.replace(/-/g,"/")+' 為「今天」計算每日運勢與時機曲線。</p></div>'+
    '<div class="seg sample-tabs" role="tablist" aria-label="切換會員等級">'+SAMPLE_TIERS.map(function(t){return '<button type="button" role="tab" data-tier="'+t+'" aria-selected="'+(t===S.tier)+'">'+TIER_NAME[t]+'</button>'}).join("")+'</div></div>'+
    '<p class="small">'+({free:"基礎版就能回答三個問題：該走還是留、12 個月內最佳的轉職與升遷月份、最適合的公司類型，另外有十種學派的投票結果、今天的職場運勢與每日一卦。切換到付費版、VIP，看看還多了哪些內容。",
      paid:"付費版解鎖八字、紫微斗數、西洋星盤等六種學派的完整解讀、36 個月時機曲線與月份詳解、六種公司類型完整排名，交叉比對可同時比對 2 種學派。鎖定區塊會顯示跟你命盤有關的線索。",
      vip:"VIP 再加上梅花易數、九宮飛星、奇門遁甲、人類圖，未來 7 天運勢與每月吉日，以及 offer 比較、現職適配度、主管合盤等決策工具，交叉比對不限種類。VIP 專屬區塊在範例中只露出一部分。"}[S.tier])+'</p>'+
    '<div class="sample-actions">'+(S.tier==="free"?"":'<button type="button" class="btn-gold" data-upgrade="'+S.tier+'">贊助解鎖'+TIER_NAME[S.tier]+'</button>')+
    '<button type="button" class="btn-line" id="sampleExit">用我的生日排盤</button></div>';
  $("sampleBar").querySelectorAll("[data-tier]").forEach(function(b){b.addEventListener("click",function(){loadSample(b.dataset.tier)})});
  $("sampleExit").addEventListener("click",function(){exitSample();expandForm(true)});
}

// VIP 專屬區塊只露出上半部，下方模糊並放上解鎖按鈕
function veil(el,text){
  if(!el||el.querySelector(":scope > .veil"))return;
  el.classList.add("sample-veil");
  el.insertAdjacentHTML("beforeend",'<div class="veil" aria-hidden="true"></div><div class="veil-cta"><p>'+text+'</p><button type="button" class="btn-upsell" data-upgrade="vip">贊助解鎖 VIP 版</button></div>');
}
function veilVip(){
  if(SAMPLE.tier!=="vip")return;
  VIP_PANELS.forEach(function(id){veil($(id),"VIP 專屬內容，範例只展示一部分")});
}
var baseRenderCompare=renderCompare;
renderCompare=function(r){
  baseRenderCompare(r);
  if(!SAMPLE||SAMPLE.tier!=="vip")return;
  var vipNames=SAMPLE.report.systems.filter(function(x){return x.vipOnly}).map(function(x){return x.name});
  $("cmpOut").querySelectorAll(".sys-card").forEach(function(c){var n=c.querySelector("header b");if(n&&vipNames.some(function(v){return n.textContent.indexOf(v)===0}))veil(c,"VIP 專屬學派")});
};

async function loadSample(tier){
  var res, S;
  try{res=await fetch("assets/sample/"+tier+".json");if(!res.ok)throw 0;S=await res.json()}
  catch(e){$("verdictBlock").innerHTML='<p class="err">範例報告載入失敗，請重新整理頁面。</p>';return}
  SAMPLE=S;SAMPLE.defaultSystems={free:["bazi"],paid:["bazi","ziwei"],vip:["bazi","ziwei","astro","iching","meihua"]}[tier];
  API.analyze=sampleAnalyze;
  var q=new URLSearchParams(location.search);q.set("sample",tier);history.replaceState(null,"","?"+q+location.hash);
  $("sampleNote").hidden=true;$("sampleBar").hidden=false;
  fillSampleForm(S.input);renderSampleBar();
  VIP_PANELS.forEach(function(id){$(id).classList.remove("sample-veil")});
  CMP.sel=[];STATE.rep=S.report;STATE.input=S.input;
  renderAll(S.report);applyTierUI(tier);
  var qd=$("qmDate");if(qd){qd.value=S.today;loadQimenDay(S.today)}
  veilVip();
}

function exitSample(){
  if(!SAMPLE)return;
  SAMPLE=null;API.analyze=realAnalyze;
  var q=new URLSearchParams(location.search);q.delete("sample");history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:"")+location.hash);
  $("sampleBar").hidden=true;$("sampleBar").innerHTML="";
  VIP_PANELS.forEach(function(id){var el=$(id);el.classList.remove("sample-veil")});
}
