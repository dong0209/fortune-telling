/* 職涯工具箱：每日運勢、月份詳解、offer 比較、現職適配、合盤、奇門擇時、IG 圖卡、分享連結 */
var CUR=null, chartSel=null, todaySel=0;
var WEEK="日一二三四五六";
function md(dt){return (dt.getMonth()+1)+"/"+dt.getDate()+"（"+WEEK[dt.getDay()]+"）"}
function ymd(dt){return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0")}
function parseDate(v){if(!v)return null;var p=v.split("-").map(Number);return new Date(p[0],p[1]-1,p[2])}
function meterRow(label,v,color){return '<div class="meter-row"><span>'+label+'</span><div class="bar"><i style="width:'+v+'%;background:'+color+'"></i></div><span class="num">'+v+'</span></div>'}
var ACT_LABEL={good:"宜",mid:"平",bad:"忌"};

/* ---------- 表單選單 ---------- */
function fillToolSelects(){
  document.querySelectorAll(".sel-type").forEach(function(s){s.innerHTML='<option value="">選擇公司類型</option>'+Object.keys(FIT_NAME).map(function(k){return '<option value="'+k+'">'+FIT_NAME[k]+'</option>'}).join("")});
  document.querySelectorAll(".sel-ind").forEach(function(s){s.innerHTML='<option value="">選擇產業</option>'+WX.map(function(w,e){return '<optgroup label="'+w+'">'+IND_LIST.filter(function(x){return x.e===e}).map(function(x){return '<option>'+x.n+'</option>'}).join("")+'</optgroup>'}).join("")});
  document.querySelectorAll(".sel-role").forEach(function(s){s.innerHTML='<option value="">選擇職能</option>'+Object.keys(ROLES).map(function(r){return '<option>'+r+'</option>'}).join("")});
  document.querySelectorAll(".sel-dir").forEach(function(s){s.innerHTML='<option value="">不確定</option>'+Object.keys(DIR_EL).map(function(d){return '<option value="'+d+'">'+d+'（'+WX[DIR_EL[d]]+'）</option>'}).join("")});
}

/* ---------- 每日職場運勢 ---------- */
function renderToday(R){
  var now=new Date(), days=[];
  for(var i=0;i<7;i++)days.push(dailyFortune(R.B,new Date(now.getFullYear(),now.getMonth(),now.getDate()+i)));
  var t=days[todaySel]||days[0];
  $("todayTitle").textContent=todaySel===0?"今天適合做什麼":md(t.date)+"適合做什麼";
  $("today").innerHTML='<div class="today"><div style="min-width:0">'+
    '<div class="today-head"><div class="today-score"><b class="num">'+t.score+'</b><span>職場指數</span></div>'+
    '<div><div class="today-date">'+md(t.date)+'　'+t.gz+'日</div><div class="muted small">流日'+t.god+'・巳時值使'+t.door+'門・開門在'+t.openDir+'方'+(t.weekend?"・週末":"")+'</div></div></div>'+
    '<div class="acts">'+ACTS.map(function(a){var s=t.acts[a];return '<div class="act '+s+'"><span>'+a+'</span><b>'+ACT_LABEL[s]+'</b></div>'}).join("")+'</div>'+
    '<ul class="notes">'+t.notes.map(function(n){return '<li>'+esc(n)+'</li>'}).join("")+'</ul></div>'+
    '<div class="strip" role="list" aria-label="未來 7 天">'+days.map(function(d,i){
      return '<button type="button" role="listitem" class="sday'+(i===todaySel?" on":"")+'" data-i="'+i+'" aria-pressed="'+(i===todaySel)+'"><span>'+(i===0?"今天":"週"+WEEK[d.date.getDay()])+'</span><span class="num small">'+(d.date.getMonth()+1)+'/'+d.date.getDate()+'</span><span class="sbar"><i style="height:'+d.score+'%"></i></span><b class="num">'+d.score+'</b></button>'}).join("")+'</div></div>';
  $("today").querySelectorAll(".sday").forEach(function(b){b.addEventListener("click",function(){todaySel=+b.dataset.i;renderToday(R)})});
}

/* ---------- 月份詳解 ---------- */
function monthAdvice(m){
  var out=[];
  if(m.move>=65)out.push("更新履歷與作品集，把近一年成果量化","主動聯繫獵頭，或約業界朋友 coffee chat","鎖定 3–5 個目標職缺投遞");
  if(m.stay>=65)out.push("跟主管約 1:1，直接談你下一階的目標","爭取一個能被高層看見的專案","整理成果，準備考核或加薪談判");
  if(!out.length&&m.move<40&&m.stay<40)out.push("低調蓄力，適合進修或考證照","不宜裸辭或衝動提離職","經營人脈，為下一個窗口做準備");
  if(!out.length)out.push(m.move>m.stay?"外部機會開始浮現，可以先看看市場行情":"內部機會較多，先把手上的事做出亮點","維持現狀的同時，保留一點觀察外部的時間");
  return out.slice(0,4);
}
function selectMonth(i){
  if(!CUR)return;chartSel=i;
  var m=CUR.months[i], dim=new Date(m.y,m.m,0).getDate(), today=new Date(), list=[];
  for(var d=1;d<=dim;d++){var dt=new Date(m.y,m.m-1,d);if(dt<=today)continue;var f=dailyFortune(CUR.B,dt);if(!f.weekend)list.push(f)}
  var good=list.sort(function(a,b){return b.score-a.score}).slice(0,3).sort(function(a,b){return a.date-b.date});
  var sys=Object.keys(m.detail).map(function(k){var ns=m.detail[k];return '<div><span class="lab">'+k+'</span>'+(ns.length?'<ul>'+ns.map(function(n){return '<li>'+esc(n)+'</li>'}).join("")+'</ul>':'<p class="muted small">無特別訊號</p>')+'</div>'}).join("");
  $("monthDetail").innerHTML='<div class="md-head"><h3>'+m.y+' 年 '+m.m+' 月　<span class="muted">'+m.ygz+'年 '+m.mgz+'月</span></h3>'+
    '<div class="md-meters">'+meterRow("轉職",m.move,"var(--s-move)")+meterRow("升遷",m.stay,"var(--s-stay)")+'</div></div>'+
    '<div class="md-grid">'+sys+'</div>'+
    '<div class="md-grid two"><div><span class="lab">這個月建議你</span><ul>'+monthAdvice(m).map(function(a){return '<li>'+a+'</li>'}).join("")+'</ul></div>'+
    '<div><span class="lab">本月職場吉日（平日）</span>'+(good.length?'<ul>'+good.map(function(g){return '<li><b class="num">'+md(g.date)+'</b> '+g.gz+'日，'+g.door+'門，開門'+g.openDir+'</li>'}).join("")+'</ul>':'<p class="muted small">本月剩餘日子不多，請看下個月。</p>')+'</div></div>';
  var sl=$("selLine");if(sl){var x=sl.dataset.x0*1+sl.dataset.step*i;sl.setAttribute("x1",x);sl.setAttribute("x2",x);sl.setAttribute("visibility","visible")}
}

/* ---------- offer 比較 ---------- */
function readJob(prefix){
  return {name:$(prefix+"-name").value.trim(),type:$(prefix+"-type").value,industry:$(prefix+"-ind").value,role:$(prefix+"-role").value,dir:$(prefix+"-dir").value,date:parseDate($(prefix+"-date").value)};
}
function compareOffers(){
  var A=readJob("oA"),B=readJob("oB");
  A.name=A.name||"公司 A";B.name=B.name||"公司 B";
  if(!(A.type||A.industry)||!(B.type||B.industry)){$("offerOut").innerHTML='<p class="err">每家公司至少選擇公司類型或產業，才有辦法比較。</p>';return}
  var sa=scoreJob(CUR,A), sb=scoreJob(CUR,B), keys=[];
  sa.parts.concat(sb.parts).forEach(function(p){if(keys.indexOf(p.k)<0)keys.push(p.k)});
  function cell(s,k){var p=s.parts.filter(function(x){return x.k===k})[0];return p?'<td class="num">'+p.v+'</td>':'<td class="muted">—</td>'}
  var label={type:"公司類型",industry:"產業五行",role:"職能",dir:"方位",date:"報到時機"};
  var diff=sa.total-sb.total, win=diff>=5?A.name:diff<=-5?B.name:null;
  function dayNote(s,o){var p=s.parts.filter(function(x){return x.k==="date"})[0];return p?'<li>'+esc(o.name)+' 報到日 '+md(o.date)+'：'+p.day.gz+'日，流日'+p.day.god+'，巳時'+p.day.door+'門</li>':""}
  function indNote(s,o){var p=s.parts.filter(function(x){return x.k==="industry"})[0];return p?'<li>'+esc(o.name)+' 的產業屬'+WX[p.el]+'，'+(p.v>=80?"是你的喜用五行":"不是你的喜用五行")+'</li>':""}
  $("offerOut").innerHTML='<div class="cmp-verdict">'+(win?'命盤上 <b>'+esc(win)+'</b> 比較適合你':'兩家差距不大，回到薪資、團隊與通勤等現實條件來決定')+'</div>'+
    '<div class="tscroll"><table><thead><tr><th>項目</th><th style="text-align:right">'+esc(A.name)+'</th><th style="text-align:right">'+esc(B.name)+'</th></tr></thead><tbody>'+
    keys.map(function(k){return '<tr><td>'+label[k]+'</td>'+cell(sa,k)+cell(sb,k)+'</tr>'}).join("")+
    '<tr class="total"><td>綜合分數</td><td class="num">'+sa.total+'</td><td class="num">'+sb.total+'</td></tr></tbody></table></div>'+
    '<ul class="notes">'+indNote(sa,A)+indNote(sb,B)+dayNote(sa,A)+dayNote(sb,B)+'</ul>'+
    '<p class="note">分數只反映命盤上的契合度。薪資、職稱、主管與成長空間仍然是最重要的現實條件。</p>';
}

/* ---------- 現職適配度 ---------- */
function checkCurrent(){
  var o={type:$("fn-type").value,industry:$("fn-ind").value,role:$("fn-role").value,founded:+$("fn-founded").value||null};
  if(o.founded&&(o.founded<1850||o.founded>new Date().getFullYear()))o.founded=null;
  if(!o.type&&!o.industry&&!o.role){$("fitOut").innerHTML='<p class="err">至少選擇公司類型、產業或職能其中一項。</p>';return}
  var s=scoreJob(CUR,o), B=CUR.B, low=s.parts.slice().sort(function(a,b){return a.v-b.v})[0], top=CUR.fitList[0];
  var why={
    type:"公司型態跟你的命盤不太合拍。你最適合的是「"+FIT_NAME[top.k]+"」，"+FIT_DESC[top.k],
    industry:"產業屬"+WX[low.el||0]+"，不是你的喜用五行，做起來比較費力。對你最有利的是"+bestIndustry(B).join("、")+"這類產業。",
    role:"目前的職能用不太到你的強項。命盤上最能發揮的是「"+bestRole(B)+"」，可以考慮內部轉調。",
    founded:"公司成立年（"+(low.gz||"")+"）的五行跟你不合，整體氣場比較難互相拉抬。"
  };
  var level=s.total>=75?"高度契合":s.total>=55?"中等契合":"契合度偏低";
  var tip=s.total>=70?(CUR.stAvg>=CUR.mvAvg?"契合度高，未來一年的升遷動能也比較強，建議留下來拚下一階。":"契合度不錯，但外部動能較強，可以先在內部爭取更好的位置，同時留意外面的機會。"):
    s.total>=55?(CUR.stAvg>=CUR.mvAvg?"契合度普通，但未來一年升遷動能較強，先把卡住的那一項補起來，爭取下一階。":"契合度普通，外部動能也偏強，可以一邊補強卡住的那一項，一邊觀察外面的機會。"):
    (CUR.mvAvg>CUR.stAvg?"契合度不高，加上未來一年轉職動能較強，可以開始規劃離開。":"契合度不高，但近期的轉職動能不強，建議先爭取內部轉調或調整職能。");
  $("fitOut").innerHTML='<div class="fit-now"><div class="big-score"><b class="num">'+s.total+'</b><span>'+level+'</span></div><div style="min-width:0">'+
    s.parts.map(function(p){return meterRow(p.label,p.v,"var(--accent)")}).join("")+'</div></div>'+
    (low.v<70?'<h3>卡住你的是：'+low.label+'</h3><p>'+why[low.k]+'</p>':'<h3>每一項都在水準之上</h3><p>這家公司跟你的命盤相當合拍。</p>')+
    '<h3>建議</h3><p>'+tip+'</p>';
}

/* ---------- 主管／同事合盤 ---------- */
var REL_TEXT={印:"對方的五行生你，是貴人型的關係。",官殺:"對方的五行剋你，會給你壓力，也會逼你成長。",財:"你的五行剋對方，在這段關係裡你比較強勢。",食傷:"你的五行生對方，你付出得多，對方受益多。",比劫:"兩人五行相同，像夥伴也像對手。"};
var STRAT={
  主管:{印:"主動請益、讓他帶你，升遷靠他推薦最快。",官殺:"交付要準時、數字要清楚，扛住他給的壓力就是升遷門票。",財:"注意別搶他的功，用「幫你達成目標」的方式提案。",食傷:"你容易一直付出，記得定期 1:1 對齊，讓成果被看見。",比劫:"他可能把你當潛在競爭者，分工要清楚，公開場合把功勞歸給他。"},
  同事:{印:"他是你的資源，多交流對你有幫助。",官殺:"他容易挑你毛病，用文件化溝通減少摩擦。",財:"你容易主導，別讓他覺得被指揮。",食傷:"你會幫他很多，注意界線，別把他的工作攬到自己身上。",比劫:"分工清楚，維持良性競爭。"},
  下屬:{印:"他會反過來支持你，給他發揮的空間。",官殺:"他有主見、會挑戰你，用目標而不是命令來管理。",財:"你管得住他，給清楚的指令即可。",食傷:"你會花很多心力培養他，值得，但別過度。",比劫:"讓他負責獨立的一塊，避免爭功。"}
};
STRAT.老闆=STRAT.主管;
var HD_COMM={生產者:"用是非題問他，讓他回應，不要一次丟一大包任務。",顯示生產者:"給他幾個選項讓他快速回應，容忍他跳步。",投射者:"先詢問他的意見，被邀請的建議他才聽得進去。",顯示者:"他習慣先做再說，請他事前告知，你自己也主動同步進度。",反映者:"重要決定給他時間，不要當場逼他表態。"};
var WX_STYLE=["重理念與成長，跟他談願景與發展","重熱情與速度，簡報要有亮點","重穩定與信用，說到做到最重要","重規則與效率，先給結論和數據","重彈性與資訊，先給全貌再談細節"];
function runSynastry(){
  var bd=parseDate($("sy-bd").value);
  if(!bd||bd.getFullYear()<1920||bd>new Date()){$("synOut").innerHTML='<p class="err">請輸入對方 1920 年以後的出生日期。</p>';return}
  var noTime=$("sy-notime").checked||!$("sy-bt").value, t=($("sy-bt").value||"12:00").split(":").map(Number), me=CUR.inp;
  var other={y:bd.getFullYear(),m:bd.getMonth()+1,d:bd.getDate(),hh:t[0],mm:t[1],noTime:noTime,gender:$("sy-gM").checked?"男":"女",lat:me.lat,lon:me.lon,tz:me.tz};
  var rel_=$("sy-rel").value, nm=$("sy-name").value.trim()||"對方", S=synastry(CUR,other);
  var emTxt=S.em.length?S.em.map(function(c){return c[0]+"–"+c[1]}).join("、"):"";
  $("synOut").innerHTML='<div class="fit-now"><div class="big-score"><b class="num">'+S.score+'</b><span>合作契合度</span></div><div style="min-width:0">'+
    '<p style="margin:0 0 6px"><b>'+esc(nm)+'</b>：日主 '+S.B2.dmG+WX[S.B2.dm]+'，人類圖 '+S.H2.type+'。</p><p class="muted small" style="margin:0">'+REL_TEXT[S.theyToMe]+'</p></div></div>'+
    '<ul class="notes">'+S.notes.map(function(n){return '<li>'+esc(n)+'</li>'}).join("")+
    (S.em.length?'<li>人類圖電磁通道 '+emTxt+'：你們各持一半，湊在一起會互相吸引、激出火花</li>':"")+
    (S.comp.length?'<li>人類圖共有通道 '+S.comp.map(function(c){return c[0]+"–"+c[1]}).join("、")+'：做事方式相近，合作安心</li>':"")+'</ul>'+
    '<h3>跟'+esc(nm)+'相處的策略</h3><ul class="notes"><li>'+STRAT[rel_][S.theyToMe]+'</li><li>溝通方式：'+HD_COMM[S.H2.type]+'</li><li>對方'+WX[S.B2.dm]+'日主，'+WX_STYLE[S.B2.dm]+'。</li></ul>'+
    (noTime?'<p class="note">未提供對方出生時間，八字以三柱計算，人類圖以中午 12 點推算。</p>':"");
}

/* ---------- 奇門指定日期擇時 ---------- */
var SHICHEN=[["子",0,"23–01"],["丑",2,"01–03"],["寅",4,"03–05"],["卯",6,"05–07"],["辰",8,"07–09"],["巳",10,"09–11"],["午",12,"11–13"],["未",14,"13–15"],["申",16,"15–17"],["酉",18,"17–19"],["戌",20,"19–21"],["亥",22,"21–23"]];
var DOOR_USE={開:"面試、提案、開工",休:"拜訪貴人、請託、休息",生:"談薪、簽約、談條件",景:"簡報、文書、發表",杜:"保密、閉門作業",傷:"不宜談判",驚:"不宜重要會談",死:"不宜行動"};
function renderQimenHours(dt){
  if(!CUR||!dt)return;
  var rows=SHICHEN.map(function(s){var q=qimen(dt.getFullYear(),dt.getMonth()+1,dt.getDate(),s[1]);var door=q.doors[q.zhiShiAt];return {s:s,q:q,door:door}});
  var q0=rows[5].q, clash=chong(q0.dgz[1],CUR.B.dayZhi);
  $("qmHours").innerHTML='<p class="small">'+md(dt)+'　'+q0.dgz+'日，'+(q0.yang?"陽":"陰")+'遁'+q0.ju+'局。'+(clash?'<span style="color:var(--bad)">這天與你的日支相沖，重要事情盡量改期。</span>':"")+'</p>'+
    '<div class="tscroll"><table><thead><tr><th>時辰</th><th>時間</th><th>時干支</th><th>值使</th><th>開門方位</th><th>適合</th></tr></thead><tbody>'+
    rows.map(function(r){var g=DOOR_Q[r.door]>=2?"good":DOOR_Q[r.door]>0?"mid":"bad";var work=r.s[1]>=8&&r.s[1]<=18;
      return '<tr'+(work&&g==="good"?' class="hl-row"':"")+'><td>'+r.s[0]+'時</td><td class="num" style="text-align:left">'+r.s[2]+'</td><td>'+r.q.hgz+'</td><td><span class="pill '+g+'">'+r.door+'門</span></td><td>'+r.q.openDir+'</td><td>'+DOOR_USE[r.door]+'</td></tr>'}).join("")+
    '</tbody></table></div><p class="note">底色標示的是上班時段內值使落在吉門的時辰。</p>';
}

/* ---------- 分享連結 ---------- */
function shareURL(){
  var inp=CUR.inp, p=new URLSearchParams();
  p.set("b",$("bd").value);if(!inp.noTime)p.set("t",$("bt").value.replace(":",""));
  p.set("g",inp.gender==="男"?"M":"F");p.set("c",$("city").value);p.set("q",inp.q);p.set("y",String(inp.yrs));
  var base=/^https?:/.test(location.protocol)?location.origin+location.pathname:location.href.split(/[?#]/)[0];
  return base+"?"+p.toString();
}
function applyParams(){
  var p=new URLSearchParams(location.search);if(!p.get("b"))return false;
  $("bd").value=p.get("b");
  var t=p.get("t");if(t&&/^\d{4}$/.test(t)){$("bt").value=t.slice(0,2)+":"+t.slice(2);$("noTime").checked=false;$("bt").disabled=false}else{$("noTime").checked=true;$("bt").disabled=true}
  (p.get("g")==="M"?$("gM"):$("gF")).checked=true;
  if(p.get("c")&&CITIES[+p.get("c")])$("city").value=p.get("c");
  if(p.get("q"))$("q").value=p.get("q");
  if(p.get("y"))$("yrs").value=p.get("y");
  $("sampleNote").hidden=true;return true;
}
function copyShare(){
  var url=shareURL(), msg=$("shareMsg");
  function fallback(){msg.innerHTML='請手動複製：<input id="shareField" readonly value="'+esc(url)+'">';var f=$("shareField");f.focus();f.select()}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){msg.textContent="已複製分享連結。連結內含出生日期，請只分享給信任的人。"},fallback)}else fallback();
}

