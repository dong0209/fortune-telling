/* 依伺服器回傳的報告繪製畫面；沒有權限的區塊顯示鎖定卡 */
var FIT_NAME={corp:"大型企業／集團",startup:"新創／成長期公司",foreign:"外商／跨國企業",public:"公部門／國營事業",freelance:"自由接案／個人品牌",sme:"中小企業／家族企業"};
var WX=["木","火","土","金","水"];
var IND_BY_EL=[["教育培訓","出版文創","設計","醫療生技","環保農林"],["半導體與電子","網路媒體","能源","餐飲","美業與娛樂"],["不動產","營建","顧問管理","保險","物流倉儲"],["金融投資","法律","機械製造","汽車","資安"],["國際貿易","航運旅遊","行銷傳播","軟體與資訊流通","飲品水產"]];
var ROLE_NAMES=["業務","行銷企劃","研發工程","設計創意","財務會計","人資","行政","專案管理","客服","主管職","教育培訓","法務稽核"];
var DIRS=[["東","木"],["東南","木"],["南","火"],["西南","土"],["東北","土"],["西","金"],["西北","金"],["北","水"]];
var TIER_NAME={free:"基礎版",paid:"付費版",vip:"VIP"};
var WEEK="日一二三四五六", ACTS=["提案簡報","談薪加薪","面試","遞辭呈","請假充電"], ACT_LABEL={good:"宜",mid:"平",bad:"忌"};

var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function pad2(n){return String(n).padStart(2,"0")}
function ym(x){return x.y+"/"+pad2(x.m)}
function parseDate(v){if(!v)return null;var p=v.split("-").map(Number);return new Date(p[0],p[1]-1,p[2])}
function ymd(dt){return dt.getFullYear()+"-"+pad2(dt.getMonth()+1)+"-"+pad2(dt.getDate())}
function md(s){var dt=typeof s==="string"?parseDate(s):s;return (dt.getMonth()+1)+"/"+dt.getDate()+"（"+WEEK[dt.getDay()]+"）"}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function meterRow(label,v,color){return '<div class="meter-row"><span>'+label+'</span><div class="bar"><i style="width:'+v+'%;background:'+color+'"></i></div><span class="num">'+v+'</span></div>'}
function listHTML(arr){return '<ul class="notes">'+arr.map(function(n){return '<li>'+esc(n)+'</li>'}).join("")+'</ul>'}

var LOCK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/></svg>';
// 付費邀請一律用文字連結；整頁只有「完整命盤還會看到什麼」區塊用按鈕
function upLink(need,text){return '<button type="button" class="link-up" data-upgrade="'+need+'">'+(text||(need==="vip"?"了解 VIP 版":"了解付費版"))+'</button>'}
function lockHTML(need,desc,hint){
  return '<div class="lock"><div class="lock-body">'+LOCK_SVG+'<b>'+(need==="vip"?"VIP 專屬":"付費版內容")+'</b>'+(hint?'<p class="lock-hint">'+hint+'</p>':'')+'<p>'+desc+'</p>'+
    '<p class="lock-links"><a href="?sample='+need+'" data-sample="'+need+'">看張三豐的'+(need==="vip"?" VIP ":"付費版")+'範例</a>・'+upLink(need)+'</p></div></div>';
}
var LOCK_DESC={
  today:"今天的職場指數，以及提案／談薪／面試／遞辭呈的宜忌。VIP 再加上未來 7 天的走勢。",
  chart:"未來 36 個月的轉職與升遷動能曲線，點選任一月份就能看詳解與建議。當月吉日為 VIP 專屬。",
  fit:"六種公司類型的契合排名、判斷依據，以及依喜用五行推薦的產業。",
  schools:"八字、紫微斗數、星盤、易經、生命靈數、姓名學各自怎麼看你的職涯，並可兩兩並排比對。",
  tools:"兩家 offer 比較、現職適配度檢查、主管／同事合盤，把命盤用在手上真實的選擇。",
  syn:"輸入主管或同事的生日，分析五行生剋與人類圖互動，給你相處與升遷策略。",
  bazi:"身強身弱、用神、十神職場能量、大運與流年喜忌。",
  ziwei:"紫微斗數十二宮命盤、官祿宮主星解讀、流年四化對事業的影響。",
  astro:"天頂星座、事業宮行星、土星職涯功課與木星行運。",
  qimen:"奇門遁甲八門方位、未來 60 天職場吉日，以及指定日期的 12 時辰擇時。",
  hd:"內在權威、人生角色、能量中心，以及你該轉職時的身體訊號。",
  iching:"以河洛理數從八字起出你的先天卦，看卦象對職涯的提示。",
  meihua:"以生辰起本卦、互卦、變卦，用體用生剋看你和工作環境的關係。",
  numerology:"主命數的職場特質，以及未來 6 年每一年的流年數與該動或該守。",
  ninestar:"本命星的職場特質，以及未來 6 年本命星飛入哪一宮。",
  name:"姓名的天、人、地、外、總五格與三才配置，看名字對事業運的加分。"
};

/* ---------- 天機總斷 ---------- */
function renderVerdict(rep){
  var v=rep.verdict, pos=["年柱","月柱","日柱","時柱"], paid=!!v.summary;
  var pill=v.pillars.map(function(p,i){
    if(i===3&&v.noTime)return '<div class="pillar"><div class="pos">時柱</div><div class="gz muted">？<br>？</div><div class="god">—</div></div>';
    return '<div class="pillar'+(i===2?" day":"")+'"><div class="pos">'+pos[i]+'</div><div class="gz">'+p[0]+'<br>'+p[1]+'</div><div class="god">'+esc(v.gods[i])+'</div></div>'}).join("");
  var right='<div class="pillars">'+pill+'</div>';
  if(paid)right+='<div style="margin-top:16px"><div class="lab" style="margin-bottom:6px">未來 12 個月平均動能</div>'+meterRow("轉職",v.avg.move,"var(--s-move)")+meterRow("升遷",v.avg.stay,"var(--s-stay)")+'</div>'+
    '<div class="tags" style="margin-top:10px"><span class="tag gold">'+esc(v.tags[0])+'</span><span class="tag">'+esc(v.tags[1])+'</span></div>';
  var left='<div class="verdict-call">'+v.call+'</div><p style="margin:0 0 8px">'+esc(v.sub)+'</p>';
  if(paid){
    left+='<p class="muted small" style="margin:0">'+esc(v.summary)+'</p><div class="windows">'+
      '<div class="win"><div class="k"><span class="dot" style="background:var(--s-move)"></span>轉職窗口</div>'+v.windows.move.map(function(x){return '<div><b>'+ym(x)+'</b> <span class="muted small">'+x.move+'</span></div>'}).join("")+'</div>'+
      '<div class="win"><div class="k"><span class="dot" style="background:var(--s-stay)"></span>升遷窗口</div>'+v.windows.stay.map(function(x){return '<div><b>'+ym(x)+'</b> <span class="muted small">'+x.stay+'</span></div>'}).join("")+'</div></div>';
  }else if(v.next){
    left+='<div class="lab" style="margin-top:14px">未來 12 個月的最佳月份</div><div class="windows" style="margin-top:6px">'+
      '<div class="win"><div class="k"><span class="dot" style="background:var(--s-move)"></span>轉職窗口</div><div><b>'+ym(v.next.move)+'</b> <span class="muted small">'+v.next.move.v+'</span></div></div>'+
      '<div class="win"><div class="k"><span class="dot" style="background:var(--s-stay)"></span>升遷窗口</div><div><b>'+ym(v.next.stay)+'</b> <span class="muted small">'+v.next.stay.v+'</span></div></div></div>'+
      '<div class="win top-fit"><div class="k">最適合你的環境</div><b>'+esc(v.topFit.name)+'</b><p class="small muted" style="margin:2px 0 0">'+esc(v.topFit.desc)+'</p></div>';
  }
  var inp=rep.input;
  $("verdictBlock").innerHTML='<p class="eyebrow"><span>天機總斷</span>'+esc(inp.date+(inp.time?" "+inp.time:"")+" · "+inp.city+" · "+inp.gender)+'</p>'+
    (inp.timeNote?'<p class="small muted" style="margin:-2px 0 6px">'+esc(inp.timeNote)+'</p>':"")+
    '<div class="verdict"><div style="min-width:0">'+left+'</div><div style="min-width:0">'+right+'</div></div>'+
    (paid?"":'<p class="verdict-more small muted">想知道為什麼是這幾個月、這類公司？付費版會攤開 36 個月的完整曲線，以及八字、紫微、星盤各自的理由。</p>');
}

