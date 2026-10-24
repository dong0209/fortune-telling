/* 互動功能：工具箱、月份詳解、奇門擇時、分享連結、IG 圖卡、登入與贊助 */
var STATE={rep:null,input:null,user:null,profile:null};
var METHOD_NAME={linepay:"LINE Pay",jkopay:"街口支付",bank:"銀行轉帳"};
var STATUS_NAME={pending:"待審核",approved:"已開通",rejected:"已退回"};
function loading(id,text){$(id).innerHTML='<p class="loading">'+(text||"推演中…")+'</p>'}
function showError(id,e){
  if(e&&e.need){$(id).innerHTML=lockHTML(e.need,esc(e.message));return}
  $(id).innerHTML='<p class="err">'+esc(e&&e.message||"發生錯誤，請稍後再試")+'</p>';
}

/* ---------- 表單選單 ---------- */
function fillSelects(){
  CITY_NAMES.forEach(function(c,i){var o=document.createElement("option");o.value=i;o.textContent=c;$("city").appendChild(o)});
  document.querySelectorAll(".sel-type").forEach(function(s){s.innerHTML='<option value="">選擇公司類型</option>'+Object.keys(FIT_NAME).map(function(k){return '<option value="'+k+'">'+FIT_NAME[k]+'</option>'}).join("")});
  document.querySelectorAll(".sel-ind").forEach(function(s){s.innerHTML='<option value="">選擇產業</option>'+WX.map(function(w,e){return '<optgroup label="'+w+'">'+IND_BY_EL[e].map(function(n){return '<option>'+n+'</option>'}).join("")+'</optgroup>'}).join("")});
  document.querySelectorAll(".sel-role").forEach(function(s){s.innerHTML='<option value="">選擇職能</option>'+ROLE_NAMES.map(function(r){return '<option>'+r+'</option>'}).join("")});
  document.querySelectorAll(".sel-dir").forEach(function(s){s.innerHTML='<option value="">不確定</option>'+DIRS.map(function(d){return '<option value="'+d[0]+'">'+d[0]+'（'+d[1]+'）</option>'}).join("")});
  var d=new Date(),f=new Date(d.getFullYear(),d.getMonth()+1,1);while(f.getDay()!==1)f.setDate(f.getDate()+1);
  $("oA-date").value=ymd(f);$("oB-date").value=ymd(new Date(f.getFullYear(),f.getMonth(),f.getDate()+14));
}

/* ---------- 月份詳解、奇門擇時 ---------- */
async function selectMonth(i){
  chartSel=i;loading("monthDetail","正在推演這個月…");
  try{var r=await API.analyze("month",STATE.input,{i:i});renderMonthDetail(r.result)}catch(e){showError("monthDetail",e)}
}
async function loadQimenDay(v){
  if(!v)return;loading("qmHours");
  try{var r=await API.analyze("qimenDay",STATE.input,{date:v});renderQimenHours(r.result)}catch(e){showError("qmHours",e)}
}

