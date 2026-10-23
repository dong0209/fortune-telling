var FIT_NAME={corp:"大型企業／集團",startup:"新創／成長期公司",foreign:"外商／跨國企業",public:"公部門／國營事業",freelance:"自由接案／個人品牌",sme:"中小企業／家族企業"};
var FIT_DESC={corp:"制度清楚、升遷有階梯，適合穩定累積職級與資源。",startup:"變動快、角色彈性大，能用成果換取速度與股權。",foreign:"跨文化、重專業與績效，有外派與國際視野。",public:"穩定、重程序與公共價值，適合長期耕耘。",freelance:"自己掌握時間與作品，收入與品牌綁在一起。",sme:"老闆近、決策快，人和決定一切，容易成為核心。"};
var IND={0:["教育培訓","出版文創","設計","醫療生技","環保農林"],1:["半導體與電子","網路媒體","能源","餐飲","美業與娛樂"],2:["不動產","營建","顧問管理","保險","物流倉儲"],3:["金融投資","法律","機械製造","汽車","資安"],4:["國際貿易","航運旅遊","行銷傳播","軟體與資訊流通","飲品水產"]};
var CAT_CAREER={官殺:"在組織裡被賦予權責時最有力量",印:"靠專業、學歷與貴人提攜前進",食傷:"靠創意與表達被看見，討厭被框住",財:"對數字與資源敏感，重實質報酬",比劫:"獨立、好勝，適合合夥或自己當家"};
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function ym(x){return x.y+"/"+String(x.m).padStart(2,"0")}

CITIES.forEach(function(c,i){var o=document.createElement("option");o.value=i;o.textContent=c[0];$("city").appendChild(o)});
$("noTime").addEventListener("change",function(){$("bt").disabled=this.checked});

function readInput(){
  var d=$("bd").value.split("-").map(Number), t=($("bt").value||"12:00").split(":").map(Number), c=CITIES[+$("city").value];
  return {y:d[0],m:d[1],d:d[2],hh:t[0],mm:t[1],noTime:$("noTime").checked,gender:$("gM").checked?"男":"女",lat:c[1],lon:c[2],tz:c[3],city:c[0],q:$("q").value,yrs:+$("yrs").value};
}

function bestWindows(ms,key,n){
  var sorted=ms.map(function(x,i){return {i:i,v:x[key]}}).sort(function(a,b){return b.v-a.v}), pick=[];
  for(var j=0;j<sorted.length&&pick.length<n;j++){if(pick.every(function(p){return Math.abs(p.i-sorted[j].i)>2}))pick.push(sorted[j])}
  return pick.sort(function(a,b){return a.i-b.i}).map(function(p){return ms[p.i]});
}