/* ---------- 每日職場運勢 ---------- */
var todaySel=0;
function renderToday(rep){
  if(!rep.today){$("todayTitle").textContent="今天適合做什麼";$("today").innerHTML=lockHTML("paid",LOCK_DESC.today);return}
  var days=rep.today, t=days[todaySel]||days[0], first=parseDate(days[0].date);
  $("todayTitle").textContent=todaySel===0?"今天適合做什麼":md(t.date)+"適合做什麼";
  $("today").innerHTML='<div class="today'+(days.length<2?" one":"")+'"><div style="min-width:0">'+
    '<div class="today-head"><div class="today-score"><b class="num">'+t.score+'</b><span>職場指數</span></div>'+
    '<div><div class="today-date">'+md(t.date)+'　'+t.gz+'日</div><div class="muted small">流日'+t.god+(t.door?'・巳時值使'+t.door+'門・開門在'+t.openDir+'方':'')+(t.weekend?'・週末':'')+'</div></div></div>'+
    '<div class="acts">'+ACTS.map(function(a){var s=t.acts[a];return '<div class="act '+s+'"><span>'+a+'</span><b>'+ACT_LABEL[s]+'</b></div>'}).join("")+'</div>'+
    listHTML(t.notes)+'</div>'+
    // 只有今天一天（免費版、付費版）時不畫走勢條
    (days.length<2?'':'<div class="strip" role="group" aria-label="未來 7 天">'+days.map(function(d,i){var dt=parseDate(d.date);
      return '<button type="button" class="sday'+(i===todaySel?" on":"")+'" data-i="'+i+'" aria-pressed="'+(i===todaySel)+'"><span>'+(i===0?"今天":"週"+WEEK[dt.getDay()])+'</span><span class="num small">'+(dt.getMonth()+1)+'/'+dt.getDate()+'</span><span class="sbar"><i style="height:'+d.score+'%"></i></span><b class="num">'+d.score+'</b></button>'}).join("")+'</div>')+'</div>';
  $("today").querySelectorAll(".sday").forEach(function(b){b.addEventListener("click",function(){todaySel=+b.dataset.i;renderToday(rep)})});
  var w=rep.hints&&rep.hints.week;
  if(w)$("today").insertAdjacentHTML("beforeend",'<div class="teaser"><p>'+(w.better?"未來 6 天中，有 <b>"+w.better+" 天</b>職場指數比今天高，最高 <b>"+w.max+" 分</b>。":"未來 6 天的職場指數都沒有比今天高，重要的事把握今天。")+'VIP 版可以看完整 7 天，挑適合面試、談薪或遞辭呈的日子。'+upLink("vip")+'</p></div>');
}