/* ---------- 工具箱 ---------- */
function jobOf(p){return {name:$(p+"-name").value.trim(),type:$(p+"-type").value,industry:$(p+"-ind").value,role:$(p+"-role").value,dir:$(p+"-dir").value,date:$(p+"-date").value}}
async function compareOffers(){
  loading("offerOut");
  try{
    var r=(await API.analyze("offer",STATE.input,{A:jobOf("oA"),B:jobOf("oB")})).result;
    function cell(v){return v==null?'<td class="muted">—</td>':'<td class="num">'+v+'</td>'}
    $("offerOut").innerHTML='<div class="cmp-verdict">'+(r.winner?'命盤上 <b>'+esc(r.winner)+'</b> 比較適合你':'兩家差距不大，回到薪資、團隊與通勤等現實條件來決定')+'</div>'+
      '<div class="tscroll"><table><thead><tr><th>項目</th><th style="text-align:right">'+esc(r.names[0])+'</th><th style="text-align:right">'+esc(r.names[1])+'</th></tr></thead><tbody>'+
      r.rows.map(function(x){return '<tr><td>'+x.label+'</td>'+cell(x.a)+cell(x.b)+'</tr>'}).join("")+
      '<tr class="total"><td>綜合分數</td><td class="num">'+r.totals[0]+'</td><td class="num">'+r.totals[1]+'</td></tr></tbody></table></div>'+
      listHTML(r.notes)+'<p class="note">分數只反映命盤上的契合度。薪資、職稱、主管與成長空間仍然是最重要的現實條件。</p>';
  }catch(e){showError("offerOut",e)}
}
async function checkCurrent(){
  loading("fitOut");
  try{
    var r=(await API.analyze("fitnow",STATE.input,{type:$("fn-type").value,industry:$("fn-ind").value,role:$("fn-role").value,founded:$("fn-founded").value})).result;
    $("fitOut").innerHTML='<div class="fit-now"><div class="big-score"><b class="num">'+r.total+'</b><span>'+r.level+'</span></div><div style="min-width:0">'+
      r.parts.map(function(p){return meterRow(p.label,p.v,"var(--gold)")}).join("")+'</div></div>'+
      (r.low?'<h3>卡住你的是：'+r.low.label+'</h3><p>'+esc(r.low.text)+'</p>':'<h3>每一項都在水準之上</h3><p>這家公司跟你的命盤相當合拍。</p>')+
      '<h3>建議</h3><p>'+esc(r.tip)+'</p>';
  }catch(e){showError("fitOut",e)}
}
async function runSynastry(){
  loading("synOut");
  try{
    var noTime=$("sy-notime").checked;
    var r=(await API.analyze("synastry",STATE.input,{rel:$("sy-rel").value,name:$("sy-name").value.trim(),date:$("sy-bd").value,time:noTime?"":$("sy-bt").value,noTime:noTime,gender:$("sy-gM").checked?"男":"女"})).result;
    $("synOut").innerHTML='<div class="fit-now"><div class="big-score"><b class="num">'+r.score+'</b><span>合作契合度</span></div><div style="min-width:0">'+
      '<p style="margin:0 0 6px"><b>'+esc(r.name)+'</b>：日主 '+r.otherDm+'，人類圖 '+r.otherType+'。</p><p class="muted small" style="margin:0">'+esc(r.relText)+'</p></div></div>'+
      listHTML(r.notes)+'<h3>跟'+esc(r.name)+'相處的策略</h3>'+listHTML(r.strategy)+
      (r.noTime?'<p class="note">未提供對方出生時間，八字以三柱計算，人類圖以中午 12 點推算。</p>':"");
  }catch(e){showError("synOut",e)}
}
function applyTierUI(tier){
  var paid=tier==="paid"||tier==="vip", vip=tier==="vip";
  $("toolArea").hidden=!paid;$("toolLock").hidden=paid;
  $("toolLock").innerHTML=paid?"":lockHTML("paid",LOCK_DESC.tools);
  $("synForm").hidden=!vip;$("synLock").hidden=vip;
  $("synLock").innerHTML=vip?"":lockHTML("vip",LOCK_DESC.syn);
  ["offerOut","fitOut","synOut"].forEach(function(id){$(id).innerHTML=""});
  document.querySelectorAll(".lk").forEach(function(el){el.hidden=vip});
  var qd=$("qmDate");if(qd){qd.value=ymd(new Date());qd.addEventListener("change",function(){loadQimenDay(qd.value)});loadQimenDay(qd.value)}
}