function renderVerdict(R,inp){
  var B=R.B, diff=R.mvAvg-R.stAvg, call, sub;
  if(inp.yrs===-1){call="未來一年，<em>主動出擊</em>找下一份工作";sub="你目前待業，曲線看的是哪幾個月出手命中率最高。"}
  else if(diff>6){call="未來一年偏向<em>轉職</em>";sub="外部機會的動能明顯高於內部升遷，與其等升，不如準備換。"}
  else if(diff<-6){call="未來一年偏向<em>留任升遷</em>";sub="組織內的晉升與授權訊號較強，先把這一階拿到手再談跳槽。"}
  else {call="未來一年<em>邊做邊看</em>";sub="內外動能接近，建議爭取內部轉調或新專案，同時低調接觸外部機會。"}
  if(inp.q==="biz"){sub+=(B.cats.食傷+B.cats.比劫)/B.total>0.38?" 你的八字食傷與比劫有力，接案或創業的體質是有的，先從副業試水溫。":" 你的八字偏重官印，比較適合在組織裡當專家，創業建議先找合夥人互補。"}
  if(inp.yrs===0&&diff>6)sub+=" 你年資未滿一年，若要走，最好等到下方標示的窗口期。";
  var mvW=bestWindows(R.months,"move",3), stW=bestWindows(R.months,"stay",3);
  var pos=["年柱","月柱","日柱","時柱"];
  var pill=B.pillars.map(function(p,i){
    if(i===3&&inp.noTime)return '<div class="pillar"><div class="pos">時柱</div><div class="gz muted">？<br>？</div><div class="god">—</div></div>';
    return '<div class="pillar'+(i===2?" day":"")+'"><div class="pos">'+pos[i]+'</div><div class="gz">'+p[0]+'<br>'+p[1]+'</div><div class="god">'+B.gods[i]+'</div></div>'}).join("");
  var top=R.fitList[0];
  $("verdictBlock").innerHTML=
   '<div class="eyebrow">綜合判讀・'+esc(inp.y+"/"+inp.m+"/"+inp.d)+(inp.noTime?"":" "+$("bt").value)+"・"+esc(inp.city)+"・"+inp.gender+'</div>'+
   '<div class="verdict"><div style="min-width:0">'+
     '<div class="verdict-call">'+call+'</div><p style="margin:0 0 6px">'+sub+'</p>'+
     '<p class="muted small" style="margin:0">日主 <b>'+B.dmG+WX[B.dm]+'</b>，'+(B.strong?"身強":"身弱")+'，喜用 '+B.favEl.map(function(e){return WX[e]}).join("、")+'。紫微官祿宮 '+R.Z.careerStars.join("、")+(R.Z.borrowed?"（借對宮）":"")+'；人類圖 '+R.H.type+' '+R.H.profile+'；'+(R.A.mc!=null?"天頂"+SIGNS[Math.floor(R.A.mc/30)]:"太陽"+SIGNS[Math.floor(R.A.pl.太陽/30)])+'。最適合的環境是<b>'+FIT_NAME[top.k]+'</b>。</p>'+
     '<div class="windows">'+
       '<div class="win"><div class="k"><span class="dot" style="background:var(--s-move)"></span>轉職窗口</div>'+mvW.map(function(x){return '<div><b>'+ym(x)+'</b> <span class="muted small">'+x.move+'</span></div>'}).join("")+'</div>'+
       '<div class="win"><div class="k"><span class="dot" style="background:var(--s-stay)"></span>升遷窗口</div>'+stW.map(function(x){return '<div><b>'+ym(x)+'</b> <span class="muted small">'+x.stay+'</span></div>'}).join("")+'</div>'+
     '</div>'+
   '</div><div style="min-width:0">'+
     '<div class="pillars">'+pill+'</div>'+
     '<div class="meter" style="margin-top:16px"><div class="lab" style="margin-bottom:6px">未來 12 個月平均動能</div>'+
       '<div class="meter-row"><span>轉職</span><div class="bar"><i style="width:'+R.mvAvg.toFixed(0)+'%;background:var(--s-move)"></i></div><span class="num">'+R.mvAvg.toFixed(0)+'</span></div>'+
       '<div class="meter-row"><span>升遷</span><div class="bar"><i style="width:'+R.stAvg.toFixed(0)+'%;background:var(--s-stay)"></i></div><span class="num">'+R.stAvg.toFixed(0)+'</span></div>'+
     '</div>'+
     '<div class="tags" style="margin-top:10px"><span class="tag gold">'+B.useCat+'為用</span><span class="tag">'+CAT_CAREER[B.useCat]+'</span></div>'+
   '</div></div>';
}