/* ---------- 時機曲線 ---------- */
var chartData=null, chartSel=null;
function renderChartArea(rep){
  if(!rep.months){chartData=null;$("chartArea").innerHTML=lockHTML("paid",LOCK_DESC.chart);return}
  chartData=rep.months;
  $("chartArea").innerHTML='<p class="muted small" style="margin:0 0 12px">兩條線用同一把尺：八字流年流月、紫微流年四化、星盤木土天冥行運，三者加權後換算成 0–100 的相對動能。曲線高點是窗口，不是保證。</p>'+
    '<div class="legend"><span><i style="background:var(--s-move)"></i>轉職動能</span><span><i style="background:var(--s-stay)"></i>升遷動能（留任）</span></div>'+
    '<div class="chart-wrap" id="chart"></div><p class="muted small" style="margin:6px 0 0">點選曲線上任一個月份，下方會展開那個月的詳解。</p>'+
    '<div class="month-detail" id="monthDetail" aria-live="polite"></div>'+
    '<details class="table"><summary>以表格檢視逐月數值</summary><div class="tscroll">'+
    '<table><thead><tr><th>月份</th><th>流年</th><th>流月</th><th style="text-align:right">轉職</th><th style="text-align:right">升遷</th><th>主要訊號</th></tr></thead><tbody>'+
    rep.months.map(function(m){return '<tr><td class="num" style="text-align:left">'+ym(m)+'</td><td>'+m.ygz+'</td><td>'+m.mgz+'</td><td class="num">'+m.move+'</td><td class="num">'+m.stay+'</td><td style="white-space:normal;min-width:220px">'+esc(m.notes.slice(0,2).join("；")||"—")+'</td></tr>'}).join("")+'</tbody></table></div></details>';
  renderChart();
}
function renderChart(){
  var box=$("chart");if(!chartData||!box)return;
  var ms=chartData, W=Math.max(300,box.clientWidth), H=W<500?220:260, L=30, Rr=W<500?14:60, T=12, Bt=28;
  var iw=W-L-Rr, ih=H-T-Bt, n=ms.length;
  function x(i){return L+iw*i/(n-1)} function y(v){return T+ih*(1-v/100)}
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="未來 36 個月轉職與升遷動能折線圖">';
  [0,25,50,75,100].forEach(function(v){s+='<line x1="'+L+'" x2="'+(L+iw)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)" stroke-width="1"/><text x="'+(L-6)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">'+v+'</text>'});
  ms.forEach(function(m,i){if((m.m===1&&i>2)||i===0){s+='<line x1="'+x(i)+'" x2="'+x(i)+'" y1="'+T+'" y2="'+(T+ih)+'" stroke="var(--line)" stroke-dasharray="2 3"/><text x="'+x(i)+'" y="'+(H-8)+'" font-size="11" fill="var(--muted)" font-family="var(--f-mono)" text-anchor="'+(i===0?"start":"middle")+'">'+(i===0?ym(m):m.y)+'</text>'}});
  function path(key){return ms.map(function(m,i){return (i?"L":"M")+x(i).toFixed(1)+" "+y(m[key]).toFixed(1)}).join("")}
  function area(key){return path(key)+"L"+x(n-1)+" "+(T+ih)+"L"+x(0)+" "+(T+ih)+"Z"}
  s+='<path d="'+area("move")+'" fill="var(--s-move)" fill-opacity=".08"/><path d="'+area("stay")+'" fill="var(--s-stay)" fill-opacity=".08"/>';
  s+='<path d="'+path("stay")+'" fill="none" stroke="var(--s-stay)" stroke-width="2" stroke-linejoin="round"/>';
  s+='<path d="'+path("move")+'" fill="none" stroke="var(--s-move)" stroke-width="2" stroke-linejoin="round"/>';
  if(W>=500){var lm=ms[n-1];var ya=y(lm.move),yb=y(lm.stay);if(Math.abs(ya-yb)<14){if(ya<yb){ya-=7;yb+=7}else{ya+=7;yb-=7}}
    s+='<text x="'+(x(n-1)+8)+'" y="'+(ya+4)+'" font-size="12" fill="var(--ink)">轉職</text><text x="'+(x(n-1)+8)+'" y="'+(yb+4)+'" font-size="12" fill="var(--ink)">升遷</text>'}
  s+='<line id="selLine" x1="0" x2="0" y1="'+T+'" y2="'+(T+ih)+'" stroke="var(--gold)" stroke-width="2" visibility="hidden"/>';
  s+='<line id="xh" x1="0" x2="0" y1="'+T+'" y2="'+(T+ih)+'" stroke="var(--muted)" stroke-width="1" visibility="hidden"/>';
  s+='<circle id="cm" r="4.5" fill="var(--s-move)" stroke="var(--panel-solid)" stroke-width="2" visibility="hidden"/><circle id="cs" r="4.5" fill="var(--s-stay)" stroke="var(--panel-solid)" stroke-width="2" visibility="hidden"/>';
  s+='<rect x="'+L+'" y="0" width="'+iw+'" height="'+H+'" fill="transparent" id="hit" style="cursor:pointer"/></svg><div class="tip" id="tip" hidden></div>';
  box.innerHTML=s;
  var svg=box.querySelector("svg"), tip=$("tip");
  function mark(i){var sl=$("selLine");sl.setAttribute("x1",x(i));sl.setAttribute("x2",x(i));sl.setAttribute("visibility","visible")}
  if(chartSel!=null)mark(chartSel);
  function idx(ev){var r=svg.getBoundingClientRect();return clamp(Math.round(((ev.clientX-r.left)*W/r.width-L)/iw*(n-1)),0,n-1)}
  $("hit").addEventListener("click",function(ev){var i=idx(ev);mark(i);selectMonth(i)});
  function show(ev){
    var r=svg.getBoundingClientRect(), i=idx(ev), m=ms[i];
    var xh=$("xh");xh.setAttribute("x1",x(i));xh.setAttribute("x2",x(i));xh.setAttribute("visibility","visible");
    [["cm","move"],["cs","stay"]].forEach(function(c){var el=$(c[0]);el.setAttribute("cx",x(i));el.setAttribute("cy",y(m[c[1]]));el.setAttribute("visibility","visible")});
    tip.innerHTML='<h4>'+ym(m)+'　'+m.mgz+'月</h4><div><span class="dot" style="background:var(--s-move)"></span> 轉職 <b class="num">'+m.move+'</b>　<span class="dot" style="background:var(--s-stay)"></span> 升遷 <b class="num">'+m.stay+'</b></div>'+
      (m.notes.length?'<ul>'+m.notes.slice(0,3).map(function(t){return "<li>"+esc(t)+"</li>"}).join("")+'</ul>':"")+'<div class="muted" style="margin-top:4px">點一下看本月詳解</div>';
    tip.hidden=false;var tx=x(i)*r.width/W;tip.style.left=clamp(tx+12,0,r.width-tip.offsetWidth)+"px";if(tx+12+tip.offsetWidth>r.width)tip.style.left=Math.max(0,tx-12-tip.offsetWidth)+"px";tip.style.top="10px";
  }
  $("hit").addEventListener("pointermove",show);$("hit").addEventListener("pointerdown",show);
  $("hit").addEventListener("pointerleave",function(){tip.hidden=true;["xh","cm","cs"].forEach(function(id){$(id).setAttribute("visibility","hidden")})});
}
function renderMonthDetail(d){
  var sys=Object.keys(d.detail).map(function(k){var ns=d.detail[k];return '<div><span class="lab">'+k+'</span>'+(ns.length?'<ul>'+ns.map(function(n){return '<li>'+esc(n)+'</li>'}).join("")+'</ul>':'<p class="muted small" style="margin:4px 0 0">無特別訊號</p>')+'</div>'}).join("");
  $("monthDetail").innerHTML='<div class="md-head"><h3>'+d.y+' 年 '+d.m+' 月　<span class="muted">'+d.ygz+'年 '+d.mgz+'月</span></h3>'+
    '<div class="md-meters">'+meterRow("轉職",d.move,"var(--s-move)")+meterRow("升遷",d.stay,"var(--s-stay)")+'</div></div>'+
    '<div class="md-grid">'+sys+'</div>'+
    '<div class="md-grid two"><div><span class="lab">這個月建議你</span><ul>'+d.advice.map(function(a){return '<li>'+esc(a)+'</li>'}).join("")+'</ul></div>'+
    '<div><span class="lab">本月職場吉日（平日）</span>'+(!d.good?(d.goodHint?'<p class="small" style="margin:4px 0 6px">本月 <b>'+d.goodHint.n+' 個</b>職場吉日集中在<b>'+d.goodHint.xun+'</b>。VIP 版會列出是哪幾天、適合面試還是談薪。'+upLink("vip")+'</p>':'<p class="muted small" style="margin:4px 0 0">這個月剩下的平日沒有特別突出的吉日。</p>'):d.good.length?'<ul>'+d.good.map(function(g){return '<li><b class="num">'+md(g.date)+'</b> '+g.gz+'日'+(g.door?'，'+g.door+'門，開門'+g.openDir:'，指數 '+g.score)+'</li>'}).join("")+'</ul>':'<p class="muted small" style="margin:4px 0 0">本月剩餘日子不多，請看下個月。</p>')+'</div></div>';
}

/* ---------- 公司類型 ---------- */
function renderFit(rep){
  if(!rep.fit){$("fitArea").innerHTML=lockHTML("paid",LOCK_DESC.fit);return}
  $("fitArea").innerHTML='<div class="fit">'+rep.fit.map(function(f,i){
    return '<div class="fit-item'+(i===0?" top":"")+'"><div class="fit-head"><h3>'+f.name+'</h3>'+(i===0?'<span class="badge">最適合</span>':'<span class="num muted small">'+f.v+'</span>')+'</div>'+
      '<div class="bar"><i style="width:'+f.v+'%"></i></div><p>'+esc(f.desc)+'</p>'+(f.why.length?'<p>依據：'+f.why.slice(0,3).map(esc).join("、")+'</p>':"")+'</div>'}).join("")+'</div>'+
    '<h3 style="font-size:15px;margin:18px 0 8px;font-weight:600">建議產業（依八字喜用五行）</h3><div class="tags">'+
    rep.industries.map(function(g){return g.names.map(function(t){return '<span class="tag'+(g.primary?" gold":"")+'">'+g.el+"・"+esc(t)+'</span>'}).join("")}).join("")+'</div>';
}