/* ---------- IG 限動圖卡 ---------- */
function wrapText(ctx,text,x,y,maxW,lh){
  var line="",lines=[];
  for(var i=0;i<text.length;i++){var t=line+text[i];if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=text[i]}else line=t}
  if(line)lines.push(line);
  lines.forEach(function(l,i){ctx.fillText(l,x,y+i*lh)});return y+lines.length*lh;
}
function drawCard(){
  var R=CUR, cv=document.createElement("canvas");cv.width=1080;cv.height=1920;
  var c=cv.getContext("2d"), SERIF='"Noto Serif TC","Songti TC",serif', SANS='"Noto Sans TC","PingFang TC",sans-serif', MONO='"IBM Plex Mono",monospace';
  var BG="#131A2B", GOLD="#D4B064", INK="#EEEBE2", MUTED="#9BA5B8", LINE="#2C3550", MOVE="#EF7A4A", STAY="#4F96EC";
  c.fillStyle=BG;c.fillRect(0,0,1080,1920);
  c.strokeStyle=GOLD;c.lineWidth=2;c.strokeRect(48,48,984,1824);
  c.lineWidth=4;c.strokeRect(96,120,96,96);c.fillStyle=GOLD;c.textAlign="center";c.font="900 38px "+SERIF;c.fillText("職",144,162);c.fillText("運",144,204);
  c.textAlign="left";c.fillStyle=INK;c.font="900 64px "+SERIF;c.fillText("職運羅盤",222,176);
  c.fillStyle=MUTED;c.font="400 28px "+SANS;c.fillText("八字・紫微・奇門・人類圖・星盤　五術合參",222,214);
  c.fillStyle=GOLD;c.font="700 28px "+SANS;c.fillText("我 的 職 涯 判 讀",96,330);
  var call=$("verdictBlock").querySelector(".verdict-call").textContent;
  c.fillStyle=INK;c.font="900 84px "+SERIF;var y=wrapText(c,call,96,440,888,104);
  var sub=$("verdictBlock").querySelector(".verdict-call+p").textContent.split("。")[0]+"。";
  c.fillStyle=MUTED;c.font="400 34px "+SANS;y=wrapText(c,sub,96,y+10,888,52);
  /* 四柱 */
  var py=Math.max(y+40,720), pos=["年柱","月柱","日柱","時柱"];
  R.B.pillars.forEach(function(p,i){
    var x=96+i*228, unknown=i===3&&R.inp.noTime;
    c.strokeStyle=i===2?GOLD:LINE;c.lineWidth=i===2?4:2;c.strokeRect(x,py,204,256);
    c.textAlign="center";c.fillStyle=MUTED;c.font="400 26px "+SANS;c.fillText(pos[i],x+102,py+44);
    c.fillStyle=i===2?GOLD:INK;c.font="900 72px "+SERIF;c.fillText(unknown?"？":p[0],x+102,py+122);c.fillText(unknown?"？":p[1],x+102,py+196);
    c.fillStyle=GOLD;c.font="400 24px "+SANS;c.fillText(unknown?"":R.B.gods[i],x+102,py+234);
  });
  c.textAlign="left";
  /* 曲線 */
  var cy=py+320, ch=260, cx=96, cw=888, ms=R.months, n=ms.length;
  c.fillStyle=INK;c.font="700 30px "+SANS;c.fillText("未來 36 個月動能",cx,cy);
  c.font="400 24px "+SANS;c.fillStyle=MOVE;c.fillRect(cx+300,cy-10,30,4);c.fillStyle=MUTED;c.fillText("轉職",cx+340,cy);
  c.fillStyle=STAY;c.fillRect(cx+420,cy-10,30,4);c.fillStyle=MUTED;c.fillText("升遷",cx+460,cy);
  var top=cy+30;c.strokeStyle=LINE;c.lineWidth=1;[0,50,100].forEach(function(v){var yy=top+ch*(1-v/100);c.beginPath();c.moveTo(cx,yy);c.lineTo(cx+cw,yy);c.stroke()});
  [["move",MOVE],["stay",STAY]].forEach(function(s){c.strokeStyle=s[1];c.lineWidth=5;c.lineJoin="round";c.beginPath();ms.forEach(function(m,i){var xx=cx+cw*i/(n-1),yy=top+ch*(1-m[s[0]]/100);i?c.lineTo(xx,yy):c.moveTo(xx,yy)});c.stroke()});
  c.fillStyle=MUTED;c.font="400 22px "+MONO;c.fillText(ym(ms[0]),cx,top+ch+36);c.textAlign="right";c.fillText(ym(ms[n-1]),cx+cw,top+ch+36);c.textAlign="left";
  /* 窗口 */
  var wy=top+ch+110;
  [["轉職窗口",bestWindows(ms,"move",3),MOVE,"move"],["升遷窗口",bestWindows(ms,"stay",3),STAY,"stay"]].forEach(function(w,i){
    var x=96+i*464;c.fillStyle=w[2];c.beginPath();c.arc(x+10,wy-10,9,0,7);c.fill();
    c.fillStyle=INK;c.font="700 30px "+SANS;c.fillText(w[0],x+30,wy);
    c.font="500 40px "+MONO;w[1].forEach(function(m,j){c.fillText(ym(m),x,wy+64+j*56)});
  });
  /* 標籤 */
  var ty=wy+260, tags=["最適合 "+FIT_NAME[R.fitList[0].k],"人類圖 "+R.H.type+" "+R.H.profile,"官祿宮 "+R.Z.careerStars.join("・"),"日主 "+R.B.dmG+WX[R.B.dm]+(R.B.strong?"・身強":"・身弱")];
  c.font="500 28px "+SANS;var tx=96;
  tags.forEach(function(t){var w=c.measureText(t).width+40;if(tx+w>984){tx=96;ty+=64}c.strokeStyle=GOLD;c.lineWidth=2;c.beginPath();c.roundRect?c.roundRect(tx,ty-38,w,52,26):c.rect(tx,ty-38,w,52);c.stroke();c.fillStyle=GOLD;c.fillText(t,tx+20,ty-2);tx+=w+16});
  c.fillStyle=MUTED;c.font="400 24px "+SANS;c.textAlign="center";
  c.fillText(/^https?:/.test(location.protocol)?location.host+location.pathname.replace(/index\.html$/,""):"職運羅盤",540,1830);
  return cv.toDataURL("image/png");
}
function openCard(){
  var fonts=['900 84px "Noto Serif TC"','400 34px "Noto Sans TC"','700 30px "Noto Sans TC"','500 40px "IBM Plex Mono"'];
  var ready=document.fonts&&document.fonts.load?Promise.all(fonts.map(function(f){return document.fonts.load(f,"職運羅盤0")})).catch(function(){}):Promise.resolve();
  $("cardMsg").textContent="圖卡產生中…";$("cardDlg").showModal();
  ready.then(function(){var url=drawCard();$("cardImg").src=url;$("cardDl").href=url;$("cardMsg").textContent="手機可長按圖片儲存，電腦請按「下載圖片」。"});
}