/* ---------- 分享連結 ---------- */
function shareURL(){
  var p=new URLSearchParams(), inp=STATE.input;
  p.set("b",inp.date);if(!inp.noTime&&inp.time)p.set("t",inp.time.replace(":",""));
  p.set("g",inp.gender==="男"?"M":"F");p.set("c",String(inp.city));p.set("q",inp.q);p.set("y",String(inp.yrs));
  var base=/^https?:/.test(location.protocol)?location.origin+location.pathname:location.href.split(/[?#]/)[0];
  return base+"?"+p.toString();
}
function applyParams(){
  var p=new URLSearchParams(location.search);if(!p.get("b"))return false;
  $("bd").value=p.get("b");
  var t=p.get("t");if(t&&/^\d{4}$/.test(t)){$("bt").value=t.slice(0,2)+":"+t.slice(2);$("noTime").checked=false;$("bt").disabled=false}else{$("noTime").checked=true;$("bt").disabled=true}
  (p.get("g")==="M"?$("gM"):$("gF")).checked=true;
  if(p.get("c")&&CITY_NAMES[+p.get("c")])$("city").value=p.get("c");
  if(p.get("q"))$("q").value=p.get("q");
  if(p.get("y"))$("yrs").value=p.get("y");
  $("sampleNote").hidden=true;return true;
}
function copyShare(){
  var msg=$("shareMsg");if(!STATE.input){msg.textContent="請先推演命盤。";return}
  var url=shareURL();
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
  var rep=STATE.rep, v=rep.verdict, cv=document.createElement("canvas");cv.width=1080;cv.height=1920;
  var c=cv.getContext("2d"), SERIF='"Noto Serif TC","Songti TC",serif', SANS='"Noto Sans TC","PingFang TC",sans-serif', MONO='"IBM Plex Mono",monospace', LAT='"Cinzel",serif', LOGO='"MasaLogo","Noto Serif TC",serif';
  var GOLD="#D9B56A", GB="#F1D58E", INK="#ECE6D6", MUTED="#8F97B5", LINE="#253057", MOVE="#EF7A4A", STAY="#4F96EC";
  var g=c.createRadialGradient(760,120,40,760,120,1300);g.addColorStop(0,"#1B2656");g.addColorStop(0.5,"#0A0F22");g.addColorStop(1,"#05070F");c.fillStyle=g;c.fillRect(0,0,1080,1920);
  var seed=11;function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
  for(var i=0;i<260;i++){c.fillStyle=rnd()<0.15?"rgba(241,213,142,"+(0.3+rnd()*0.6)+")":"rgba(220,226,255,"+(0.2+rnd()*0.6)+")";c.beginPath();c.arc(rnd()*1080,rnd()*1920,rnd()*1.8+0.4,0,6.3);c.fill()}
  c.strokeStyle="rgba(217,181,106,.35)";c.lineWidth=1.5;[300,250,190].forEach(function(r){c.beginPath();c.arc(900,250,r,0,6.3);c.stroke()});
  c.strokeStyle=GOLD;c.lineWidth=2;c.strokeRect(48,48,984,1824);
  c.lineWidth=3;c.strokeRect(96,120,90,90);c.fillStyle=GOLD;c.textAlign="center";c.font="400 36px "+LOGO;c.fillText("職",141,159);c.fillText("運",141,198);
  c.textAlign="left";c.fillStyle=INK;c.font="400 66px "+LOGO;c.fillText("職運羅盤",214,176);
  c.fillStyle=GOLD;c.font="500 24px "+LAT;c.fillText("EAST × WEST · CAREER ORACLE",216,212);
  c.fillStyle=GOLD;c.font="700 28px "+SANS;c.fillText("我 的 天 機 總 斷",96,330);
  var call=v.call.replace(/<[^>]+>/g,"");
  c.fillStyle=GB;c.font="900 82px "+SERIF;var y=wrapText(c,call,96,440,888,102);
  c.fillStyle=MUTED;c.font="400 34px "+SANS;y=wrapText(c,v.sub.split("。")[0]+"。",96,y+10,888,52);
  var py=Math.max(y+40,720), pos=["年柱","月柱","日柱","時柱"];
  v.pillars.forEach(function(p,i){
    var x=96+i*228, unknown=i===3&&v.noTime;
    c.strokeStyle=i===2?GOLD:LINE;c.lineWidth=i===2?4:2;c.strokeRect(x,py,204,256);
    c.textAlign="center";c.fillStyle=MUTED;c.font="400 26px "+SANS;c.fillText(pos[i],x+102,py+44);
    c.fillStyle=i===2?GB:INK;c.font="900 72px "+SERIF;c.fillText(unknown?"？":p[0],x+102,py+122);c.fillText(unknown?"？":p[1],x+102,py+196);
    c.fillStyle=GOLD;c.font="400 24px "+SANS;c.fillText(unknown?"":v.gods[i],x+102,py+234);
  });
  c.textAlign="left";
  var cy=py+330;
  if(rep.months){
    var ch=240, cx=96, cw=888, ms=rep.months, n=ms.length;
    c.fillStyle=INK;c.font="700 30px "+SANS;c.fillText("未來 36 個月動能",cx,cy);
    c.font="400 24px "+SANS;c.fillStyle=MOVE;c.fillRect(cx+300,cy-10,30,4);c.fillStyle=MUTED;c.fillText("轉職",cx+340,cy);
    c.fillStyle=STAY;c.fillRect(cx+420,cy-10,30,4);c.fillStyle=MUTED;c.fillText("升遷",cx+460,cy);
    var top=cy+30;c.strokeStyle=LINE;c.lineWidth=1;[0,50,100].forEach(function(val){var yy=top+ch*(1-val/100);c.beginPath();c.moveTo(cx,yy);c.lineTo(cx+cw,yy);c.stroke()});
    [["move",MOVE],["stay",STAY]].forEach(function(s){c.strokeStyle=s[1];c.lineWidth=5;c.lineJoin="round";c.beginPath();ms.forEach(function(m,i){var xx=cx+cw*i/(n-1),yy=top+ch*(1-m[s[0]]/100);i?c.lineTo(xx,yy):c.moveTo(xx,yy)});c.stroke()});
    var wy=top+ch+90;
    [["轉職窗口",v.windows.move,MOVE,"move"],["升遷窗口",v.windows.stay,STAY,"stay"]].forEach(function(w,i){
      var x=96+i*464;c.fillStyle=w[2];c.beginPath();c.arc(x+10,wy-10,9,0,7);c.fill();
      c.fillStyle=INK;c.font="700 30px "+SANS;c.fillText(w[0],x+30,wy);
      c.font="500 40px "+MONO;w[1].forEach(function(m,j){c.fillText(ym(m),x,wy+62+j*54)});
    });
    var tags=["最適合 "+v.topFit,"日主 "+rep.bazi.dmG+rep.bazi.dmWx+(rep.bazi.strong?"・身強":"・身弱"),"用神 "+rep.bazi.useCat];
    if(rep.hd)tags.push("人類圖 "+rep.hd.type+" "+rep.hd.profile);
    var ty=wy+250, tx=96;c.font="500 28px "+SANS;
    tags.forEach(function(t){var w=c.measureText(t).width+40;if(tx+w>984){tx=96;ty+=64}c.strokeStyle=GOLD;c.lineWidth=2;c.strokeRect(tx,ty-38,w,52);c.fillStyle=GB;c.fillText(t,tx+20,ty-2);tx+=w+16});
  } else {
    c.strokeStyle=GOLD;c.lineWidth=2;c.setLineDash([10,8]);c.strokeRect(96,cy-20,888,300);c.setLineDash([]);
    c.textAlign="center";c.fillStyle=GB;c.font="900 46px "+SERIF;c.fillText("轉職與升遷窗口",540,cy+80);
    c.fillStyle=MUTED;c.font="400 32px "+SANS;c.fillText("未來 36 個月哪幾個月該出手？",540,cy+150);c.fillText("到職運羅盤推演你的命盤",540,cy+200);c.textAlign="left";
  }
  c.fillStyle=MUTED;c.font="400 24px "+SANS;c.textAlign="center";
  c.fillText(/^https?:/.test(location.protocol)?location.host+location.pathname.replace(/index\.html$/,""):"職運羅盤",540,1830);
  return cv.toDataURL("image/png");
}
function openCard(){
  if(!STATE.rep){$("shareMsg").textContent="請先推演命盤。";return}
  var fonts=['400 66px "MasaLogo"','900 82px "Noto Serif TC"','400 34px "Noto Sans TC"','700 30px "Noto Sans TC"','500 40px "IBM Plex Mono"','500 24px "Cinzel"'];
  var ready=document.fonts&&document.fonts.load?Promise.all(fonts.map(function(f){return document.fonts.load(f,"職運羅盤0A")})).catch(function(){}):Promise.resolve();
  $("cardMsg").textContent="圖卡產生中…";$("cardDlg").showModal();
  ready.then(function(){var url=drawCard();$("cardImg").src=url;$("cardDl").href=url;$("cardMsg").textContent="手機可長按圖片儲存，電腦請按「下載圖片」。"});
}

/* ---------- 帳號 ---------- */
function fmtDate(s){var d=new Date(s);return d.getFullYear()+"/"+(d.getMonth()+1)+"/"+d.getDate()}
function renderAccount(){
  var box=$("account");if(!API.ready){box.innerHTML="";return}
  if(!STATE.user){box.innerHTML='<button type="button" class="btn-line" id="btnLogin">登入／註冊</button>';$("btnLogin").addEventListener("click",openLogin);return}
  var p=STATE.profile||{tier:"free"}, tier=p.expired?"free":p.tier;
  box.innerHTML='<span class="tier '+tier+'">'+TIER_NAME[tier]+(tier!=="free"&&p.tier_expires_at?" · 至 "+fmtDate(p.tier_expires_at):"")+'</span>'+
    '<span class="muted small" title="'+esc(STATE.user.email)+'">'+esc((STATE.user.email||"").replace(/@.*/,""))+'</span>'+
    (tier!=="vip"?'<button type="button" class="btn-line" data-upgrade="'+(tier==="paid"?"vip":"paid")+'">贊助支持</button>':'<button type="button" class="btn-line" data-upgrade="vip">再次贊助</button>')+
    (p.is_admin?'<a class="btn-line" href="admin.html" style="text-decoration:none">管理後台</a>':"")+
    '<button type="button" class="btn-text" id="btnLogout">登出</button>';
  $("btnLogout").addEventListener("click",function(){API.signOut()});
}
function openLogin(){$("loginMsg").textContent="";$("loginDlg").showModal();$("loginEmail").focus()}
async function doLogin(e){
  e.preventDefault();var email=$("loginEmail").value.trim(), btn=e.submitter||$("loginForm").querySelector("button");
  btn.disabled=true;$("loginMsg").textContent="寄送中…";
  try{await API.signIn(email);$("loginMsg").textContent="登入連結已寄到 "+email+"，請到信箱點連結完成登入（也請檢查垃圾郵件匣）。"}
  catch(err){$("loginMsg").textContent="寄送失敗："+err.message}
  finally{btn.disabled=false}
}

/* ---------- 贊助與贊助回報 ---------- */
var UP={plan:"paid",method:"jkopay",plans:[]};
function payMethods(){var P=(window.APP_CONFIG||{}).payment||{};return Object.keys(METHOD_NAME).filter(function(m){return P[m]&&P[m].account})}
function payInfoHTML(m){
  var P=(window.APP_CONFIG||{}).payment||{}, x=P[m]||{};
  var dl=m==="bank"?'<dt>銀行</dt><dd>'+esc(x.bank)+'</dd><dt>帳號</dt><dd class="num">'+esc(x.account)+'</dd>'+(x.name?'<dt>戶名</dt><dd>'+esc(x.name)+'</dd>':''):'<dt>帳號</dt><dd>'+esc(x.account)+'</dd>';
  return '<div class="paybox"><dl>'+dl+'</dl>'+(x.qr?'<img src="'+esc(x.qr)+'" alt="'+esc(x.label)+' 贊助 QR code" onerror="this.hidden=true">':"")+'</div>';
}
function refLabel(m){return m==="bank"?"轉出帳號末五碼":m==="linepay"?"LINE Pay 交易編號或付款人名稱":"街口交易序號或轉出帳號末五碼"}
async function openUpgrade(need){
  UP.plan=need==="vip"?"vip":"paid";
  var body=$("upBody");$("upgradeDlg").showModal();
  if(!API.ready){body.innerHTML='<p class="notice">會員系統尚未設定，暫時無法贊助。</p>';return}
  if(!STATE.user){body.innerHTML='<p>測試權限會綁定在你的帳號上，請先登入或註冊（只需要 Email）。</p><button type="button" class="btn-gold" id="upLogin">登入／註冊</button>';
    $("upLogin").addEventListener("click",function(){$("upgradeDlg").close();openLogin()});return}
  body.innerHTML='<p class="loading">載入贊助方案…</p>';
  try{UP.plans=await API.plans();var reqs=await API.myRequests()}catch(e){body.innerHTML='<p class="err">'+esc(e.message)+'</p>';return}
  var p=STATE.profile||{tier:"free"}, isVip=p.tier==="vip"&&!p.expired;
  if(isVip)UP.plan="vip";
  var methods=payMethods();if(methods.indexOf(UP.method)<0)UP.method=methods[0];
  if(!methods.length){body.innerHTML='<p class="notice">尚未設定贊助方式。</p>';return}
  var cfg=window.APP_CONFIG||{};
  body.innerHTML='<p style="margin-top:0">職運羅盤目前在測試階段，你的贊助會用來支持網站開發與維運。贊助後可以提前使用並協助測試對應版本的功能。</p><p class="small muted">目前權限：'+TIER_NAME[p.expired?"free":p.tier]+(p.tier!=="free"&&p.tier_expires_at?"（"+(p.expired?"已於 ":"有效至 ")+fmtDate(p.tier_expires_at)+"）":"")+'</p>'+
    '<div class="plans">'+UP.plans.map(function(x){var dis=isVip&&x.id==="paid";return '<button type="button" class="plan" data-plan="'+x.id+'" aria-pressed="'+(x.id===UP.plan)+'"'+(dis?" disabled":"")+'><b>'+esc(x.name)+'</b><span class="price">贊助 NT$ '+Number(x.price).toLocaleString('en-US')+'</span><p>'+esc(x.description)+'（測試權限 '+x.days+' 天）</p></button>'}).join("")+'</div>'+
    '<div class="field"><span class="lab">贊助方式</span><div class="seg">'+methods.map(function(m){return '<label><input type="radio" name="upm" value="'+m+'"'+(m===UP.method?" checked":"")+'>'+METHOD_NAME[m]+'</label>'}).join("")+'</div></div>'+
    '<div id="payInfo">'+payInfoHTML(UP.method)+'</div>'+
    '<form id="payForm"><p class="small" style="margin-top:0">完成贊助後填寫下面的回報，我們核對後會為你開通測試權限（通常 3～5 個工作天內，超過 5 個工作天仍未開通請來信通知）。</p>'+
      '<div class="field"><label for="payRef" id="payRefLabel">'+refLabel(UP.method)+'</label><input id="payRef" required maxlength="40"></div>'+
      '<div class="row2"><div class="field"><label for="payName">贊助人姓名（選填）</label><input id="payName" maxlength="40"></div><div class="field"><label for="payNote">備註（選填）</label><input id="payNote" maxlength="200"></div></div>'+
      '<label class="check" style="margin:0 0 12px;align-items:flex-start"><input type="checkbox" id="payAgree" required style="margin-top:4px"><span>我了解贊助後開通的是線上數位內容的測試權限，開通後即可使用，依《通訊交易解除權合理例外情事適用準則》不適用七天猶豫期，並同意<a href="privacy.html" target="_blank" rel="noopener">隱私權與贊助條款</a>。</span></label>'+
      '<button class="btn-gold" type="submit">送出贊助回報</button><p class="small" id="payMsg" role="status"></p></form>'+
    (reqs.length?'<div class="req-list"><span class="lab">我的贊助紀錄</span><div class="tscroll"><table><thead><tr><th>日期</th><th>方案</th><th>贊助金額</th><th>狀態</th></tr></thead><tbody>'+
      reqs.map(function(r){return '<tr><td class="num">'+fmtDate(r.created_at)+'</td><td>'+TIER_NAME[r.plan]+'</td><td class="num">'+r.amount+'</td><td><span class="pill '+(r.status==="approved"?"good":r.status==="rejected"?"bad":"mid")+'">'+STATUS_NAME[r.status]+'</span>'+(r.reject_reason?' <span class="muted small">'+esc(r.reject_reason)+'</span>':"")+'</td></tr>'}).join("")+'</tbody></table></div></div>':"")+
    (cfg.contactEmail?'<p class="small muted">贊助或開通問題請寄信至 '+esc(cfg.contactEmail)+'</p>':"");
  body.querySelectorAll(".plan").forEach(function(b){b.addEventListener("click",function(){UP.plan=b.dataset.plan;body.querySelectorAll(".plan").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))})})});
  body.querySelectorAll('input[name="upm"]').forEach(function(r){r.addEventListener("change",function(){UP.method=r.value;$("payInfo").innerHTML=payInfoHTML(r.value);$("payRefLabel").textContent=refLabel(r.value)})});
  $("payForm").addEventListener("submit",async function(e){
    e.preventDefault();var btn=e.submitter;btn.disabled=true;$("payMsg").textContent="送出中…";
    try{await API.submitPayment({plan:UP.plan,method:UP.method,reference:$("payRef").value.trim(),payer_name:$("payName").value.trim(),note:$("payNote").value.trim()});
      $("payMsg").textContent="已送出贊助回報，謝謝你的支持！我們核對後會為你開通。";btn.textContent="已送出"}
    catch(err){$("payMsg").textContent="送出失敗："+err.message;btn.disabled=false}
  });
}