/* ---------- 八字 ---------- */
function renderBazi(rep){
  var B=rep.bazi;if(!B){$("p-bazi").innerHTML=lockHTML("paid",LOCK_DESC.bazi);return}
  var nowY=new Date().getFullYear(), cur=B.dayun.filter(function(d){return nowY>=d.startYear&&nowY<=d.endYear})[0];
  $("p-bazi").innerHTML='<div class="split"><div style="min-width:0"><h3>日主與格局</h3><p>日主 <b>'+B.dmG+'（'+B.dmWx+'）</b>，同類與生扶力量約佔 '+B.support+'%，判為<b>'+(B.strong?"身強":"身弱")+'</b>。'+(B.strong?"能量足、扛得住壓力，需要舞台與輸出口，職涯上要找能讓你發揮、承擔責任的位置。":"需要資源與團隊支撐，職涯上先找好平台與貴人，再求表現。")+'</p>'+
    '<p>以<b>'+B.useCat+'</b>為用神（'+B.useWx+'）：'+esc(B.useText)+'。'+(B.hasYima?"命帶驛馬，換城市、外派、跨國工作對你是加分。":"")+'</p>'+
    '<h3>十神職場能量分布</h3>'+B.cats.map(function(c){return meterRow(c.name,c.v,"var(--gold)")}).join("")+
    '<p class="muted small">官殺＝組織與權責；印＝學習與靠山；比劫＝自主與競爭；食傷＝創意與表達；財＝資源與業績。</p></div>'+
    '<div><h3>五行</h3>'+B.elem.map(function(e){return meterRow(e.name+(e.fav?"・喜":""),e.v,"var(--gold-bright)")}).join("")+'</div></div>'+
    '<h3>大運（十年一運）</h3><div class="yun">'+B.dayun.map(function(d){return '<div class="'+(d===cur?"now":"")+'"><b>'+d.gz+'</b>'+d.startAge+'–'+d.endAge+'歲<br>'+d.startYear+'<br><span style="color:var(--gold)">'+d.god+'</span></div>'}).join("")+'</div>'+
    (cur?'<p style="margin-top:10px">目前走 <b>'+cur.gz+'</b> 運（'+cur.startYear+'–'+cur.endYear+'），天干為'+cur.god+'，屬'+(cur.good?"喜用":"忌神")+'運。'+(cur.good?"這十年的大方向對事業有利，適合積極布局。":"這十年做事較費力，重大轉換要挑流年好的時機。")+'</p>':"")+
    '<h3>流年重點</h3><div class="tscroll"><table><thead><tr><th>流年</th><th>十神</th><th>喜忌</th><th>職場訊號</th></tr></thead><tbody>'+
    B.years.map(function(e){return '<tr><td>'+e.gz+'</td><td>'+e.god+'</td><td><span class="pill '+(e.fav==="喜"?"good":e.fav==="忌"?"bad":"mid")+'">'+e.fav+'</span></td><td style="white-space:normal">'+esc(e.notes.join("；")||"平穩之年")+'</td></tr>'}).join("")+'</tbody></table></div>';
}

/* ---------- 紫微 ---------- */
function renderZiwei(rep){
  var Z=rep.ziwei;if(!Z){$("p-ziwei").innerHTML=lockHTML("paid",LOCK_DESC.ziwei);return}
  var layout={巳:[1,1],午:[1,2],未:[1,3],申:[1,4],辰:[2,1],酉:[2,4],卯:[3,1],戌:[3,4],寅:[4,1],丑:[4,2],子:[4,3],亥:[4,4]};
  var cells=Z.palaces.map(function(p,i){var g=layout[p.branch];
    var stars=p.stars.map(function(s){return esc(s.name)+(s.mutagen?'<span class="mu '+s.mutagen+'">'+s.mutagen+'</span>':"")}).join(" ")||'<span class="muted" style="font-size:12px">空宮</span>';
    var hl=(i===Z.career||i===Z.soulIdx||i===Z.travel)?" hl":"";
    return '<div class="pal'+hl+'" style="grid-row:'+g[0]+';grid-column:'+g[1]+'"><div class="pn"><span>'+p.name+'</span><span>'+p.stem+p.branch+'</span></div><div class="st">'+stars+'</div><div class="muted" style="font-size:11px">'+p.range.join("–")+'歲</div></div>'}).join("");
  cells+='<div class="pal center"><b style="font-family:var(--f-display);font-size:17px;color:var(--gold-bright)">'+Z.fiveElementsClass+'</b><span class="muted">命主 '+Z.soul+'・身主 '+Z.body+'</span><span class="muted">'+Z.lunarDate+'</span></div>';
  $("p-ziwei").innerHTML='<div class="split even"><div style="min-width:0"><h3>官祿宮：你的工作樣貌</h3>'+(Z.borrowed?'<p class="muted small">官祿宮無主星，借對宮（夫妻宮）主星來看。</p>':"")+
    Z.careerTexts.map(function(c){return '<p><b>'+c.star+'</b>：'+esc(c.text)+'</p>'}).join("")+
    '<h3>命宮</h3><p>'+esc(Z.soulText)+'</p>'+
    '<h3>流年四化與事業</h3><div class="tscroll"><table><thead><tr><th>年份</th><th>四化對官祿、遷移的影響</th></tr></thead><tbody>'+
    Z.years.map(function(e){return '<tr><td>'+e.y+'（'+e.gz+'）</td><td style="white-space:normal">'+esc(e.notes.join("；")||"官祿宮無四化引動，維持現狀")+'</td></tr>'}).join("")+'</tbody></table></div></div>'+
    '<div style="min-width:0"><h3>命盤</h3><div class="palaces">'+cells+'</div><p class="muted small" style="margin-top:6px">金框為命宮、官祿、遷移三宮。</p></div></div>';
}

/* ---------- 星盤 ---------- */
function renderAstro(rep){
  var A=rep.astro;if(!A){$("p-astro").innerHTML=lockHTML("paid",LOCK_DESC.astro);return}
  var rows=A.planets.map(function(p){return '<tr><td>'+p.name+'</td><td>'+p.sign+' '+p.deg+'°</td><td>'+(p.house?"第 "+p.house+" 宮":"—")+'</td></tr>'}).join("");
  if(A.asc)rows+='<tr><td>上升</td><td>'+A.asc.sign+' '+A.asc.deg+'°</td><td>—</td></tr><tr><td>天頂</td><td>'+A.mc.sign+' '+A.mc.deg+'°</td><td>—</td></tr>';
  $("p-astro").innerHTML='<div class="split" style="grid-template-columns:minmax(0,1fr) minmax(0,260px)"><div style="min-width:0">'+
    (A.mc?'<h3>天頂（MC）：社會角色</h3><p>'+esc(A.mc.text)+'</p>':'<h3>太陽星座</h3><p>未提供出生時間，無法計算上升與天頂，行運改以太陽星座作為第一宮（太陽宮位制）推算。</p>')+
    (A.hasTime?'<h3>第十宮（事業宮）</h3><p>'+(A.in10.length?A.in10.map(function(x){return '<b>'+x.p+'</b>：'+esc(x.text)}).join("；")+"。":"第十宮無行星，事業風格主要由天頂星座與其守護星決定。")+'</p>':"")+
    '<h3>土星：職涯功課</h3><p>土星在<b>'+A.saturn.sign+'</b>'+(A.saturn.house?"第 "+A.saturn.house+" 宮":"")+'，代表你需要時間累積、但最後會成為專長的領域。每 29.5 年一次的土星回歸（約 29 歲、58 歲）是職涯重新定位的大關卡。</p>'+
    '<h3>現在的木星</h3><p>木星目前在'+A.jupiterNow.sign+'，行經你的第 '+A.jupiterNow.house+' 宮。'+esc(A.jupiterNow.text)+'</p></div>'+
    '<div style="min-width:0"><h3>行星位置</h3><div class="tscroll"><table><thead><tr><th>行星</th><th>星座</th><th>宮位</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="muted small">整宮制，熱帶黃道。</p></div></div>';
}

