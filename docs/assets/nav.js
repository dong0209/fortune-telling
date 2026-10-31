/* 模式頁籤（我的命盤／今日）、籤筒目錄與區塊卦象
 * 「我的命盤」是看一次的完整報告，「今日」是每天回來看的運勢與一卦；排過自己生辰的人再回來時，預設先看今日。
 * 區塊屬於哪個模式、配哪個卦，寫在 index.html 各 section 的 data-sec、data-gua。 */

// 卦象由下往上：1＝陽爻、0＝陰爻
var GUA={乾:[1,1,1],兌:[1,1,0],離:[1,0,1],震:[1,0,0],巽:[0,1,1],坎:[0,1,0],艮:[0,0,1],坤:[0,0,0]};
function guaSVG(n){
  var b=GUA[n], l="";
  [2,1,0].forEach(function(k,i){var y=5+i*7;l+=b[k]?'<line x1="3" x2="21" y1="'+y+'" y2="'+y+'"/>':'<line x1="3" x2="10" y1="'+y+'" y2="'+y+'"/><line x1="14" x2="21" y1="'+y+'" y2="'+y+'"/>'});
  return '<svg class="gua" viewBox="0 0 24 24" aria-hidden="true">'+l+'</svg>';
}
// 卦義：乾＝全局、離＝明辨、震＝動與時機、坤＝地與承載、兌＝人與交流、坎＝深處的命理、巽＝順流的日常、艮＝靜而問
var NAV_ITEMS=[["verdictBlock","總斷","一盤之局，先看結論"],["compareBlock","印證","十派互證，明辨異同"],["unlockBlock","全卷","完整命盤還有什麼"],
  ["chartBlock","天時","三年動靜，何時出手"],["fitBlock","地利","何處可安身"],["toolbox","人和","人事抉擇"],["chartsBlock","命盤","諸家細說"]];

// 羅盤刻度的令牌圖騰
function emblem(inner){
  var t="";for(var i=0;i<24;i++){var a=i*15*Math.PI/180, r1=i%6?27:25;t+='<line x1="'+(30+r1*Math.sin(a)).toFixed(1)+'" y1="'+(30-r1*Math.cos(a)).toFixed(1)+'" x2="'+(30+29*Math.sin(a)).toFixed(1)+'" y2="'+(30-29*Math.cos(a)).toFixed(1)+'"/>'}
  return '<svg class="emb" viewBox="0 0 60 60" aria-hidden="true"><g class="emb-ring"><circle cx="30" cy="30" r="29" class="o"/>'+t+'</g><circle cx="30" cy="30" r="21" class="i"/>'+inner+'</svg>';
}
var DIPPER=[[18,24],[23,26],[28,29],[31,34],[38,33],[40,39],[33,41]];
var DIPPER_SVG='<g class="dip"><polyline points="'+DIPPER.join(" ")+'"/>'+DIPPER.map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="1.6"/>'}).join("")+'</g>';

var NAV={mode:"report",init:false,cur:null};
var RETURNING=(function(){try{return localStorage.getItem("zy.seen")==="1"}catch(e){return false}})();