var chartData=null;
function renderChart(){
  if(!chartData)return;
  var ms=chartData, box=$("chart"), W=Math.max(300,box.clientWidth), H=W<500?220:260, L=30, Rr=W<500?14:60, T=12, Bt=28;
  var iw=W-L-Rr, ih=H-T-Bt, n=ms.length;
  function x(i){return L+iw*i/(n-1)} function y(v){return T+ih*(1-v/100)}
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="未來 36 個月轉職與升遷動能折線圖">';
  [0,25,50,75,100].forEach(function(v){s+='<line x1="'+L+'" x2="'+(L+iw)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)" stroke-width="1"/><text x="'+(L-6)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">'+v+'</text>'});
  ms.forEach(function(m,i){if((m.m===1&&i>2)||i===0){s+='<line x1="'+x(i)+'" x2="'+x(i)+'" y1="'+T+'" y2="'+(T+ih)+'" stroke="var(--line)" stroke-dasharray="2 3"/><text x="'+x(i)+'" y="'+(H-8)+'" font-size="11" fill="var(--muted)" font-family="var(--f-mono)" text-anchor="'+(i===0?"start":"middle")+'">'+(i===0?ym(m):m.y)+'</text>'}});
  function path(key){return ms.map(function(m,i){return (i?"L":"M")+x(i).toFixed(1)+" "+y(m[key]).toFixed(1)}).join("")}
  function area(key){return path(key)+"L"+x(n-1)+" "+(T+ih)+"L"+x(0)+" "+(T+ih)+"Z"}
  s+='<path d="'+area("move")+'" fill="var(--s-move)" fill-opacity=".07"/><path d="'+area("stay")+'" fill="var(--s-stay)" fill-opacity=".07"/>';
  s+='<path d="'+path("stay")+'" fill="none" stroke="var(--s-stay)" stroke-width="2" stroke-linejoin="round"/>';
  s+='<path d="'+path("move")+'" fill="none" stroke="var(--s-move)" stroke-width="2" stroke-linejoin="round"/>';
  if(W>=500){var lm=ms[n-1];var ya=y(lm.move),yb=y(lm.stay);if(Math.abs(ya-yb)<14){if(ya<yb){ya-=7;yb+=7}else{ya+=7;yb-=7}}
    s+='<text x="'+(x(n-1)+8)+'" y="'+(ya+4)+'" font-size="12" fill="var(--ink)">轉職</text><text x="'+(x(n-1)+8)+'" y="'+(yb+4)+'" font-size="12" fill="var(--ink)">升遷</text>'}
  s+='<line id="xh" x1="0" x2="0" y1="'+T+'" y2="'+(T+ih)+'" stroke="var(--muted)" stroke-width="1" visibility="hidden"/>';
  s+='<circle id="cm" r="4.5" fill="var(--s-move)" stroke="var(--surface)" stroke-width="2" visibility="hidden"/><circle id="cs" r="4.5" fill="var(--s-stay)" stroke="var(--surface)" stroke-width="2" visibility="hidden"/>';
  s+='<line id="selLine" data-x0="'+x(0)+'" data-step="'+(iw/(n-1))+'" x1="0" x2="0" y1="'+T+'" y2="'+(T+ih)+'" stroke="var(--gold)" stroke-width="2" visibility="hidden"/>';
  s+='<rect x="'+L+'" y="0" width="'+iw+'" height="'+H+'" fill="transparent" id="hit" style="cursor:pointer"/></svg><div class="tip" id="tip" hidden></div>';
  box.innerHTML=s;
  var svg=box.querySelector("svg"), tip=$("tip");
  if(chartSel!=null){var sl=$("selLine");sl.setAttribute("x1",x(chartSel));sl.setAttribute("x2",x(chartSel));sl.setAttribute("visibility","visible")}
  function idx(ev){var r=svg.getBoundingClientRect();return clamp(Math.round(((ev.clientX-r.left)*W/r.width-L)/iw*(n-1)),0,n-1)}
  $("hit").addEventListener("click",function(ev){selectMonth(idx(ev))});
  function show(ev){
    var r=svg.getBoundingClientRect(), i=idx(ev), m=ms[i];
    var xh=$("xh");xh.setAttribute("x1",x(i));xh.setAttribute("x2",x(i));xh.setAttribute("visibility","visible");
    [["cm","move"],["cs","stay"]].forEach(function(c){var el=$(c[0]);el.setAttribute("cx",x(i));el.setAttribute("cy",y(m[c[1]]));el.setAttribute("visibility","visible")});
    tip.innerHTML='<h4>'+ym(m)+'　'+m.mgz+'月</h4><div><span class="dot" style="background:var(--s-move)"></span> 轉職 <b class="num">'+m.move+'</b>　<span class="dot" style="background:var(--s-stay)"></span> 升遷 <b class="num">'+m.stay+'</b></div>'+(m.notes.length?'<ul>'+m.notes.slice(0,3).map(function(t){return "<li>"+esc(t)+"</li>"}).join("")+'</ul>':"")+'<div class="muted" style="margin-top:4px">點一下看本月詳解</div>';
    tip.hidden=false;var tx=x(i)*r.width/W;tip.style.left=clamp(tx+12,0,r.width-tip.offsetWidth)+"px";if(tx+12+tip.offsetWidth>r.width)tip.style.left=Math.max(0,tx-12-tip.offsetWidth)+"px";tip.style.top="10px";
  }
  $("hit").addEventListener("pointermove",show);$("hit").addEventListener("pointerdown",show);
  $("hit").addEventListener("pointerleave",function(){tip.hidden=true;["xh","cm","cs"].forEach(function(id){$(id).setAttribute("visibility","hidden")})});
}
var rzT;window.addEventListener("resize",function(){clearTimeout(rzT);rzT=setTimeout(renderChart,120)});