/* ---------- 奇門（VIP） ---------- */
var DIR_OF={1:"北",8:"東北",3:"東",4:"東南",9:"南",2:"西南",7:"西",6:"西北"};
function renderQimen(rep){
  var Q=rep.qimen;if(!Q){var hq=rep.hints&&rep.hints.qimen;$("p-qimen").innerHTML=lockHTML("vip",LOCK_DESC.qimen,hq&&hq.count?"未來 60 天你有 <b>"+hq.count+" 個</b>職場吉日，最近一個在 <b>"+md(hq.next)+"</b>。":"");return}
  var q=Q.today;
  var grid=[4,9,2,3,5,7,8,1,6].map(function(p){
    if(p===5)return '<div><span class="muted">中五</span><b>'+q.ju+'局</b>'+(q.yang?"陽遁":"陰遁")+'</div>';
    return '<div class="'+(q.doors[p]==="開"?"open":"")+'"><span class="muted">'+DIR_OF[p]+'</span><b>'+q.doors[p]+'門</b>'+(p===q.zhiShiAt?"值使":"")+'</div>'}).join("");
  $("p-qimen").innerHTML='<div class="split" style="grid-template-columns:minmax(0,1fr) 330px"><div style="min-width:0"><h3>開門：事業之門</h3><p>奇門遁甲以八門判斷行事吉凶，<b>開門</b>主事業、開創與求職，<b>休門</b>主貴人與休養，<b>生門</b>主財利。面試、談薪、遞辭呈時，挑值使落在開、休、生三吉門的時辰，並朝開門所在方位出發或就座。</p>'+
    '<p>今天（'+q.dgz+'日）巳時 9–11 點：'+q.term+q.yuan+'元，'+(q.yang?"陽":"陰")+'遁'+q.ju+'局，值使<b>'+q.zhiShi+'門</b>，開門在<b>'+q.openDir+'方</b>。</p></div>'+
    '<div><h3>今日巳時八門</h3><div class="qm">'+grid+'</div></div></div>'+
    '<h3>未來 60 天職場吉日（巳時）</h3><div class="tscroll"><table><thead><tr><th>日期</th><th>日干支</th><th>巳時值使</th><th>開門方位</th><th>適合</th><th>黃曆宜</th></tr></thead><tbody>'+
    Q.days.map(function(d){var g={開:"good",休:"good",生:"good"}[d.door]||"mid";return '<tr><td class="num">'+md(d.date)+'</td><td>'+d.dgz+'</td><td><span class="pill '+g+'">'+d.door+'門</span></td><td>'+d.openDir+'</td><td>'+d.act+'</td><td style="white-space:normal">'+(d.hits.join("、")||"—")+'</td></tr>'}).join("")+'</tbody></table></div>'+
    '<h3>指定日期擇時</h3><p>已經約好面試或談判？選日期看當天 12 個時辰的值使門與開門方位。</p>'+
    '<div class="field" style="max-width:220px"><label for="qmDate">日期</label><input type="date" id="qmDate"></div><div id="qmHours" aria-live="polite"></div>'+
    '<p class="note">已排除與你日支相沖的日子與週末。奇門在此採時家轉盤拆補法，只排地盤三奇六儀與八門，不含九星、八神與天盤格局。</p>';
}
function renderQimenHours(r){
  $("qmHours").innerHTML='<p class="small">'+md(r.date)+'　'+r.dgz+'日，'+(r.yang?"陽":"陰")+'遁'+r.ju+'局。'+(r.clash?'<span style="color:var(--cinnabar)">這天與你的日支相沖，重要事情盡量改期。</span>':"")+'</p>'+
    '<div class="tscroll"><table><thead><tr><th>時辰</th><th>時間</th><th>時干支</th><th>值使</th><th>開門方位</th><th>適合</th></tr></thead><tbody>'+
    r.rows.map(function(x){return '<tr'+(x.work&&x.level==="good"?' class="hl-row"':"")+'><td>'+x.zhi+'時</td><td class="num">'+x.range+'</td><td>'+x.hgz+'</td><td><span class="pill '+x.level+'">'+x.door+'門</span></td><td>'+x.openDir+'</td><td>'+x.use+'</td></tr>'}).join("")+
    '</tbody></table></div><p class="note">底色標示的是上班時段內值使落在吉門的時辰。</p>';
}

/* ---------- 人類圖（VIP） ---------- */
function hdSvg(H){
  var C={頭頂:[100,22,"tri"],邏輯:[100,68,"tri-d"],喉嚨:[100,118,"sq"],G中心:[100,178,"dia"],意志力:[146,198,"tri"],薦骨:[100,258,"sq"],直覺:[36,236,"tri"],情緒:[164,236,"tri"],根部:[100,312,"sq"]};
  var s='<svg viewBox="0 0 200 340" role="img" aria-label="人類圖九大中心">', seen={};
  H.channelCenters.forEach(function(c){var a=c[0],b=c[1],k=[a,b].sort().join();if(seen[k])return;seen[k]=1;s+='<line x1="'+C[a][0]+'" y1="'+C[a][1]+'" x2="'+C[b][0]+'" y2="'+C[b][1]+'" stroke="var(--gold)" stroke-width="3"/>'});
  for(var n in C){var c=C[n],x=c[0],y=c[1],on=H.defined.indexOf(n)>=0,st='stroke="'+(on?"var(--gold-bright)":"var(--faint)")+'" stroke-width="1.2" fill="'+(on?"var(--gold)":"var(--panel-solid)")+'"',d;
    if(c[2]==="sq")d='<rect x="'+(x-18)+'" y="'+(y-18)+'" width="36" height="36" rx="3" '+st+'/>';
    else if(c[2]==="dia")d='<polygon points="'+x+','+(y-22)+' '+(x+22)+','+y+' '+x+','+(y+22)+' '+(x-22)+','+y+'" '+st+'/>';
    else if(c[2]==="tri-d")d='<polygon points="'+(x-20)+','+(y-16)+' '+(x+20)+','+(y-16)+' '+x+','+(y+18)+'" '+st+'/>';
    else d='<polygon points="'+x+','+(y-18)+' '+(x+19)+','+(y+15)+' '+(x-19)+','+(y+15)+'" '+st+'/>';
    s+=d;}
  return s+'</svg>';
}
function renderHD(rep){
  var H=rep.hd;if(!H){var hh=rep.hints&&rep.hints.hd;$("p-hd").innerHTML=lockHTML("vip",LOCK_DESC.hd,hh?"你是<b>"+esc(hh.type)+"</b>，人類圖給你的策略是<b>「"+esc(hh.strat)+"」</b>：重要的職涯決定照這個節奏來，比靠腦袋硬想更準。":"");return}
  var chs=H.chans.map(function(c){return '<span class="tag">'+c[0]+"–"+c[1]+'</span>'}).join("")||'<span class="muted">無定義通道</span>';
  $("p-hd").innerHTML='<div class="split"><div style="min-width:0"><div class="kv"><div><span class="lab">類型</span><b>'+H.type+'</b></div><div><span class="lab">策略</span><b>'+H.strat+'</b></div><div><span class="lab">內在權威</span><b>'+H.auth+'</b></div><div><span class="lab">人生角色</span><b>'+H.profile+'</b></div></div>'+
    '<h3>你在職場的運作方式</h3><p>'+esc(H.text)+'</p><p>人生角色 '+H.profile+'（'+H.profileNames.join("／")+'）：'+esc(H.profileText)+'</p>'+
    '<h3>轉職的身體訊號</h3><p>當<b>'+H.sig+'</b>持續出現，代表你在錯的位置。決策依循「'+H.auth+'」：'+esc(H.authText)+'</p>'+
    '<h3>定義通道</h3><div class="tags">'+chs+'</div></div><div class="hd"><h3>九大中心</h3>'+hdSvg(H)+'<p class="muted small" style="text-align:center;margin-top:6px">金色為有定義中心</p></div></div>'+
    '<p class="note">人類圖由出生時刻（個性）與太陽回推 88° 的設計時刻（設計）共 26 個啟動點計算，月交點採平均交點。'+(rep.verdict.noTime?"未提供出生時間，月亮閘門可能不準，類型通常不受影響。":"")+'</p>';
}