function renderNav(rep){
  if(!NAV.init){
    NAV.init=true;
    // 回訪且不是範例、不是別人分享的連結，先看今日
    if(RETURNING&&!window.SAMPLE&&!new URLSearchParams(location.search).get("b"))NAV.mode="today";
  }
  if(!window.SAMPLE){try{localStorage.setItem("zy.seen","1")}catch(e){}}
  var d=rep.today&&rep.today[0];
  $("modeTabs").innerHTML='<button type="button" role="tab" data-m="report">'+emblem(DIPPER_SVG)+'<span><b>我的命盤</b><small>一生之局・看一次</small></span></button>'+
    '<button type="button" role="tab" data-m="today">'+emblem(d?'<text x="30" y="29">'+d.gz[0]+'</text><text x="30" y="43">'+d.gz[1]+'</text>':'<circle cx="30" cy="30" r="6" class="sun"/>')+
    '<span><b>今日</b><small>'+(d?d.gz+'日・職場指數 <i>'+d.score+'</i>':'今日宜忌')+'</small></span></button>';
  $("modeTabs").hidden=false;
  $("modeTabs").querySelectorAll("button").forEach(function(b){b.addEventListener("click",function(){
    setMode(b.dataset.m);var top=$("modeTabs").getBoundingClientRect().top;if(top<0)$("modeTabs").scrollIntoView({block:"start"})})});
  // 天機總斷每次重繪，其餘區塊的卦象只加一次
  document.querySelectorAll("#main [data-gua]").forEach(function(s){var e=s.querySelector(".eyebrow");if(e&&!e.querySelector(".gua"))e.insertAdjacentHTML("afterbegin",guaSVG(s.dataset.gua))});
  setMode(NAV.mode);
}

function setMode(m){
  NAV.mode=m;$("main").dataset.mode=m;
  $("modeTabs").querySelectorAll("button").forEach(function(b){b.setAttribute("aria-selected",String(b.dataset.m===m))});
  buildNav();
}

// 依畫面上的實際順序排列（例如問公司類型時，「地利」會排到總斷後面）
function navItems(){
  return NAV_ITEMS.filter(function(x){var el=$(x[0]);return el&&!el.hidden&&el.dataset.sec===NAV.mode})
    .sort(function(a,b){return $(a[0]).compareDocumentPosition($(b[0]))&Node.DOCUMENT_POSITION_FOLLOWING?-1:1});
}
function buildNav(){
  var items=NAV.mode==="report"?navItems():[];
  $("qian").hidden=$("chipNav").hidden=!items.length;
  if(!items.length)return;
  $("qianTube").innerHTML=items.map(function(x){return '<a href="#'+x[0]+'" data-id="'+x[0]+'" title="'+x[2]+'">'+guaSVG($(x[0]).dataset.gua)+'<span>'+x[1]+'</span></a>'}).join("")+'<div class="seal-txt" aria-hidden="true">命盤</div>';
  $("chipNav").innerHTML=items.map(function(x){return '<a href="#'+x[0]+'" data-id="'+x[0]+'">'+guaSVG($(x[0]).dataset.gua)+x[1]+'</a>'}).join("");
  NAV.cur=null;spyNav();
}

// 捲到哪一區，就抽出哪支籤
function markNav(id){
  if(NAV.cur===id)return;NAV.cur=id;
  document.querySelectorAll("#qianTube a,#chipNav a").forEach(function(a){var on=a.dataset.id===id;a.classList.toggle("on",on);if(on)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")});
  var x=NAV_ITEMS.filter(function(x){return x[0]===id})[0];
  $("qianCap").innerHTML=x?'<b>'+x[1]+'</b>'+x[2]:"";
  var chip=$("chipNav").querySelector(".on");if(chip)$("chipNav").scrollTo({left:chip.offsetLeft-16});
}
function spyNav(){
  if(NAV.mode!=="report")return;
  var items=navItems();if(!items.length)return;
  var line=window.innerHeight*0.3, cur=items[0][0];
  items.forEach(function(x){if($(x[0]).getBoundingClientRect().top<=line)cur=x[0]});
  markNav(cur);
}
var spyRaf=0;
// 不支援 overflow:clip 的瀏覽器：籤取得焦點後把筒子捲回原位
document.addEventListener("focusin",function(e){if(e.target.closest&&e.target.closest("#qianTube"))$("qianTube").scrollTop=0});
window.addEventListener("scroll",function(){if(!spyRaf)spyRaf=requestAnimationFrame(function(){spyRaf=0;spyNav()})},{passive:true});
document.addEventListener("click",function(e){
  var a=e.target.closest("#qianTube a,#chipNav a");if(!a)return;e.preventDefault();
  var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  $(a.dataset.id).scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
});