function renderTable(ms){
  $("chartTable").innerHTML='<table><thead><tr><th>月份</th><th>流年</th><th>流月</th><th style="text-align:right">轉職</th><th style="text-align:right">升遷</th><th>主要訊號</th></tr></thead><tbody>'+
   ms.map(function(m){return '<tr><td class="num" style="text-align:left">'+ym(m)+'</td><td>'+m.ygz+'</td><td>'+m.mgz+'</td><td class="num">'+m.move+'</td><td class="num">'+m.stay+'</td><td style="white-space:normal;min-width:220px">'+esc(m.notes.slice(0,2).join("；")||"—")+'</td></tr>'}).join("")+'</tbody></table>';
}

function renderFit(R){
  $("fit").innerHTML=R.fitList.map(function(f,i){
    return '<div class="fit-item'+(i===0?" top":"")+'"><div class="fit-head"><h3>'+FIT_NAME[f.k]+'</h3>'+(i===0?'<span class="badge">最適合</span>':'<span class="num muted small">'+f.v+'</span>')+'</div>'+
      '<div class="bar"><i style="width:'+f.v+'%"></i></div><p>'+FIT_DESC[f.k]+'</p>'+(f.why.length?'<p>依據：'+f.why.slice(0,3).map(esc).join("、")+'</p>':"")+'</div>'}).join("");
  var B=R.B, els=[B.useEl].concat(B.favEl.filter(function(e){return e!==B.useEl}));
  $("industries").innerHTML=els.map(function(e,i){return IND[e].slice(0,i?3:5).map(function(t){return '<span class="tag'+(i?"":" gold")+'">'+WX[e]+"・"+t+'</span>'}).join("")}).join("");
}

function renderBazi(R,inp){
  var B=R.B, nowY=new Date().getFullYear();
  var catRows=["官殺","印","比劫","食傷","財"].map(function(c){var v=B.cats[c]/B.total*100;return '<div class="meter-row"><span>'+c+'</span><div class="bar"><i style="width:'+v.toFixed(0)+'%;background:var(--accent)"></i></div><span class="num">'+v.toFixed(0)+'%</span></div>'}).join("");
  var yrs=Object.keys(R.by).map(function(k){var e=R.by[k];return '<tr><td>'+k+'</td><td>'+tenGod(B.dmG,k[0])+'</td><td><span class="pill '+(e.fav>0?"good":e.fav<-0.5?"bad":"mid")+'">'+(e.fav>0?"喜":e.fav<-0.5?"忌":"平")+'</span></td><td style="white-space:normal">'+esc(e.notes.join("；")||"平穩之年")+'</td></tr>'}).join("");
  $("p-bazi").innerHTML=
   '<div class="split"><div style="min-width:0"><h3>日主與格局</h3><p>日主 <b>'+B.dmG+'（'+WX[B.dm]+'）</b>，同類與生扶力量約佔 '+(B.support*100).toFixed(0)+'%，判為<b>'+(B.strong?"身強":"身弱")+'</b>。'+(B.strong?"能量足、扛得住壓力，需要舞台與輸出口，職涯上要找能讓你發揮、承擔責任的位置。":"需要資源與團隊支撐，職涯上先找好平台與貴人，再求表現。")+'</p>'+
   '<p>以<b>'+B.useCat+'</b>為用神（'+WX[B.useEl]+'）：'+CAT_CAREER[B.useCat]+'。'+(B.hasYima?"命帶驛馬，換城市、外派、跨國工作對你是加分。":"")+'</p>'+
   '<h3>十神職場能量分布</h3>'+catRows+'<p class="muted small">官殺＝組織與權責；印＝學習與靠山；比劫＝自主與競爭；食傷＝創意與表達；財＝資源與業績。</p></div>'+
   '<div><h3>五行</h3>'+WX.map(function(w,i){var t=B.elem.reduce(function(a,b){return a+b},0)+1;var v=(i===B.dm?(B.elem[i]+1):B.elem[i])/t*100;return '<div class="meter-row"><span>'+w+(B.favEl.indexOf(i)>=0?" ・喜":"")+'</span><div class="bar"><i style="width:'+v.toFixed(0)+'%;background:var(--gold)"></i></div><span class="num">'+v.toFixed(0)+'%</span></div>'}).join("")+'</div></div>'+
   '<h3>大運（十年一運）</h3><div class="yun">'+B.dayun.map(function(d){return '<div class="'+(nowY>=d.startYear&&nowY<=d.endYear?"now":"")+'"><b>'+d.gz+'</b>'+d.startAge+'–'+d.endAge+'歲<br>'+d.startYear+'<br><span style="color:var(--gold)">'+d.god+'</span></div>'}).join("")+'</div>'+
   (function(){var c=B.dayun.filter(function(d){return nowY>=d.startYear&&nowY<=d.endYear})[0];if(!c)return"";var good=B.fav.indexOf(c.cat)>=0;return '<p style="margin-top:10px">目前走 <b>'+c.gz+'</b> 運（'+c.startYear+'–'+c.endYear+'），天干為'+c.god+'，屬'+(good?"喜用":"忌神")+'運。'+(good?"這十年的大方向對事業有利，適合積極布局。":"這十年做事較費力，重大轉換要挑流年好的時機。")+'</p>'})()+
   '<h3>流年重點</h3><div class="tscroll"><table><thead><tr><th>流年</th><th>十神</th><th>喜忌</th><th>職場訊號</th></tr></thead><tbody>'+yrs+'</tbody></table></div>';
}