/* ---------- 每日職場一卦（免費版每天一卦，紀錄存在瀏覽器） ---------- */
function divKey(){return "dv-"+ymd(new Date())}
function loadDivine(){try{var v=localStorage.getItem(divKey());return v?JSON.parse(v):null}catch(e){return null}}
async function runDivine(){
  var tier=STATE.rep?STATE.rep.tier:"free", saved=loadDivine();
  if(tier==="free"&&saved){renderDivine(saved,'今天已經起過一卦，這是今天的卦。明天再來，或<button type="button" class="btn-text" data-upgrade="paid" style="color:var(--gold-bright);padding:0">贊助解鎖不限次數</button>。');return}
  loading("dvOut","起卦中…");
  try{var d=(await API.analyze("divine",STATE.input,{question:$("dvQ").value})).result;renderDivine(d);
    try{localStorage.setItem(divKey(),JSON.stringify(d))}catch(e){}}
  catch(e){showError("dvOut",e)}
}

/* ---------- 綜合比對 ---------- */
async function runCompare(){
  loading("cmpOut","各派會診中…");
  try{var r=await API.analyze("compare",STATE.input,{systems:CMP.sel});renderCompare(r.result)}catch(e){showError("cmpOut",e)}
}

/* ---------- 綁定 ---------- */
function bindTools(){
  fillSelects();
  $("offerForm").addEventListener("submit",function(e){e.preventDefault();compareOffers()});
  $("fitForm").addEventListener("submit",function(e){e.preventDefault();checkCurrent()});
  $("synForm").addEventListener("submit",function(e){e.preventDefault();runSynastry()});
  $("sy-notime").addEventListener("change",function(){$("sy-bt").disabled=this.checked});
  $("noTime").addEventListener("change",function(){$("bt").disabled=this.checked;$("solar").disabled=this.checked});
  $("btnShare").addEventListener("click",copyShare);
  $("cmpGo").addEventListener("click",runCompare);
  $("divForm").addEventListener("submit",function(e){e.preventDefault();runDivine()});
  var dv=loadDivine();if(dv){$("dvQ").value=dv.question;renderDivine(dv,"這是你今天起的卦。")}
  $("btnCard").addEventListener("click",openCard);
  $("loginForm").addEventListener("submit",doLogin);
  document.querySelectorAll("dialog [data-close]").forEach(function(b){b.addEventListener("click",function(){b.closest("dialog").close()})});
  document.addEventListener("click",function(e){var b=e.target.closest("[data-upgrade]");if(b)openUpgrade(b.dataset.upgrade)});
  [["#tabs","p-"],["#ttabs","p-"]].forEach(function(t){
    document.querySelectorAll(t[0]+" button").forEach(function(b){b.addEventListener("click",function(){
      document.querySelectorAll(t[0]+" button").forEach(function(x){x.setAttribute("aria-selected",x===b?"true":"false");$(t[1]+x.dataset.p).hidden=x!==b});
    })});
  });
}