/* ---------- 綁定 ---------- */
function bindTools(){
  fillToolSelects();
  $("offerForm").addEventListener("submit",function(e){e.preventDefault();compareOffers()});
  $("fitForm").addEventListener("submit",function(e){e.preventDefault();checkCurrent()});
  $("synForm").addEventListener("submit",function(e){e.preventDefault();runSynastry()});
  $("sy-notime").addEventListener("change",function(){$("sy-bt").disabled=this.checked});
  $("btnShare").addEventListener("click",copyShare);
  $("btnCard").addEventListener("click",openCard);
  $("cardClose").addEventListener("click",function(){$("cardDlg").close()});
  var d=new Date(),f=new Date(d.getFullYear(),d.getMonth()+1,1);while(f.getDay()!==1)f.setDate(f.getDate()+1);
  $("oA-date").value=ymd(f);$("oB-date").value=ymd(new Date(f.getFullYear(),f.getMonth(),f.getDate()+14));
}
function afterRun(R){
  CUR=R;todaySel=0;renderToday(R);
  var best=bestWindows(R.months,"move",1)[0];selectMonth(R.months.indexOf(best));
  ["offerOut","fitOut","synOut"].forEach(function(id){$(id).innerHTML=""});
  var qd=$("qmDate");if(qd){if(!qd.value)qd.value=ymd(new Date());renderQimenHours(parseDate(qd.value));qd.addEventListener("change",function(){renderQimenHours(parseDate(qd.value))})}
}