/* ---------- 易經、梅花易數、生命靈數、九宮飛星、姓名學 ---------- */
var STANCE_NAME={move:"轉職",stay:"留任",wait:"觀望"};
function stancePill(s){return s?'<span class="pill st-'+s+'">'+STANCE_NAME[s]+'</span>':'<span class="pill">—</span>'}
function teaserHTML(t){return '<div class="teaser-box"><span class="lab">免費預覽</span><b>'+esc(t.title)+'</b><p>'+esc(t.line)+'</p></div>'}
function freeView(id,rep,key,need){
  var t=rep.teasers&&rep.teasers[key];
  if(key==="name"&&!t){$(id).innerHTML='<p class="notice">在左側填入姓名後重新推演，就能看到姓名學的分析。</p>';return}
  $(id).innerHTML=(t?teaserHTML(t):"")+lockHTML(need||"paid",LOCK_DESC[key]);
}
function hexHTML(h,label,moving){
  var ls=h.lines.map(function(v,i){return '<i class="ln'+(v?"":" yin")+(moving===i+1?" mv":"")+'"></i>'}).reverse().join("");
  return '<figure class="hx"><figcaption class="lab">'+label+'</figcaption><div class="hx-lines" aria-hidden="true">'+ls+'</div><b>'+h.name+'</b><span class="muted small">上'+h.upper+'下'+h.lower+'・第 '+h.no+' 卦</span></figure>';
}
function renderIching(rep){
  var X=rep.iching;if(!X){freeView("p-iching",rep,"iching");return}
  $("p-iching").innerHTML='<div class="split"><div style="min-width:0"><h3>你的先天卦：'+X.hex.name+'　'+stancePill(X.hex.stance)+'</h3><p>'+esc(X.hex.text)+'</p>'+
    '<h3>起卦過程</h3><p>以河洛理數將八字的天干地支化為數字：奇數相加為天數 '+X.tian+'，化為 '+X.tianNum+'；偶數相加為地數 '+X.di+'，化為 '+X.diNum+'。依洛書數取卦，'+X.order+'。</p>'+
    '<p class="note">本站採河洛理數的簡化算法，只取先天卦，不推元堂爻與後天卦。</p></div><div>'+hexHTML(X.hex,"先天卦")+'</div></div>';
}
function renderMeihua(rep){
  var X=rep.meihua;if(!X){freeView("p-meihua",rep,"meihua","vip");return}
  $("p-meihua").innerHTML='<div class="hx-row">'+hexHTML(X.ben,"本卦",X.moving)+hexHTML(X.hu,"互卦")+hexHTML(X.bian,"變卦")+'</div>'+
    '<h3>體用：'+X.relName+'　'+stancePill(X.stance)+'</h3><p>體卦（代表你）為'+X.ti+'，用卦（代表工作環境）為'+X.yong+'。'+esc(X.relText)+'</p>'+
    '<h3>卦象走向</h3><p>本卦'+X.ben.name+'：'+esc(X.ben.text)+'</p><p>互卦'+X.hu.name+'（過程）：'+esc(X.hu.text)+'</p><p>變卦'+X.bian.name+'（結果）：'+esc(X.bian.text)+esc(X.outcome)+'</p>'+
    '<p class="note">起卦：農曆年支數 '+X.nums.Y+'＋月 '+X.nums.M+'＋日 '+X.nums.D+' 得上卦，再加時支數 '+X.nums.H+' 得下卦，總數除以 6 得第 '+X.moving+' 爻動（圖中紅框標示）。</p>';
}
function yearTable(rows,mid){return '<div class="tscroll"><table><thead><tr><th>年份</th><th>'+mid[0]+'</th><th>判斷</th><th>職場提示</th></tr></thead><tbody>'+
  rows.map(function(r){return '<tr><td class="num">'+r.y+'</td><td>'+r[mid[1]]+'</td><td>'+stancePill(r.stance)+'</td><td style="white-space:normal">'+esc(r.text)+'</td></tr>'}).join("")+'</tbody></table></div>'}
function renderNumerology(rep){
  var X=rep.numerology;if(!X){freeView("p-numerology",rep,"numerology");return}
  $("p-numerology").innerHTML='<div class="big-num"><b>'+X.main+'</b><div><span class="lab">主命數 '+X.chain+'</span><h3 style="margin:2px 0 4px">'+X.title+'</h3><p style="margin:0">'+esc(X.text)+'</p></div></div>'+
    '<h3>未來 6 年流年數</h3>'+yearTable(X.years,["流年數","n"])+'<p class="note">流年數＝出生月日的數字加上該年份的數字，再加總化為 1–9。1、5、9 年利變動，4、6、8 年利深耕。</p>';
}
function renderNineStar(rep){
  var X=rep.ninestar;if(!X){freeView("p-ninestar",rep,"ninestar","vip");return}
  $("p-ninestar").innerHTML='<div class="big-num"><b>'+X.star+'</b><div><span class="lab">本命星（以 '+X.effYear+' 年立春後計）</span><h3 style="margin:2px 0 4px">'+X.name+'</h3><p style="margin:0">'+esc(X.text)+'</p></div></div>'+
    '<h3>未來 6 年本命星落宮</h3>'+yearTable(X.years,["落宮","palace"])+'<p class="note">飛入震、艮、巽宮的年份利轉換跑道，乾、離宮利升遷曝光，坎宮與中宮宜守。</p>';
}
function renderName(rep){
  var X=rep.name;if(!X){if(!rep.iching){freeView("p-name",rep,"name");return}$("p-name").innerHTML='<p class="notice">在左側填入姓名後重新推演，就能看到姓名學的分析。</p>';return}
  $("p-name").innerHTML='<div class="name-chars">'+X.chars.map(function(c){return '<div><b>'+esc(c.c)+'</b><span class="num">'+c.s+'</span></div>'}).join("")+'</div>'+
    '<div class="tscroll"><table><thead><tr><th>五格</th><th style="text-align:right">筆畫</th><th>五行</th><th>吉凶</th></tr></thead><tbody>'+
    X.grids.map(function(g){return '<tr><td>'+g.name+'</td><td class="num">'+g.n+'</td><td>'+g.el+'</td><td><span class="pill '+(g.luck==="吉"?"good":g.luck==="凶"?"bad":"mid")+'">'+g.luck+'</span></td></tr>'}).join("")+'</tbody></table></div>'+
    '<h3>三才配置：'+X.sancai+'　'+stancePill(X.stance)+'</h3><p>'+esc(X.sancaiFlow)+'</p><p>'+esc(X.renText)+esc(X.zongText)+'</p><p>'+esc(X.favText)+'</p>'+
    '<p class="note">筆畫採康熙字典算法（例如「氵」以「水」4 畫計）。複姓會自動辨識。</p>';
}