function renderZiwei(R){
  var Z=R.Z, pal=Z.pal, yearNow=new Date().getFullYear(), zy=R.zy[Object.keys(R.zy)[0]];
  /* 盤面依地支擺放：巳午未申 在上，亥子丑寅 在下 */
  var layout={巳:[1,1],午:[1,2],未:[1,3],申:[1,4],辰:[2,1],酉:[2,4],卯:[3,1],戌:[3,4],寅:[4,1],丑:[4,2],子:[4,3],亥:[4,4]};
  var cells=pal.map(function(p,i){var g=layout[p.earthlyBranch];
    var stars=p.majorStars.map(function(s){return esc(s.name)+(s.mutagen?'<span class="mu '+s.mutagen+'">'+s.mutagen+'</span>':"")}).join(" ")||'<span class="muted" style="font-size:12px">空宮</span>';
    var hl=(i===Z.career||i===Z.soul||i===Z.travel)?" hl":"";
    return '<div class="pal'+hl+'" style="grid-row:'+g[0]+';grid-column:'+g[1]+'"><div class="pn"><span>'+p.name+'</span><span>'+p.heavenlyStem+p.earthlyBranch+'</span></div><div class="st">'+stars+'</div><div class="muted" style="font-size:11px">'+p.decadal.range.join("–")+'歲</div></div>'}).join("");
  var a=Z.a;
  cells+='<div class="pal center"><b style="font-family:var(--f-display);font-size:16px">'+a.fiveElementsClass+'</b><span class="muted">命主 '+a.soul+'・身主 '+a.body+'</span><span class="muted">'+a.lunarDate+'</span></div>';
  var careerTxt=Z.careerStars.map(function(s){return ZW_STAR[s]?'<p><b>'+s+'</b>：'+ZW_STAR[s].t+'</p>':""}).join("");
  var yrs=Object.keys(R.zy).map(function(y){var e=R.zy[y];return '<tr><td>'+y+'（'+e.gz+'）</td><td style="white-space:normal">'+esc(e.notes.join("；")||"官祿宮無四化引動，維持現狀")+'</td></tr>'}).join("");
  var soulStars=pal[Z.soul].majorStars.map(function(s){return s.name});
  $("p-ziwei").innerHTML='<div class="split" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><div style="min-width:0"><h3>官祿宮：你的工作樣貌</h3>'+(Z.borrowed?'<p class="muted small">官祿宮無主星，借對宮（夫妻宮）主星來看。</p>':"")+careerTxt+
   '<h3>命宮</h3><p>命宮'+(soulStars.length?"主星 "+soulStars.join("、")+"。"+(ZW_STAR[soulStars[0]]?ZW_STAR[soulStars[0]].t:""):"為空宮，個性受對宮遷移宮影響大，適應力強、容易隨環境調整。")+'</p>'+
   '<h3>流年四化與事業</h3><div class="tscroll"><table><thead><tr><th>年份</th><th>四化對官祿、遷移的影響</th></tr></thead><tbody>'+yrs+'</tbody></table></div></div>'+
   '<div style="min-width:0"><h3>命盤</h3><div class="palaces">'+cells+'</div><p class="muted small" style="margin-top:6px">藍底為命宮、官祿、遷移三宮。</p></div></div>';
}

