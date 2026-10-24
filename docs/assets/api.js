/* 與 Supabase 溝通：登入、會員資料、排盤、付款回報 */
var API=(function(){
  var cfg=window.APP_CONFIG||{}, sb=null;
  var ready=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase&&window.supabase.createClient);
  if(ready)sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  function need(){if(!ready)throw new Error("會員系統尚未設定：請在 docs/assets/config.js 填入 Supabase 網址與金鑰。")}
  function fail(error){if(error)throw new Error(error.message||"連線失敗，請稍後再試")}
  async function session(){if(!ready)return null;var r=await sb.auth.getSession();return r.data.session}
  return {
    ready:ready,
    async analyze(action,input,params){
      need();
      var s=await session(), headers={"Content-Type":"application/json",apikey:cfg.supabaseAnonKey};
      if(s)headers.Authorization="Bearer "+s.access_token;
      var res;
      try{res=await fetch(cfg.supabaseUrl+"/functions/v1/analyze",{method:"POST",headers:headers,body:JSON.stringify({action:action,input:input,params:params||{}})})}
      catch(e){throw new Error("連不上伺服器，請確認網路連線後再試一次。")}
      var j={};try{j=await res.json()}catch(e){}
      if(!res.ok){var err=new Error(j.error||"伺服器暫時無法回應，請稍後再試。");err.need=j.need;err.status=res.status;throw err}
      return j;
    },
    async user(){var s=await session();return s?s.user:null},
    onAuth(cb){if(ready)sb.auth.onAuthStateChange(function(ev,s){cb(ev,s?s.user:null)})},
    async signIn(email){
      need();
      var r=await sb.auth.signInWithOtp({email:email,options:{emailRedirectTo:location.origin+location.pathname}});fail(r.error);
    },
    async signOut(){if(ready)await sb.auth.signOut()},
    async profile(){
      var u=await this.user();if(!u)return null;
      var r=await sb.from("profiles").select("email,tier,tier_expires_at,is_admin").eq("id",u.id).single();fail(r.error);
      var p=r.data;if(p.tier!=="free"&&p.tier_expires_at&&new Date(p.tier_expires_at)<=new Date())p.expired=true;
      return p;
    },
    async plans(){need();var r=await sb.from("plans").select("*").order("sort");fail(r.error);return r.data},
    async submitPayment(o){
      var u=await this.user();if(!u)throw new Error("請先登入");
      var r=await sb.from("payment_requests").insert({user_id:u.id,plan:o.plan,amount:0,method:o.method,reference:o.reference,payer_name:o.payer_name||null,note:o.note||null});fail(r.error);
    },
    async myRequests(){
      var u=await this.user();if(!u)return [];
      var r=await sb.from("payment_requests").select("plan,amount,method,reference,status,reject_reason,created_at").eq("user_id",u.id).order("created_at",{ascending:false}).limit(10);fail(r.error);return r.data;
    },
    admin:{
      async requests(status){var q=sb.from("payment_requests").select("*").order("created_at",{ascending:status==="pending"}).limit(200);if(status)q=q.eq("status",status);var r=await q;fail(r.error);return r.data},
      async members(){var r=await sb.from("profiles").select("id,email,tier,tier_expires_at,is_admin,created_at").order("created_at",{ascending:false}).limit(500);fail(r.error);return r.data},
      async approve(id){var r=await sb.rpc("approve_payment",{request_id:id});fail(r.error)},
      async reject(id,reason){var r=await sb.rpc("reject_payment",{request_id:id,reason:reason});fail(r.error)}
    }
  };
})();