/* ---------- 每日職場一卦 ---------- */
var LUCK_CLASS={大吉:"good",吉:"good",小吉:"mid",小凶:"bad",凶:"bad"};
function renderDivine(d,note){
  $("dvOut").innerHTML=(note?'<p class="small muted">'+note+'</p>':"")+
    '<div class="dv-head"><span class="lab">'+esc(d.date)+'・'+esc(d.shichen)+'起卦</span><div class="dv-q">「'+esc(d.question)+'」</div>'+
    '<div class="dv-luck"><span class="pill '+LUCK_CLASS[d.luck]+'">'+d.luck+'</span> '+d.relName+'：'+esc(d.relText)+'</div></div>'+
    '<div class="hx-row">'+hexHTML(d.ben,"本卦",d.moving)+hexHTML(d.hu,"互卦")+hexHTML(d.bian,"變卦")+'</div>'+
    '<p>本卦'+d.ben.name+'（現況）：'+esc(d.ben.text)+'</p><p>變卦'+d.bian.name+'（結果）：'+esc(d.bian.text)+esc(d.outcome)+'</p>'+
    '<p class="note">體卦（代表你）'+d.ti+'，用卦（代表這件事）'+d.yong+'。前半筆畫 '+d.nums.upper+' 起上卦、後半筆畫 '+d.nums.lower+' 起下卦，加時辰數 '+d.nums.hour+' 得第 '+d.moving+' 爻動。</p>';
}

/* ---------- 綜合比對 ---------- */
var CMP={sel:[],tier:"free"};
function cmpLimit(){return CMP.tier==="vip"?99:2}
var STANCE_ADVICE={move:"建議你轉職",stay:"建議你留任",wait:"建議你先觀望"};
function renderCmpTeaser(rep){
  var c=rep.hints&&rep.hints.consensus;
  if(!c){$("cmpTeaser").innerHTML="";return}
  var v=c.votes, tally=["move","stay","wait"].filter(function(k){return v[k]}).map(function(k){return STANCE_NAME[k]+" "+v[k]+" 種"}).join("、");
  $("cmpTeaser").innerHTML='<div class="teaser cmp-teaser"><p>'+(c.lead?"我們已經用 "+c.systems+" 種學派排過你的命盤：<b>"+v[c.lead]+" 種"+STANCE_ADVICE[c.lead]+"</b>（"+tally+"）。"
    :"我們已經用 "+c.systems+" 種學派排過你的命盤，<b>各派意見分歧</b>（"+tally+"）。")+"VIP 版可以把 10 種學派放在一起比對理由與時機交集。"+upLink("vip")+"</p></div>";
}
function renderCmpFree(rep){
  var c=rep.hints.consensus, v=c.votes, tot=v.move+v.stay+v.wait;
  $("cmpTeaser").innerHTML='<div class="consensus"><div><span class="lab">'+c.systems+' 種學派的投票結果</span><div class="cons-call">'+(c.lead?'傾向<em>'+STANCE_NAME[c.lead]+'</em>':'<em>意見分歧</em>')+'</div>'+
    '<p style="margin:0">'+(c.lead?v[c.lead]+" 種學派"+STANCE_ADVICE[c.lead]+"。":"各學派看法不一，這個決定沒有一面倒的答案，請以現實條件為主。")+'</p></div>'+
    '<div style="min-width:0"><span class="lab">票數</span><div class="vote-bar">'+["move","stay","wait"].map(function(k){return v[k]?'<i class="st-'+k+'" style="width:'+(v[k]/tot*100)+'%"></i>':""}).join("")+'</div>'+
    '<div class="vote-legend small">'+["move","stay","wait"].map(function(k){return '<span><i class="dot st-'+k+'"></i>'+STANCE_NAME[k]+' '+v[k]+'</span>'}).join("")+'</div></div></div>'+
    '<p class="small muted" style="margin:0">付費版可以並排比對各學派的理由、轉職與升遷時機，看它們在哪裡印證、在哪裡分歧。</p>';
}
function renderChips(rep){
  CMP.tier=rep.tier;
  var free=rep.tier==="free";
  ["sysChips","cmpHint","cmpOut"].forEach(function(id){$(id).hidden=free});
  document.querySelector("#compareBlock .cmp-bar").hidden=free;
  if(free){renderCmpFree(rep);return}
  renderCmpTeaser(rep);
  if(!CMP.sel.length)CMP.sel=CMP.tier==="vip"?["bazi","ziwei","astro","iching","meihua"]:["bazi","ziwei"];
  $("sysChips").innerHTML=["東方","西方"].map(function(sc){return '<div class="chip-row"><span class="school">'+sc+'學派</span>'+rep.systems.filter(function(x){return x.school===sc}).map(function(x){var on=CMP.sel.indexOf(x.key)>=0;return '<button type="button" class="chip" data-k="'+x.key+'" aria-pressed="'+on+'">'+x.name+'</button>'}).join("")+'</div>'}).join("");
  $("sysChips").querySelectorAll(".chip").forEach(function(b){b.addEventListener("click",function(){
    var k=b.dataset.k,i=CMP.sel.indexOf(k);if(i>=0)CMP.sel.splice(i,1);else CMP.sel.push(k);
    b.setAttribute("aria-pressed",String(i<0));cmpStatus(rep)})});
  cmpStatus(rep);$("cmpOut").innerHTML="";
}
function cmpNeed(rep){
  var vipSys=CMP.sel.some(function(k){return rep.systems.some(function(x){return x.key===k&&x.vipOnly})});
  if((vipSys||CMP.sel.length>=3)&&CMP.tier!=="vip")return "vip";
  return null;
}
// 學派選項不標 VIP，選了才說明哪些需要 VIP（#3）
function cmpNeedText(rep){
  var vipNames=CMP.sel.map(function(k){return rep.systems.filter(function(x){return x.key===k&&x.vipOnly})[0]}).filter(Boolean).map(function(x){return x.name});
  return (vipNames.length?vipNames.join("、")+"是 VIP 版的學派。":"同時比對 3 種以上需要 VIP 版。");
}
function cmpStatus(rep){
  var n=CMP.sel.length, need=cmpNeed(rep);
  $("cmpCount").textContent="已選 "+n+" 種・"+TIER_NAME[CMP.tier]+(CMP.tier==="vip"?" 可不限種類比對":" 最多可同時比對 "+cmpLimit()+" 種");
  $("cmpGo").disabled=!n||!!need;
  $("cmpHint").innerHTML=!n?'<p class="small muted">請至少選擇一種系統。</p>':need?'<p class="small muted">'+cmpNeedText(rep)+upLink(need)+'</p>':"";
}
function renderCompare(r){
  var C=r.consensus, html="";
  if(C){
    var tot=C.votes.move+C.votes.stay+C.votes.wait;
    html+='<div class="consensus"><div><span class="lab">綜合判斷</span><div class="cons-call">'+(C.lead?'傾向<em>'+STANCE_NAME[C.lead]+'</em>':'<em>意見分歧</em>')+'</div><p style="margin:0">'+esc(C.summary)+esc(C.advice)+'</p></div>'+
      '<div style="min-width:0"><span class="lab">共識度 '+C.agree+'%</span><div class="vote-bar">'+["move","stay","wait"].map(function(k){return C.votes[k]?'<i class="st-'+k+'" style="width:'+(C.votes[k]/tot*100)+'%" title="'+STANCE_NAME[k]+' '+C.votes[k]+'"></i>':""}).join("")+'</div>'+
      '<div class="vote-legend small">'+["move","stay","wait"].map(function(k){return '<span><i class="dot st-'+k+'"></i>'+STANCE_NAME[k]+' '+C.votes[k]+'</span>'}).join("")+'</div>'+
      (C.env?'<p class="small" style="margin:8px 0 0">最多系統推薦的環境：<b>'+esc(C.env)+'</b></p>':"")+(C.year?'<p class="small" style="margin:4px 0 0">轉職時機交集：<b>'+esc(C.year)+'</b></p>':"")+'</div></div>';
    var S=C.schools||{};
    if(S.東方||S.西方)html+='<div class="ew">'+["東方","西方"].map(function(sc){var x=S[sc];return '<div class="ew-side"><span class="lab">'+sc+'學派</span>'+(x?'<b>'+(x.lead?stancePill(x.lead):'<span class="pill">分歧</span>')+'</b><span class="small muted">'+esc(x.text)+'</span>':'<span class="small muted">這次沒有選'+sc+'學派</span>')+'</div>'}).join('<div class="ew-vs">VS</div>')+(S.verdict?'<p class="ew-verdict">'+esc(S.verdict)+'</p>':'')+'</div>';
  }
  html+='<div class="sys-cards">'+r.cards.map(function(c){
    return '<article class="sys-card"><header><b>'+c.name+' <span class="school-tag">'+c.school+'</span></b>'+stancePill(c.stance)+'</header><dl>'+
      '<dt>轉職時機</dt><dd>'+esc(c.moveWhen||"—")+'</dd><dt>升遷時機</dt><dd>'+esc(c.stayWhen||"—")+'</dd><dt>適合環境</dt><dd>'+esc(c.envName||"—")+'</dd></dl><p>'+esc(c.note)+'</p></article>'}).join("")+'</div>';
  $("cmpOut").innerHTML=html;
}