function renderQimen(R){
  var now=new Date(), q=qimen(now.getFullYear(),now.getMonth()+1,now.getDate(),10);
  var grid=[4,9,2,3,5,7,8,1,6].map(function(p){
    if(p===5)return '<div><span class="muted">中五</span><b>'+q.ju+'局</b>'+(q.yang?"陽遁":"陰遁")+'</div>';
    return '<div class="'+(q.doors[p]==="開"?"open":"")+'"><span class="muted">'+DIR[p]+'</span><b>'+q.doors[p]+'門</b>'+(p===q.zhiShiAt?"值使":"")+'</div>'}).join("");
  var days=R.qdays.filter(function(d){return DOOR_Q[d.door]>=0.5}).sort(function(a,b){return b.score-a.score}).slice(0,8).sort(function(a,b){return a.date-b.date});
  var wk="日一二三四五六";
  $("p-qimen").innerHTML='<div class="split" style="grid-template-columns:minmax(0,1fr) 330px"><div style="min-width:0"><h3>開門：事業之門</h3><p>奇門遁甲以八門判斷行事吉凶，<b>開門</b>主事業、開創與求職，<b>休門</b>主貴人與休養，<b>生門</b>主財利。面試、談薪、遞辭呈時，挑值使落在開、休、生三吉門的時辰，並朝開門所在方位出發或就座。</p>'+
   '<p>今天（'+q.dgz+'日）巳時 9–11 點：'+q.term.replace("惊蛰","驚蟄").replace("谷雨","穀雨").replace("小满","小滿").replace("芒种","芒種").replace("处暑","處暑")+q.yuan+'元，'+(q.yang?"陽":"陰")+'遁'+q.ju+'局，值使<b>'+q.zhiShi+'門</b>，開門在<b>'+q.openDir+'方</b>。</p></div>'+
   '<div><h3>今日巳時八門</h3><div class="qm">'+grid+'</div></div></div>'+
   '<h3>未來 60 天職場吉日（巳時）</h3><div class="tscroll"><table class="daylist"><thead><tr><th>日期</th><th>日干支</th><th>巳時值使</th><th>開門方位</th><th>適合</th><th>黃曆宜</th></tr></thead><tbody>'+
   days.map(function(d){var g=DOOR_Q[d.door]>=2?"good":DOOR_Q[d.door]>0?"mid":"bad";return '<tr><td>'+(d.date.getMonth()+1)+'/'+d.date.getDate()+'（'+wk[d.date.getDay()]+'）</td><td>'+d.q.dgz+'</td><td><span class="pill '+g+'">'+d.door+'門</span></td><td>'+d.q.openDir+'</td><td>'+d.act+'</td><td style="white-space:normal">'+(d.hits.join("、")||"—")+'</td></tr>'}).join("")+'</tbody></table></div>'+
   '<h3>指定日期擇時</h3><p>已經約好面試或談判？選日期看當天 12 個時辰的值使門與開門方位。</p><div class="field" style="max-width:220px"><label for="qmDate">日期</label><input type="date" id="qmDate"></div><div id="qmHours"></div>'+
   '<p class="note">已排除與你日支相沖的日子與週末。奇門在此採時家轉盤拆補法，只排地盤三奇六儀與八門，不含九星、八神與天盤格局。</p>';
}

