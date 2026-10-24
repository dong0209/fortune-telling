/* 管理後台：核對贊助回報、開通測試權限 */
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function fmt(s){if(!s)return "—";var d=new Date(s);return d.getFullYear()+"/"+(d.getMonth()+1)+"/"+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
var TIER={free:"基礎版",paid:"付費版",vip:"VIP"}, METHOD={linepay:"LINE Pay",jkopay:"街口",bank:"轉帳"}, STATUS={pending:"待審核",approved:"已開通",rejected:"已退回"};
var root=$("adminRoot"), emails={};

async function load(){
  if(!API.ready){root.innerHTML='<section class="panel-box"><p class="notice">尚未設定 Supabase，請先填寫 assets/config.js。</p></section>';return}
  var u=await API.user();
  if(!u){$("account").innerHTML="";root.innerHTML='<section class="panel-box"><p>請以管理員帳號登入。</p><button class="btn-gold" type="button" id="btnLogin">登入</button></section>';$("btnLogin").addEventListener("click",function(){$("loginDlg").showModal()});return}
  var p=await API.profile();
  $("account").innerHTML='<span class="muted small">'+esc(u.email)+'</span><button type="button" class="btn-text" id="btnLogout">登出</button>';
  $("btnLogout").addEventListener("click",function(){API.signOut()});
  if(!p||!p.is_admin){root.innerHTML='<section class="panel-box"><p class="notice">這個帳號沒有管理員權限。請在 Supabase 的 SQL Editor 執行 DEPLOY.md 裡設定管理員的指令。</p></section>';return}
  root.innerHTML='<section class="panel-box"><p class="loading">載入資料…</p></section>';
  var members=await API.admin.members(), pending=await API.admin.requests("pending"), recent=await API.admin.requests(null);
  members.forEach(function(m){emails[m.id]=m.email});
  var now=new Date(), active=function(t){return members.filter(function(m){return m.tier===t&&m.tier_expires_at&&new Date(m.tier_expires_at)>now}).length};
  root.innerHTML=
    '<section class="panel-box"><p class="eyebrow"><span>總覽</span>Overview</p><div class="stat"><div><b>'+pending.length+'</b>待審核</div><div><b>'+active("paid")+'</b>有效付費版</div><div><b>'+active("vip")+'</b>有效 VIP</div><div><b>'+members.length+'</b>註冊會員</div></div></section>'+
    '<section class="panel-box"><p class="eyebrow"><span>待審核</span>Pending</p><h2 style="font-size:20px;margin-bottom:10px">贊助回報</h2>'+
    (pending.length?'<div class="tscroll"><table><thead><tr><th>送出時間</th><th>會員</th><th>方案</th><th>金額</th><th>方式</th><th>末五碼／編號</th><th>贊助人</th><th>備註</th><th>處理</th></tr></thead><tbody>'+
      pending.map(function(r){return '<tr data-id="'+r.id+'"><td class="nowrap num">'+fmt(r.created_at)+'</td><td>'+esc(emails[r.user_id]||r.user_id)+'</td><td class="nowrap">'+TIER[r.plan]+'</td><td class="num">'+r.amount+'</td><td class="nowrap">'+METHOD[r.method]+'</td><td class="num">'+esc(r.reference)+'</td><td>'+esc(r.payer_name||"—")+'</td><td>'+esc(r.note||"—")+'</td>'+
        '<td><div class="actions"><button type="button" class="btn-gold" data-act="approve" style="padding:6px 14px">核准開通</button><input placeholder="退回原因" aria-label="退回原因" maxlength="200"><button type="button" class="btn-line" data-act="reject">退回</button></div><p class="small err" role="alert"></p></td></tr>'}).join("")+'</tbody></table></div>'
      :'<p class="muted">目前沒有待審核的贊助回報。</p>')+'</section>'+
    '<section class="panel-box"><p class="eyebrow"><span>紀錄</span>History</p><h2 style="font-size:20px;margin-bottom:10px">最近的贊助回報</h2><div class="tscroll"><table><thead><tr><th>送出時間</th><th>會員</th><th>方案</th><th>金額</th><th>方式</th><th>末五碼／編號</th><th>狀態</th><th>處理時間</th></tr></thead><tbody>'+
      recent.slice(0,50).map(function(r){return '<tr><td class="nowrap num">'+fmt(r.created_at)+'</td><td>'+esc(emails[r.user_id]||r.user_id)+'</td><td>'+TIER[r.plan]+'</td><td class="num">'+r.amount+'</td><td>'+METHOD[r.method]+'</td><td class="num">'+esc(r.reference)+'</td><td><span class="pill '+(r.status==="approved"?"good":r.status==="rejected"?"bad":"mid")+'">'+STATUS[r.status]+'</span>'+(r.reject_reason?" "+esc(r.reject_reason):"")+'</td><td class="nowrap num">'+fmt(r.reviewed_at)+'</td></tr>'}).join("")+'</tbody></table></div></section>'+
    '<section class="panel-box"><p class="eyebrow"><span>會員</span>Members</p><h2 style="font-size:20px;margin-bottom:10px">會員名單</h2><div class="tscroll"><table><thead><tr><th>Email</th><th>方案</th><th>到期</th><th>註冊時間</th></tr></thead><tbody>'+
      members.map(function(m){var exp=m.tier_expires_at&&new Date(m.tier_expires_at)<=now;return '<tr><td>'+esc(m.email)+(m.is_admin?' <span class="tag gold">管理員</span>':"")+'</td><td>'+TIER[m.tier]+(exp?' <span class="muted small">（已到期）</span>':"")+'</td><td class="num">'+fmt(m.tier_expires_at)+'</td><td class="num">'+fmt(m.created_at)+'</td></tr>'}).join("")+'</tbody></table></div></section>';
  root.querySelectorAll("[data-act]").forEach(function(b){b.addEventListener("click",async function(){
    var tr=b.closest("tr"), id=tr.dataset.id, msg=tr.querySelector(".err"), reason=tr.querySelector("input").value.trim();
    if(b.dataset.act==="reject"&&!reason){msg.textContent="請先填寫退回原因，會員會看到這段文字。";return}
    tr.querySelectorAll("button").forEach(function(x){x.disabled=true});msg.textContent="處理中…";
    try{if(b.dataset.act==="approve")await API.admin.approve(id);else await API.admin.reject(id,reason);load()}
    catch(e){msg.textContent=e.message;tr.querySelectorAll("button").forEach(function(x){x.disabled=false})}
  })});
}
$("loginForm").addEventListener("submit",async function(e){e.preventDefault();$("loginMsg").textContent="寄送中…";try{await API.signIn($("loginEmail").value.trim());$("loginMsg").textContent="登入連結已寄出，請到信箱點連結。"}catch(err){$("loginMsg").textContent=err.message}});
document.querySelectorAll("dialog [data-close]").forEach(function(b){b.addEventListener("click",function(){b.closest("dialog").close()})});
API.onAuth(function(ev){if(ev==="SIGNED_IN"||ev==="SIGNED_OUT")setTimeout(function(){if($("loginDlg").open)$("loginDlg").close();load()},0)});
load().catch(function(e){root.innerHTML='<section class="panel-box"><p class="err">'+esc(e.message)+'</p></section>'});