/* ---------- 解鎖完整報告：免費版把時機曲線、公司類型排名、學派解讀、決策工具合成一區，不再連排鎖卡 ---------- */
var UNLOCK_PREVIEW={
  schools:'<div class="pv-grid">'+["八字","紫微","星盤","易經","靈數","姓名"].map(function(x){return '<i>'+x+'</i>'}).join("")+'</div>',
  chart:'<svg viewBox="0 0 200 70" preserveAspectRatio="none"><path d="M0 50 L20 38 L40 44 L60 20 L80 30 L100 26 L120 48 L140 14 L160 30 L180 22 L200 36" stroke="var(--s-move)"/><path d="M0 30 L20 26 L40 14 L60 22 L80 12 L100 30 L120 24 L140 34 L160 18 L180 26 L200 20" stroke="var(--s-stay)"/></svg>',
  fit:'<div class="pv-bars">'+[88,63,61,52].map(function(v){return '<i style="width:'+v+'%"></i>'}).join("")+'</div>',
  tools:'<div class="pv-vs"><span>A</span><b>VS</b><span>B</span></div>'
};
function renderUnlock(rep){
  var locked=!rep.months;
  $("unlockBlock").hidden=!locked;
  ["chartBlock","fitBlock","toolbox"].forEach(function(id){$(id).hidden=locked});
  if(!locked){$("unlockArea").innerHTML="";return}
  var tiles=[["chart","36 個月時機曲線","paid"],["fit","六類公司完整排名","paid"],["schools","六種學派完整解讀","paid"],["tools","決策工具","vip"]];
  $("unlockArea").innerHTML='<div class="unlock-grid">'+tiles.map(function(t){
    return '<div class="unlock-tile"><div class="pv" aria-hidden="true">'+UNLOCK_PREVIEW[t[0]]+'</div><h3>'+t[1]+(t[2]==="vip"?' <span class="lk">VIP</span>':'')+'</h3><p>'+LOCK_DESC[t[0]]+'</p></div>'}).join("")+'</div>'+
    '<div class="unlock-cta"><p>職運羅盤還在測試階段，你的贊助會用來把排盤做得更準，同時為你開通付費版的前三項：看懂這些答案背後的理由與完整時間軸。決策工具為 VIP 專屬。</p><div><button type="button" class="btn-gold" data-upgrade="paid">支持測試，開通付費版</button><a class="sample-link" href="?sample=paid" data-sample="paid">先看張三豐的付費版範例報告</a></div></div>';
}

/* ---------- 手機版：有結果後把生辰表單收成一行摘要 ---------- */
function renderFormSum(){
  var example=!!window.SAMPLE||!$("sampleNote").hidden, t=$("noTime").checked||!$("bt").value?"時辰不詳":$("bt").value;
  var who=window.SAMPLE?"範例・"+esc($("nm").value):example?"範例命盤":"你的命盤";
  $("formSum").innerHTML='<div><span class="lab">'+who+'</span><b>'+esc($("bd").value.replace(/-/g,"/"))+'　'+t+'</b><span class="small muted">'+esc($("cityInput").value)+'・'+($("gM").checked?"男":"女")+'</span></div>'+
    '<button type="button" class="btn-line" id="formEdit">'+(example?"換成我的生辰":"修改生辰")+'</button>';
  $("formEdit").addEventListener("click",function(){expandForm(true)});
  $("formSum").hidden=false;
  document.querySelector("aside.form").classList.add("collapsed");
}
function expandForm(focus){
  document.querySelector("aside.form").classList.remove("collapsed");
  if(focus){$("bd").focus();$("bd").scrollIntoView({behavior:"smooth",block:"center"})}
}

function renderAll(rep){
  todaySel=0;chartSel=null;
  renderUnlock(rep);renderFormSum();
  renderVerdict(rep);renderToday(rep);renderChartArea(rep);renderFit(rep);
  renderBazi(rep);renderZiwei(rep);renderAstro(rep);renderQimen(rep);renderHD(rep);
  renderIching(rep);renderMeihua(rep);renderNumerology(rep);renderNineStar(rep);renderName(rep);renderChips(rep);
}