function hdSvg(H){
  var C={頭頂:[100,22,"tri"],邏輯:[100,68,"tri-d"],喉嚨:[100,118,"sq"],G中心:[100,178,"dia"],意志力:[146,198,"tri"],薦骨:[100,258,"sq"],直覺:[36,236,"tri"],情緒:[164,236,"tri"],根部:[100,312,"sq"]};
  var s='<svg viewBox="0 0 200 340" role="img" aria-label="人類圖九大中心">', seen={};
  H.chans.forEach(function(c){var a=gateCenter(c[0]),b=gateCenter(c[1]),k=[a,b].sort().join();if(seen[k])return;seen[k]=1;s+='<line x1="'+C[a][0]+'" y1="'+C[a][1]+'" x2="'+C[b][0]+'" y2="'+C[b][1]+'" stroke="var(--gold)" stroke-width="3"/>'});
  for(var n in C){var c=C[n],x=c[0],y=c[1],f=H.defined[n]?"var(--accent)":"var(--surface)",st='stroke="var(--muted)" stroke-width="1.2" fill="'+f+'"',d;
    if(c[2]==="sq")d='<rect x="'+(x-18)+'" y="'+(y-18)+'" width="36" height="36" rx="3" '+st+'/>';
    else if(c[2]==="dia")d='<polygon points="'+x+','+(y-22)+' '+(x+22)+','+y+' '+x+','+(y+22)+' '+(x-22)+','+y+'" '+st+'/>';
    else if(c[2]==="tri-d")d='<polygon points="'+(x-20)+','+(y-16)+' '+(x+20)+','+(y-16)+' '+x+','+(y+18)+'" '+st+'/>';
    else d='<polygon points="'+x+','+(y-18)+' '+(x+19)+','+(y+15)+' '+(x-19)+','+(y+15)+'" '+st+'/>';
    s+=d;}
  return s+'</svg>';
}
function renderHD(R){
  var H=R.H, T=HD_TYPE[H.type], pl=H.profile.split("/");
  var chs=H.chans.map(function(c){return '<span class="tag">'+c[0]+"–"+c[1]+'</span>'}).join("")||'<span class="muted">無定義通道</span>';
  $("p-hd").innerHTML='<div class="split"><div style="min-width:0"><div class="kv"><div><span class="lab">類型</span><b>'+H.type+'</b></div><div><span class="lab">策略</span><b>'+T.strat+'</b></div><div><span class="lab">內在權威</span><b>'+H.auth+'</b></div><div><span class="lab">人生角色</span><b>'+H.profile+'</b></div></div>'+
   '<h3>你在職場的運作方式</h3><p>'+T.t+'</p><p>人生角色 '+H.profile+'（'+PROFILE_NAME[pl[0]]+'／'+PROFILE_NAME[pl[1]]+'）：'+({1:"你需要把事情研究透才有安全感，面試前做足功課是你的優勢。",2:"你有天賦但不愛自我推銷，好機會常是別人看見後來找你。",3:"你靠試錯學習，換過幾份工作不是失敗，而是在找對的位置。",4:"你的機會幾乎都來自人脈，轉職先從熟人網絡打聽。",5:"別人會把你投射成救火隊，適合接手爛攤子、轉型專案。",6:"前半生多嘗試，約 50 歲後成為領域典範，職涯越走越穩。"})[pl[0]]+'</p>'+
   '<h3>轉職的身體訊號</h3><p>當<b>'+T.sig+'</b>持續出現，代表你在錯的位置。決策依循「'+H.auth+'」：'+({情緒中心:"情緒有起伏，不要在高峰或低谷時提離職，至少睡過幾晚、心情平穩時再決定。",薦骨中心:"相信當下身體的「嗯／嗯哼」反應，讓朋友用是非題問你：「你想去這家公司嗎？」",直覺中心:"第一直覺最準，直覺只說一次，事後的猶豫多半是頭腦的恐懼。",意志力中心:"問自己「我真的想要嗎？」，只承諾你願意全力投入的工作。",自我投射:"把選項說出來給信任的人聽，從自己的聲音裡聽出方向。","環境（心智投射）":"換到不同環境、跟不同的人討論，聽自己怎麼說，而不是在腦中反覆推演。",月亮週期:"給自己約 28 天，與不同的人談過再定案。"})[H.auth]+'</p>'+
   '<h3>定義通道</h3><div class="tags">'+chs+'</div></div><div class="hd"><h3>九大中心</h3>'+hdSvg(H)+'<p class="muted small" style="text-align:center;margin-top:6px">藍色為有定義中心</p></div></div>'+
   '<p class="note">人類圖由出生時刻（個性）與太陽回推 88° 的設計時刻（設計）共 26 個啟動點計算，月交點採平均交點。'+(R.inp.noTime?"未提供出生時間，月亮閘門可能不準，類型通常不受影響。":"")+'</p>';
}

function renderAstro(R){
  var A=R.A, rows=BODIES.map(function(b){var l=A.pl[b[0]];return '<tr><td>'+b[0]+'</td><td>'+SIGNS[Math.floor(l/30)]+' '+(l%30).toFixed(1)+'°</td><td>'+(A.hasTime?"第 "+A.house(l)+" 宮":"—")+'</td></tr>'}).join("");
  var in10=A.hasTime?BODIES.filter(function(b){return A.house(A.pl[b[0]])===10}).map(function(b){return b[0]}):[];
  var sa=A.pl.土星, mcS=A.mc!=null?SIGNS[Math.floor(A.mc/30)]:null;
  var now=new Date(), ju=lonOf("Jupiter",now);
  $("p-astro").innerHTML='<div class="split" style="grid-template-columns:minmax(0,1fr) minmax(0,260px)"><div style="min-width:0">'+
   (mcS?'<h3>天頂（MC）：社會角色</h3><p>'+MC_TEXT[mcS]+'</p>':'<h3>太陽星座</h3><p>未提供出生時間，無法計算上升與天頂，以下以太陽星座作為第一宮（太陽宮位制）推算行運。</p>')+
   (A.hasTime?'<h3>第十宮（事業宮）</h3><p>'+(in10.length?in10.map(function(p){return '<b>'+p+'</b>：'+PL_10[p]}).join("；")+"。":"第十宮無行星，事業風格主要由天頂星座與其守護星決定。")+'</p>':"")+
   '<h3>土星：職涯功課</h3><p>土星在<b>'+SIGNS[Math.floor(sa/30)]+'</b>'+(A.hasTime?"第 "+A.house(sa)+" 宮":"")+'，代表你需要時間累積、但最後會成為專長的領域。每 29.5 年一次的土星回歸（約 29 歲、58 歲）是職涯重新定位的大關卡。</p>'+
   '<h3>現在的木星</h3><p>木星目前在'+SIGNS[Math.floor(ju/30)]+'，行經你的第 '+A.house(ju)+' 宮。'+(({10:"正是事業宮，今年是爭取升遷、曝光的好年。",6:"在工作宮，適合換到更好的團隊或職務。",2:"在財帛宮，談薪、加薪有利。",9:"在第九宮，外派、進修、國際機會增加。",1:"在第一宮，新開始與個人品牌擴張。"})[A.house(ju)]||"事業宮位暫無木星加持，曲線中的其他訊號更值得參考。")+'</p></div>'+
   '<div style="min-width:0"><h3>行星位置</h3><div class="tscroll"><table><thead><tr><th>行星</th><th>星座</th><th>宮位</th></tr></thead><tbody>'+rows+
   (A.hasTime?'<tr><td>上升</td><td>'+SIGNS[Math.floor(A.asc/30)]+' '+(A.asc%30).toFixed(1)+'°</td><td>—</td></tr><tr><td>天頂</td><td>'+mcS+' '+(A.mc%30).toFixed(1)+'°</td><td>—</td></tr>':"")+'</tbody></table></div><p class="muted small">整宮制，熱帶黃道。</p></div></div>';
}

function run(){
  $("err").hidden=true;
  var inp=readInput();
  if(!inp.y||inp.y<1920||inp.y>2025){$("err").textContent="請輸入 1920 到 2025 年之間的出生日期。";$("err").hidden=false;return}
  if(typeof Solar==="undefined"||typeof iztro==="undefined"||typeof Astronomy==="undefined"){$("err").textContent="排盤程式庫尚未載入，請確認網路連線後重新整理頁面。";$("err").hidden=false;return}
  try{
    var R=compute(inp,new Date());R.inp=inp;CUR=R;chartSel=null;
    renderVerdict(R,inp);chartData=R.months;renderChart();renderTable(R.months);renderFit(R);
    renderBazi(R,inp);renderZiwei(R);renderQimen(R);renderHD(R);renderAstro(R);afterRun(R);
  }catch(e){$("err").textContent="排盤時發生錯誤："+e.message;$("err").hidden=false;console.error(e)}
}
$("f").addEventListener("submit",function(e){e.preventDefault();$("sampleNote").hidden=true;run();if(window.innerWidth<880)$("verdictBlock").scrollIntoView({behavior:"smooth"})});
document.querySelectorAll("#ttabs button").forEach(function(b){b.addEventListener("click",function(){
  document.querySelectorAll("#ttabs button").forEach(function(x){x.setAttribute("aria-selected",x===b?"true":"false");$("p-"+x.dataset.p).hidden=x!==b});
})});
document.querySelectorAll("#tabs button").forEach(function(b){b.addEventListener("click",function(){
  document.querySelectorAll("#tabs button").forEach(function(x){x.setAttribute("aria-selected",x===b?"true":"false");$("p-"+x.dataset.p).hidden=x!==b});
  try{localStorage.setItem("ccTab",b.dataset.p)}catch(e){}
})});
try{var st=localStorage.getItem("ccTab");if(st&&$("t-"+st))$("t-"+st).click()}catch(e){}
bindTools();
applyParams();
run();
