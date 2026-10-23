/* ============ 共用 ============ */
var CITIES=[
  ["台北",25.03,121.56,8],["新北",25.01,121.46,8],["桃園",24.99,121.30,8],["新竹",24.80,120.97,8],["台中",24.15,120.67,8],
  ["彰化",24.08,120.54,8],["嘉義",23.48,120.45,8],["台南",22.99,120.21,8],["高雄",22.63,120.30,8],["屏東",22.67,120.49,8],
  ["宜蘭",24.75,121.75,8],["花蓮",23.99,121.60,8],["台東",22.76,121.14,8],["澎湖",23.57,119.58,8],["金門",24.43,118.32,8],
  ["香港",22.32,114.17,8],["澳門",22.20,113.55,8],["上海",31.23,121.47,8],["北京",39.90,116.40,8],["新加坡",1.35,103.82,8],
  ["吉隆坡",3.14,101.69,8],["東京",35.68,139.69,9],["首爾",37.57,126.98,9],["雪梨",-33.87,151.21,10],["倫敦",51.51,-0.13,0],
  ["紐約",40.71,-74.01,-5],["洛杉磯",34.05,-118.24,-8],["溫哥華",49.28,-123.12,-8]];
var GAN="甲乙丙丁戊己庚辛壬癸", ZHI="子丑寅卯辰巳午未申酉戌亥";
var WX=["木","火","土","金","水"];
var GAN_WX={甲:0,乙:0,丙:1,丁:1,戊:2,己:2,庚:3,辛:3,壬:4,癸:4};
var ZHI_WX={子:4,丑:2,寅:0,卯:0,辰:2,巳:1,午:1,未:2,申:3,酉:3,戌:2,亥:4};
var HIDE={子:"癸",丑:"己癸辛",寅:"甲丙戊",卯:"乙",辰:"戊乙癸",巳:"丙戊庚",午:"丁己",未:"己丁乙",申:"庚壬戊",酉:"辛",戌:"戊辛丁",亥:"壬甲"};
var HW=[0.6,0.3,0.1];
var YIMA={申:"寅",子:"寅",辰:"寅",寅:"申",午:"申",戌:"申",巳:"亥",酉:"亥",丑:"亥",亥:"巳",卯:"巳",未:"巳"};
var LIUHE={子:"丑",丑:"子",寅:"亥",亥:"寅",卯:"戌",戌:"卯",辰:"酉",酉:"辰",巳:"申",申:"巳",午:"未",未:"午"};
function chong(a,b){return Math.abs(ZHI.indexOf(a)-ZHI.indexOf(b))===6}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function norm360(x){return ((x%360)+360)%360}
function norm180(x){x=norm360(x);return x>180?x-360:x}

/* 五類十神：以日主五行為我 */
function rel(dm,el){var d=(el-dm+5)%5;return ["比劫","食傷","財","官殺","印"][d]}
function tenGod(dmGan,g){
  var r=rel(GAN_WX[dmGan],GAN_WX[g]);var same=(GAN.indexOf(dmGan)%2)===(GAN.indexOf(g)%2);
  return {比劫:same?"比肩":"劫財",食傷:same?"食神":"傷官",財:same?"偏財":"正財",官殺:same?"七殺":"正官",印:same?"偏印":"正印"}[r];
}
function elemOfCat(dm,cat){return (dm+["比劫","食傷","財","官殺","印"].indexOf(cat))%5}

/* ============ 八字 ============ */
function calcBazi(inp){
  var s=Solar.fromYmdHms(inp.y,inp.m,inp.d,inp.noTime?12:inp.hh,inp.noTime?0:inp.mm,0);
  var ec=s.getLunar().getEightChar();
  var p=[ec.getYear(),ec.getMonth(),ec.getDay(),ec.getTime()];
  var dmG=p[2][0], dm=GAN_WX[dmG];
  var cats={比劫:0,食傷:0,財:0,官殺:0,印:0}, elem=[0,0,0,0,0];
  function addG(g,w){cats[rel(dm,GAN_WX[g])]+=w;elem[GAN_WX[g]]+=w}
  var used=inp.noTime?3:4;
  for(var i=0;i<used;i++){
    if(i!==2) addG(p[i][0],1);
    var w=i===1?2.5:(i===2?1.5:1), hs=HIDE[p[i][1]];
    var tot=0;for(var k=0;k<hs.length;k++)tot+=HW[k];
    for(var k2=0;k2<hs.length;k2++) addG(hs[k2],w*HW[k2]/tot);
  }
  var total=0;for(var c in cats)total+=cats[c];
  var support=(cats.比劫+cats.印)/total;
  var strong=support>=0.42;
  var fav=strong?["食傷","財","官殺"]:["印","比劫"];
  var favEl=fav.map(function(c){return elemOfCat(dm,c)});
  var useCat;
  if(strong){var arr=["食傷","財","官殺"].sort(function(a,b){return cats[a]-cats[b]});useCat=cats.比劫>cats.印?"官殺":"財";if(cats[useCat]>total*0.3)useCat=arr[0]}
  else useCat=cats.官殺+cats.財>cats.食傷?"印":"比劫";
  var yun=ec.getYun(inp.gender==="男"?1:0), dys=yun.getDaYun().slice(1,9).map(function(d){
    var gz=d.getGanZhi();return {gz:gz,startYear:d.getStartYear(),endYear:d.getEndYear(),startAge:d.getStartAge(),endAge:d.getEndAge(),god:tenGod(dmG,gz[0]),cat:rel(dm,GAN_WX[gz[0]]),zcat:rel(dm,ZHI_WX[gz[1]])}});
  var gods=[tenGod(dmG,p[0][0]),tenGod(dmG,p[1][0]),"日主",inp.noTime?"":tenGod(dmG,p[3][0])];
  var yimaNatal=[YIMA[p[0][1]],YIMA[p[2][1]]];
  var hasYima=p.slice(0,used).some(function(x,i){return yimaNatal.indexOf(x[1])>=0});
  return {pillars:p,gods:gods,dmG:dmG,dm:dm,cats:cats,total:total,elem:elem,support:support,strong:strong,fav:fav,favEl:favEl,useCat:useCat,useEl:elemOfCat(dm,useCat),dayun:dys,hasYima:hasYima,dayZhi:p[2][1],monthZhi:p[1][1]};
}
/* 某一干支對職涯的作用（流年或流月） */
function baziEffect(B,gz,label){
  var r={move:0,stay:0,notes:[]};
  var cg=rel(B.dm,GAN_WX[gz[0]]), cz=rel(B.dm,ZHI_WX[gz[1]]);
  [[cg,1],[cz,0.7]].forEach(function(x){
    var c=x[0],w=x[1];
    if(c==="官殺"){r.stay+=2*w}
    else if(c==="印"){r.stay+=1*w}
    else if(c==="財"){r.stay+=1*w;r.move+=0.5*w}
    else if(c==="食傷"){r.move+=2*w}
    else {r.move+=1*w}
  });
  var favHit=(B.favEl.indexOf(GAN_WX[gz[0]])>=0?1:-1)+(B.favEl.indexOf(ZHI_WX[gz[1]])>=0?0.6:-0.6);
  r.move+=favHit*0.5;r.stay+=favHit*0.5;r.fav=favHit;
  if(cg==="官殺")r.notes.push(label+"天干逢"+tenGod(B.dmG,gz[0])+"，主管注意到你、責任加重");
  if(cg==="食傷")r.notes.push(label+"天干逢"+tenGod(B.dmG,gz[0])+"，想表現、想改變的念頭強");
  if(cg==="財")r.notes.push(label+"天干逢財星，談薪與業績的機會");
  if(cg==="印")r.notes.push(label+"天干逢印星，進修、證照、貴人提攜");
  if(gz[1]===YIMA[B.dayZhi]){r.move+=2;r.notes.push(label+"驛馬動，易有調動、外派或換環境")}
  if(chong(gz[1],B.dayZhi)){r.move+=1.5;r.notes.push(label+"沖日支，個人狀態與工作節奏被打破")}
  if(chong(gz[1],B.monthZhi)){r.move+=1;r.notes.push(label+"沖月令，組織或部門變動")}
  if(LIUHE[gz[1]]===B.dayZhi){r.stay+=1;r.notes.push(label+"合日支，人和穩定")}
  return r;
}

/* ============ 紫微斗數 ============ */
var ZW_STAR={
  紫微:{t:"領導與決策型。需要舞台與位階，適合管理職或能掌握資源分配的位置。",fit:{corp:3,public:2,foreign:1}},
  天機:{t:"策劃、分析、技術型。腦袋快、喜歡變化，適合企劃、顧問、工程與研究。",fit:{startup:2,foreign:2,freelance:1}},
  太陽:{t:"公眾與付出型。適合面向人群、有社會影響力的工作，公職、教育、業務、品牌。",fit:{public:3,corp:2,foreign:1}},
  武曲:{t:"財務與執行型。重結果、能扛數字，適合金融、財務、營運與業績導向職位。",fit:{corp:2,sme:2,foreign:1}},
  天同:{t:"協調與服務型。重視氛圍與福利，適合制度完善、步調穩定的環境。",fit:{public:3,corp:2}},
  廉貞:{t:"制度與公關型。懂規則也懂人際，適合法務、公關、政府關係與管理。",fit:{public:2,corp:2,foreign:1}},
  天府:{t:"守成與管理型。擅長守住資源與團隊，適合大型組織的中高階管理。",fit:{corp:3,public:2,sme:1}},
  太陰:{t:"幕後與細膩型。擅長規劃與照顧細節，適合財會、房地產、設計、內容與後勤。",fit:{corp:2,sme:1,freelance:2}},
  貪狼:{t:"多才與交際型。點子多、人脈廣，適合業務、行銷、娛樂與斜槓發展。",fit:{startup:2,freelance:2,sme:1}},
  巨門:{t:"口才與專業型。靠說服與專業吃飯，適合法律、教學、諮詢、客服與媒體。",fit:{freelance:2,corp:1,foreign:1,public:1}},
  天相:{t:"輔佐與協調型。是最好的二把手，適合行政、專案管理、秘書與人資。",fit:{corp:3,public:2}},
  天梁:{t:"監察與照顧型。重原則、愛照顧人，適合醫療、保險、稽核、社福與顧問。",fit:{public:2,corp:1,freelance:1}},
  七殺:{t:"開創與衝鋒型。不怕硬仗，適合業務開拓、新事業部、軍警或需要突破的職位。",fit:{startup:3,foreign:1,sme:1}},
  破軍:{t:"變革與重建型。先破後立，適合新創、轉型專案、跨域與高變動產業。",fit:{startup:3,freelance:2}}
};
var MU={祿:"祿",權:"權",科:"科",忌:"忌"};
function hourIndex(hh,noTime){if(noTime)return 6;return hh===23?12:Math.floor((hh+1)/2)}
function calcZiwei(inp){
  var a=iztro.astro.bySolar(inp.y+"-"+inp.m+"-"+inp.d,hourIndex(inp.hh,inp.noTime),inp.gender,true,"zh-TW");
  var pal=a.palaces;
  function idxOf(name){for(var i=0;i<12;i++)if(pal[i].name===name)return i;return -1}
  var career=idxOf("官祿"), soul=idxOf("命宮"), travel=idxOf("遷移");
  var careerStars=pal[career].majorStars.map(function(s){return s.name}), borrowed=false;
  if(!careerStars.length){careerStars=pal[(career+6)%12].majorStars.map(function(s){return s.name});borrowed=true}
  function starNames(i){var p=pal[i];return [].concat(p.majorStars,p.minorStars,p.adjectiveStars||[]).map(function(s){return s.name})}
  return {a:a,pal:pal,career:career,soul:soul,travel:travel,careerStars:careerStars,borrowed:borrowed,starNames:starNames};
}
function ziweiYear(Z,year){
  var h=Z.a.horoscope(year+"-7-1");
  var y=h.yearly, names=y.palaceNames, mut=y.mutagen, keys=["祿","權","科","忌"];
  var r={move:0,stay:0,notes:[],gz:y.heavenlyStem+y.earthlyBranch};
  var ci=names.indexOf("官祿"), ti=names.indexOf("遷移"), si=names.indexOf("命宮");
  r.careerIdx=ci;
  keys.forEach(function(k,j){
    var star=mut[j];
    if(Z.starNames(ci).indexOf(star)>=0){
      if(k==="祿"){r.stay+=2;r.move+=0.5;r.notes.push("流年官祿逢"+star+"化祿，工作有實質收穫")}
      if(k==="權"){r.stay+=2;r.notes.push("流年官祿逢"+star+"化權，掌權、升職、被授權")}
      if(k==="科"){r.stay+=1;r.notes.push("流年官祿逢"+star+"化科，名聲與專業被看見")}
      if(k==="忌"){r.move+=2;r.stay-=1;r.notes.push("流年官祿逢"+star+"化忌，工作不順心、易萌生去意")}
    }
    if(Z.starNames(ti).indexOf(star)>=0&&(k==="祿"||k==="權")){r.move+=1.5;r.notes.push("流年遷移逢化"+k+"，外面的機會比內部好")}
    if(Z.starNames(si).indexOf(star)>=0&&k==="忌"){r.notes.push("流年命宮化忌，重大決定宜多想一步")}
  });
  var d=h.decadal;r.decadal={gz:d.heavenlyStem+d.earthlyBranch,careerIdx:d.palaceNames.indexOf("官祿"),soulIdx:d.palaceNames.indexOf("命宮"),mutagen:d.mutagen};
  return r;
}

/* ============ 星盤 ============ */
var SIGNS=["牡羊","金牛","雙子","巨蟹","獅子","處女","天秤","天蠍","射手","摩羯","水瓶","雙魚"];
var SIGN_EL=[1,2,3,4,1,2,3,4,1,2,3,4]; /* 1火 2土 3風 4水 */
var MC_TEXT={
  牡羊:"天頂牡羊：要能衝、能拿主導權。被綁手綁腳會很快想走，適合開拓型角色。",
  金牛:"天頂金牛：重視穩定累積與實際報酬。適合金融、設計、品牌與能看到資產成長的工作。",
  雙子:"天頂雙子：靠資訊與溝通建立名聲。適合媒體、行銷、業務、教學，常同時身兼多職。",
  巨蟹:"天頂巨蟹：在有歸屬感的團隊裡發揮最好。適合照顧型產業、家族企業、消費品與餐飲。",
  獅子:"天頂獅子：需要被看見、被肯定。適合品牌、娛樂、管理與任何能站上台前的位置。",
  處女:"天頂處女：以專業精準贏得信任。適合研究、品管、醫療、數據分析與流程改善。",
  天秤:"天頂天秤：擅長協調與美感。適合設計、法律、公關、人資與合作型業務。",
  天蠍:"天頂天蠍：適合深入、掌握核心資源的工作。財務、研究、心理、資安、危機處理。",
  射手:"天頂射手：要有遠方與成長空間。適合外商、國際業務、教育、出版與旅遊。",
  摩羯:"天頂摩羯：典型的爬梯型職涯。適合結構完整的大企業或公部門，越晚越吃香。",
  水瓶:"天頂水瓶：適合創新、科技與打破常規的組織。新創、社會企業、科技產品。",
  雙魚:"天頂雙魚：靠直覺與共感工作。適合藝術、療癒、影視、非營利與創意產業。"
};
var PL_10={太陽:"想在事業上被看見",月亮:"工作情緒決定去留",水星:"靠腦力與溝通成名",金星:"人緣帶來職位",火星:"事業企圖心強",木星:"事業運天生有貴人",土星:"晚成但根基穩",天王星:"職涯常有突變",海王星:"理想與創意導向",冥王星:"追求權力與深度影響"};
var BODIES=[["太陽","Sun"],["月亮","Moon"],["水星","Mercury"],["金星","Venus"],["火星","Mars"],["木星","Jupiter"],["土星","Saturn"],["天王星","Uranus"],["海王星","Neptune"],["冥王星","Pluto"]];
function lonOf(body,date){
  if(body==="Sun")return Astronomy.SunPosition(date).elon;
  if(body==="Moon")return Astronomy.EclipticGeoMoon(date).lon;
  return Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body[body],date,true)).elon;
}
function meanNode(date){var T=Astronomy.MakeTime(date).tt/36525;return norm360(125.04452-1934.136261*T)}
function utcDate(inp){var hh=inp.noTime?12:inp.hh,mm=inp.noTime?0:inp.mm;return new Date(Date.UTC(inp.y,inp.m-1,inp.d,hh,mm)-inp.tz*3600000)}
function calcAstro(inp){
  var dt=utcDate(inp), pl={};
  BODIES.forEach(function(b){pl[b[0]]=lonOf(b[1],dt)});
  var r={pl:pl,hasTime:!inp.noTime};
  if(!inp.noTime){
    var T=Astronomy.MakeTime(dt).tt/36525, eps=(23.4393-0.0130*T)*Math.PI/180;
    var ramc=norm360(Astronomy.SiderealTime(dt)*15+inp.lon)*Math.PI/180, phi=inp.lat*Math.PI/180;
    var asc=norm360(Math.atan2(Math.cos(ramc),-(Math.sin(ramc)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps)))*180/Math.PI);
    var mc=norm360(Math.atan2(Math.sin(ramc),Math.cos(ramc)*Math.cos(eps))*180/Math.PI);
    r.asc=asc;r.mc=mc;r.ascSign=Math.floor(asc/30);
  } else { r.ascSign=Math.floor(pl.太陽/30); }
  r.house=function(lon){return ((Math.floor(lon/30)-r.ascSign+12)%12)+1};
  return r;
}
function astroMonth(A,date){
  var r={move:0,stay:0,notes:[]};
  var ju=lonOf("Jupiter",date), sa=lonOf("Saturn",date), ur=lonOf("Uranus",date), pu=lonOf("Pluto",date);
  var hj=A.house(ju), hs=A.house(sa);
  if(hj===10){r.stay+=2.5;r.notes.push("木星行經第 10 宮：升遷與名聲的大年")}
  if(hj===6){r.move+=1.5;r.notes.push("木星行經第 6 宮：換到更好的工作環境")}
  if(hj===2){r.stay+=1;r.notes.push("木星行經第 2 宮：加薪談判有利")}
  if(hj===1){r.move+=1;r.notes.push("木星行經第 1 宮：新開始、個人品牌擴張")}
  if(hj===9){r.move+=1;r.notes.push("木星行經第 9 宮：外派、進修、跨國機會")}
  if(hs===10){r.stay+=1;r.notes.push("土星行經第 10 宮：責任加重，撐住就升")}
  if(hs===6){r.stay+=0.5;r.move-=0.5;r.notes.push("土星行經第 6 宮：工作量大，先別裸辭")}
  if(A.mc!=null){
    function hard(x,orb){var d=Math.abs(norm180(x-A.mc));return d<orb||Math.abs(d-90)<orb||Math.abs(d-180)<orb}
    if(hard(ur,3)){r.move+=3;r.notes.push("天王星刑沖天頂：職涯突變，跳槽或轉行的強訊號")}
    if(hard(pu,2)){r.move+=2;r.notes.push("冥王星刑沖天頂：職涯徹底重組")}
    if(Math.abs(norm180(sa-A.mc))<4){r.stay+=1.5;r.notes.push("土星合天頂：職涯考核點")}
    if(Math.abs(norm180(ju-A.mc))<6){r.stay+=2;r.notes.push("木星合天頂：曝光與晉升")}
  }
  return r;
}

/* ============ 人類圖 ============ */
var HD_GATES=[41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60];
var HD_CENTERS={頭頂:[64,61,63],邏輯:[47,24,4,17,43,11],喉嚨:[62,23,56,35,12,45,33,8,31,20,16],G中心:[1,13,25,46,2,15,10,7],意志力:[21,40,26,51],直覺:[48,57,44,50,32,28,18],情緒:[6,37,22,36,30,55,49],薦骨:[34,5,14,29,59,9,3,42,27],根部:[53,60,52,19,39,41,58,38,54]};
var HD_CH=[[1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],[10,34],[10,57],[11,56],[12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],[20,57],[21,45],[23,43],[24,61],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],[32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64]];
function gateCenter(g){for(var c in HD_CENTERS)if(HD_CENTERS[c].indexOf(g)>=0)return c}
function gateOf(lon){var d=norm360(lon-302),i=Math.floor(d/5.625);return {gate:HD_GATES[i],line:Math.floor((d-i*5.625)/0.9375)+1}}
function hdActivations(date){
  var out=[], sun=lonOf("Sun",date), node=meanNode(date);
  out.push(["太陽",sun],["地球",norm360(sun+180)],["月亮",lonOf("Moon",date)],["北交",node],["南交",norm360(node+180)]);
  ["Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"].forEach(function(b){out.push([b,lonOf(b,date)])});
  return out.map(function(x){var g=gateOf(x[1]);return {p:x[0],gate:g.gate,line:g.line}});
}
function calcHD(inp){
  var birth=utcDate(inp), sun=lonOf("Sun",birth), target=norm360(sun-88);
  var t=new Date(birth.getTime()-89*86400000);
  for(var i=0;i<8;i++){var diff=norm180(target-lonOf("Sun",t));t=new Date(t.getTime()+diff/0.9856*86400000)}
  var pers=hdActivations(birth), des=hdActivations(t);
  var gates={};pers.concat(des).forEach(function(a){gates[a.gate]=1});
  var chans=HD_CH.filter(function(c){return gates[c[0]]&&gates[c[1]]});
  var defined={};chans.forEach(function(c){defined[gateCenter(c[0])]=1;defined[gateCenter(c[1])]=1});
  var adj={};chans.forEach(function(c){var a=gateCenter(c[0]),b=gateCenter(c[1]);(adj[a]=adj[a]||[]).push(b);(adj[b]=adj[b]||[]).push(a)});
  function reach(from,to){var seen={},st=[from];while(st.length){var x=st.pop();if(x===to)return true;if(seen[x])continue;seen[x]=1;(adj[x]||[]).forEach(function(y){st.push(y)})}return false}
  var type, motorsToThroat=["意志力","情緒","根部"].some(function(m){return defined[m]&&reach(m,"喉嚨")});
  if(!Object.keys(defined).length)type="反映者";
  else if(defined.薦骨)type=(reach("薦骨","喉嚨")||motorsToThroat)?"顯示生產者":"生產者";
  else type=motorsToThroat?"顯示者":"投射者";
  var auth=type==="反映者"?"月亮週期":defined.情緒?"情緒中心":defined.薦骨?"薦骨中心":defined.直覺?"直覺中心":defined.意志力?"意志力中心":defined.G中心?"自我投射":"環境（心智投射）";
  var profile=pers[0].line+"/"+des[0].line;
  return {pers:pers,des:des,chans:chans,defined:defined,type:type,auth:auth,profile:profile};
}
var HD_TYPE={
  生產者:{strat:"等待回應",sig:"挫敗感",t:"你的薦骨是持續運轉的發電機，做喜歡的事能做很久。最適合有明確任務、能長期累積專精的位置。轉職訊號不是「腦袋覺得該走」，而是每天上班時身體都沒反應、持續挫敗。換工作時，從「別人來找你」的機會中挑讓你有「嗯！」反應的。",fit:{corp:2,sme:2}},
  顯示生產者:{strat:"等待回應，再告知",sig:"挫敗與憤怒",t:"你是多工、快速、會跳步的生產者。重複且節奏慢的工作會讓你耗竭。適合產品開發、新創、多專案並行的環境。轉職前先回應一個具體機會，再告知身邊的人，可以減少阻力。",fit:{startup:3,freelance:1}},
  投射者:{strat:"等待邀請",sig:"苦澀感",t:"你天生看得懂人與系統，是引導者與顧問。不被認可的地方再努力也只會累。最好的工作是被邀請的工作：主管點名、獵頭找上門、朋友推薦。適合管理、顧問、人資、策略與教練型職位，工時不宜過長。",fit:{foreign:2,corp:1,freelance:2}},
  顯示者:{strat:"告知後行動",sig:"憤怒",t:"你是發起者，不需要等別人點頭。被層層簽核卡住時最痛苦。適合創業、開拓新市場、獨立負責一條線。重要決定前先告知主管與家人，阻力會小很多。",fit:{startup:3,freelance:2}},
  反映者:{strat:"等待 28 天月亮週期",sig:"失望",t:"你是環境的鏡子，團隊健不健康會直接反映在你身上。選公司時「人與地方」比職稱更重要。重大職涯決定給自己一個月，跟不同的人談過再定。",fit:{sme:2,corp:1,public:1}}
};
var PROFILE_NAME={1:"研究者",2:"隱士",3:"實驗者",4:"人脈者",5:"解決者",6:"典範"};

/* ============ 奇門遁甲（時家轉盤拆補，簡化取八門） ============ */
var JU={冬至:[1,7,4],小寒:[2,8,5],大寒:[3,9,6],立春:[8,5,2],雨水:[9,6,3],惊蛰:[1,7,4],春分:[3,9,6],清明:[4,1,7],谷雨:[5,2,8],立夏:[4,1,7],小满:[5,2,8],芒种:[6,3,9],
  夏至:[9,3,6],小暑:[8,2,5],大暑:[7,1,4],立秋:[2,5,8],处暑:[1,4,7],白露:[9,3,6],秋分:[7,1,4],寒露:[6,9,3],霜降:[5,8,2],立冬:[6,9,3],小雪:[5,8,2],大雪:[4,7,1]};
var YANG=["冬至","小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种"];
var ORIG_DOOR={1:"休",8:"生",3:"傷",4:"杜",9:"景",2:"死",7:"驚",6:"開",5:"死"};
var RING=[1,8,3,4,9,2,7,6], DIR={1:"北",8:"東北",3:"東",4:"東南",9:"南",2:"西南",7:"西",6:"西北"};
var DOOR_Q={開:2,休:2,生:2,景:0.5,杜:-0.5,傷:-1,驚:-1,死:-1.5};
function qimen(y,m,d,hh){
  var l=Solar.fromYmdHms(y,m,d,hh,0,0).getLunar();
  var term=l.getPrevJieQi(true).getName(), yang=YANG.indexOf(term)>=0;
  var di=LunarUtil.getJiaZiIndex(l.getDayInGanZhi()), yuan=Math.floor(((di-di%5)%15)/5);
  var ju=JU[term][yuan];
  var yi="戊己庚辛壬癸丁丙乙", pos={};
  for(var k=0;k<9;k++){var p=yang?((ju-1+k)%9)+1:(((ju-1-k)%9)+9)%9+1;pos[yi[k]]=p}
  var hgz=l.getTimeInGanZhi(), hi=LunarUtil.getJiaZiIndex(hgz), steps=hi%10, xunYi="戊己庚辛壬癸"[Math.floor(hi/10)];
  var P0=pos[xunYi], P=yang?((P0-1+steps)%9)+1:(((P0-1-steps)%9)+9)%9+1;
  if(P===5)P=2; var P0r=P0===5?2:P0;
  var kk=RING.indexOf(P)-RING.indexOf(P0r), doors={};
  for(var i=0;i<8;i++)doors[RING[((i+kk)%8+8)%8]]=ORIG_DOOR[RING[i]];
  var openAt=+Object.keys(doors).filter(function(x){return doors[x]==="開"})[0];
  return {term:term,yang:yang,ju:ju,yuan:"上中下"[yuan],hgz:hgz,dgz:l.getDayInGanZhi(),zhiShi:ORIG_DOOR[P0r],zhiShiAt:P,doors:doors,openAt:openAt,openDir:DIR[openAt],yi:l.getDayYi(),ji:l.getDayJi()};
}
var YI_MAP={开市:"開市",交易:"交易",立券:"立券",出行:"出行",会亲友:"會親友",求职:"求職",上任:"上任",入学:"入學",纳财:"納財",移徙:"移徙"};
function qimenDays(B,start,n){
  var res=[];
  for(var i=1;i<=n;i++){
    var dt=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i);
    var q=qimen(dt.getFullYear(),dt.getMonth()+1,dt.getDate(),10);
    var s=DOOR_Q[q.doors[q.zhiShiAt]]||0;
    var hits=q.yi.filter(function(x){return YI_MAP[x]});
    s+=hits.length*0.6; q.ji.forEach(function(x){if(YI_MAP[x])s-=0.8});
    if(chong(q.dgz[1],B.dayZhi))s-=2;
    var wd=dt.getDay(); if(wd===0||wd===6)s-=1.2;
    var act=hits.indexOf("立券")>=0||hits.indexOf("交易")>=0?"簽約／談薪":hits.indexOf("出行")>=0||hits.indexOf("会亲友")>=0?"面試／拜訪":hits.indexOf("开市")>=0?"報到／開工":"遞交履歷";
    res.push({date:dt,q:q,score:s,act:act,door:q.doors[q.zhiShiAt],hits:hits.map(function(x){return YI_MAP[x]})});
  }
  return res;
}

/* ============ 綜合 ============ */
function compute(inp,now){
  var B=calcBazi(inp), Z=calcZiwei(inp), A=calcAstro(inp), H=calcHD(inp);
  var months=[], zy={}, by={};
  for(var i=1;i<=36;i++){
    var dt=new Date(now.getFullYear(),now.getMonth()+i,15);
    var Y=dt.getFullYear(), M=dt.getMonth()+1;
    var l=Solar.fromYmd(Y,M,15).getLunar();
    var ygz=l.getYearInGanZhiExact(), mgz=l.getMonthInGanZhiExact();
    if(!by[ygz])by[ygz]=baziEffect(B,ygz,ygz+"年");
    if(!zy[Y])zy[Y]=ziweiYear(Z,Y);
    var bm=baziEffect(B,mgz,mgz+"月"), am=astroMonth(A,new Date(Date.UTC(Y,M-1,15)));
    var mv=by[ygz].move*0.6+bm.move*0.8+zy[Y].move*0.7+am.move;
    var st=by[ygz].stay*0.6+bm.stay*0.8+zy[Y].stay*0.7+am.stay;
    months.push({y:Y,m:M,ygz:ygz,mgz:mgz,mvRaw:mv,stRaw:st,notes:[].concat(bm.notes.slice(0,2),am.notes),detail:{八字流年:by[ygz].notes,八字流月:bm.notes,紫微流年:zy[Y].notes,星盤行運:am.notes}});
  }
  var all=[];months.forEach(function(x){all.push(x.mvRaw,x.stRaw)});
  var lo=Math.min.apply(null,all),hi=Math.max.apply(null,all);
  months.forEach(function(x){x.move=Math.round(15+75*(x.mvRaw-lo)/(hi-lo||1));x.stay=Math.round(15+75*(x.stRaw-lo)/(hi-lo||1))});
  /* 公司類型 */
  var fit={corp:0,startup:0,foreign:0,public:0,freelance:0,sme:0}, why={corp:[],startup:[],foreign:[],public:[],freelance:[],sme:[]};
  function add(k,v,w){fit[k]+=v;if(w&&v>=1.2&&why[k].indexOf(w)<0)why[k].push(w)}
  var sh=function(c){return B.cats[c]/B.total*5};
  add("corp",sh("官殺")*3,"八字官殺有力");add("public",sh("官殺")*3,"八字官殺有力");
  add("public",sh("印")*2,"印星重");add("corp",sh("印"),"");add("foreign",sh("印"),"");
  add("startup",sh("食傷")*2,"食傷旺");add("freelance",sh("食傷")*3,"食傷旺");
  add("sme",sh("財")*2,"財星顯");add("startup",sh("財"),"");add("foreign",sh("財"),"");
  add("startup",sh("比劫")*2,"比劫強");add("freelance",sh("比劫"),"");add("sme",sh("比劫"),"");
  if(B.hasYima)add("foreign",2,"八字帶驛馬");
  Z.careerStars.forEach(function(s){var f=(ZW_STAR[s]||{}).fit||{};for(var k in f)add(k,f[k]*1.2,"官祿宮"+s)});
  var hf=HD_TYPE[H.type].fit;for(var k in hf)add(k,hf[k]*1.2,"人類圖"+H.type);
  if(A.mc!=null){var ms=Math.floor(A.mc/30),el=SIGN_EL[ms],sn="天頂"+SIGNS[ms];
    if(el===1){add("startup",1.5,sn);add("freelance",1,sn)} if(el===2){add("corp",1.5,sn);add("public",1,sn)}
    if(el===3){add("foreign",1.5,sn);add("startup",1,sn)} if(el===4){add("sme",1.5,sn);add("freelance",1,sn)}
    if(ms===9)add("corp",1.5,sn); if(ms===10)add("startup",1.5,sn); if(ms===8)add("foreign",1.5,sn);}
  var fmax=Math.max.apply(null,Object.values(fit));
  var fitList=Object.keys(fit).map(function(k){return {k:k,v:Math.round(100*fit[k]/fmax),why:why[k]}}).sort(function(a,b){return b.v-a.v});
  var nxt=months.slice(0,12), mvAvg=nxt.reduce(function(s,x){return s+x.move},0)/12, stAvg=nxt.reduce(function(s,x){return s+x.stay},0)/12;
  return {B:B,Z:Z,A:A,H:H,months:months,fitList:fitList,mvAvg:mvAvg,stAvg:stAvg,zy:zy,by:by,qdays:qimenDays(B,now,60)};
}

/* ============ 每日職場運勢 ============ */
var ACTS=["提案簡報","談薪加薪","面試","遞辭呈","請假充電"];
function dailyFortune(B,dt){
  var q=qimen(dt.getFullYear(),dt.getMonth()+1,dt.getDate(),10), gz=q.dgz;
  var cat=rel(B.dm,GAN_WX[gz[0]]), door=q.doors[q.zhiShiAt];
  var fav=(B.favEl.indexOf(GAN_WX[gz[0]])>=0?1:-1)+(B.favEl.indexOf(ZHI_WX[gz[1]])>=0?0.5:-0.5);
  var a={提案簡報:0,談薪加薪:0,面試:0,遞辭呈:0,請假充電:0}, notes=[];
  if(cat==="食傷"){a.提案簡報+=2;a.面試+=1;notes.push("食傷日：表達力強，適合提案與自我推銷")}
  if(cat==="官殺"){a.提案簡報+=0.5;a.面試+=0.5;a.遞辭呈-=1.5;notes.push("官殺日：主管注意力在你身上，適合談升遷，不宜正面衝撞")}
  if(cat==="財"){a.談薪加薪+=2;notes.push("財星日：談數字、談條件有利")}
  if(cat==="印"){a.請假充電+=1.5;a.面試+=1;notes.push("印星日：貴人運，適合請教前輩、進修")}
  if(cat==="比劫"){a.談薪加薪-=1;a.提案簡報+=0.5;a.遞辭呈+=0.5;notes.push("比劫日：競爭心強，談判容易僵持")}
  if(door==="開"){a.面試+=2;a.提案簡報+=1;notes.push("巳時值使開門：利求職與開創")}
  else if(door==="休"){a.請假充電+=2;a.面試+=0.5;notes.push("巳時值使休門：利休養與求貴人")}
  else if(door==="生"){a.談薪加薪+=2;notes.push("巳時值使生門：利財利與談條件")}
  else if(door==="景"){a.提案簡報+=1;notes.push("巳時值使景門：利文書與簡報")}
  else {for(var k in a)a[k]-=0.8;notes.push("巳時值使"+door+"門：凡事宜低調")}
  var clash=chong(gz[1],B.dayZhi);
  if(clash){a.遞辭呈+=1;a.談薪加薪-=1;a.提案簡報-=0.5;notes.push("日支相沖：情緒易起伏，避免衝動決定")}
  if(LIUHE[gz[1]]===B.dayZhi){a.提案簡報+=0.5;a.談薪加薪+=0.5;notes.push("日支相合：人際順暢")}
  if(q.yi.indexOf("立券")>=0||q.yi.indexOf("交易")>=0)a.談薪加薪+=1;
  if(q.yi.indexOf("出行")>=0)a.面試+=0.5;
  for(var k2 in a)a[k2]+=fav*0.6;
  var score=clamp(Math.round(55+fav*12+(DOOR_Q[door]||0)*6-(clash?10:0)),5,98);
  var acts={};for(var k3 in a)acts[k3]=a[k3]>=1.5?"good":a[k3]<=-0.5?"bad":"mid";
  var wd=dt.getDay();
  return {date:dt,gz:gz,cat:cat,god:tenGod(B.dmG,gz[0]),score:score,acts:acts,raw:a,notes:notes,door:door,openDir:q.openDir,weekend:wd===0||wd===6,q:q};
}

/* ============ 工作條件評分（offer 比較、現職適配共用） ============ */
var IND_LIST=[];(function(){var I={0:["教育培訓","出版文創","設計","醫療生技","環保農林"],1:["半導體與電子","網路媒體","能源","餐飲","美業與娛樂"],2:["不動產","營建","顧問管理","保險","物流倉儲"],3:["金融投資","法律","機械製造","汽車","資安"],4:["國際貿易","航運旅遊","行銷傳播","軟體與資訊流通","飲品水產"]};for(var e in I)I[e].forEach(function(n){IND_LIST.push({n:n,e:+e})})})();
var ROLES={業務:["財","食傷"],行銷企劃:["食傷","財"],研發工程:["印","食傷"],設計創意:["食傷","比劫"],財務會計:["財","官殺"],人資:["印","官殺"],行政:["官殺","印"],專案管理:["官殺","比劫"],客服:["印","比劫"],主管職:["官殺","財"],教育培訓:["印","食傷"],法務稽核:["官殺","印"]};
var DIR_EL={東:0,東南:0,南:1,西南:2,東北:2,西:3,西北:3,北:4};
function elScore(B,e){return e===B.useEl?100:B.favEl.indexOf(e)>=0?80:35}
function roleScore(B,role){
  var cs=ROLES[role];
  return Math.round(cs.reduce(function(s,c,i){var share=B.cats[c]/B.total;return s+[0.6,0.4][i]*(50*(B.fav.indexOf(c)>=0?1:0.3)+50*Math.min(1,share*2.5))},0));
}
function bestRole(B){return Object.keys(ROLES).sort(function(a,b){return roleScore(B,b)-roleScore(B,a)})[0]}
function bestIndustry(B){return IND_LIST.filter(function(x){return x.e===B.useEl}).map(function(x){return x.n}).slice(0,3)}
/* o: {type, industry, role, dir, date(Date), founded(年)} */
function scoreJob(R,o){
  var B=R.B, parts=[];
  if(o.type){var f=R.fitList.filter(function(x){return x.k===o.type})[0];parts.push({k:"type",label:"公司類型",v:f.v,w:0.3})}
  if(o.industry){var ind=IND_LIST.filter(function(x){return x.n===o.industry})[0];parts.push({k:"industry",label:"產業五行",v:elScore(B,ind.e),w:0.25,el:ind.e})}
  if(o.role)parts.push({k:"role",label:"職能",v:roleScore(B,o.role),w:0.25});
  if(o.dir&&DIR_EL[o.dir]!=null)parts.push({k:"dir",label:"方位",v:elScore(B,DIR_EL[o.dir]),w:0.08,el:DIR_EL[o.dir]});
  if(o.date){
    var d=dailyFortune(B,o.date), mo=R.months.filter(function(m){return m.y===o.date.getFullYear()&&m.m===o.date.getMonth()+1})[0];
    var v=mo?Math.round(0.6*(mo.move-15)/75*100+0.4*d.score):d.score;
    parts.push({k:"date",label:"報到時機",v:clamp(v,0,100),w:0.12,day:d});
  }
  if(o.founded){var fl=Solar.fromYmd(o.founded,7,1).getLunar().getYearInGanZhiExact();var fe=GAN_WX[fl[0]];parts.push({k:"founded",label:"公司成立年",v:elScore(B,fe),w:0.1,gz:fl,el:fe})}
  var tw=parts.reduce(function(s,p){return s+p.w},0);
  var total=Math.round(parts.reduce(function(s,p){return s+p.v*p.w},0)/(tw||1));
  return {parts:parts,total:total};
}

/* ============ 合盤 ============ */
function hdGates(H){var g={};H.pers.concat(H.des).forEach(function(a){g[a.gate]=1});return g}
function synastry(R,other){
  var B=R.B, B2=calcBazi(other), H2=calcHD(other);
  var theyToMe=rel(B.dm,B2.dm), meToThem=rel(B2.dm,B.dm), score=50, notes=[];
  var theyHelp=B.favEl.indexOf(B2.dm)>=0, iHelp=B2.favEl.indexOf(B.dm)>=0;
  if(theyHelp){score+=14;notes.push("對方日主"+WX[B2.dm]+"是你的喜用，跟他共事對你有加分")}
  else notes.push("對方日主"+WX[B2.dm]+"不在你的喜用，合作要靠制度和分工撐著");
  if(iHelp){score+=14;notes.push("你的日主"+WX[B.dm]+"正是對方需要的五行，他會想用你")}
  if(LIUHE[B2.dayZhi]===B.dayZhi){score+=12;notes.push("兩人日支六合，默契好、容易看對眼")}
  if(chong(B2.dayZhi,B.dayZhi)){score-=12;notes.push("兩人日支相沖，做事節奏不同，容易誤會")}
  var g1=hdGates(R.H), g2=hdGates(H2), em=[], comp=[];
  HD_CH.forEach(function(c){
    var a=c[0],b=c[1];
    if(g1[a]&&g1[b]&&g2[a]&&g2[b])comp.push(c);
    else if((g1[a]&&!g1[b]&&g2[b]&&!g2[a])||(g1[b]&&!g1[a]&&g2[a]&&!g2[b]))em.push(c);
  });
  score+=Math.min(12,em.length*4)+Math.min(6,comp.length*3);
  return {B2:B2,H2:H2,theyToMe:theyToMe,meToThem:meToThem,score:clamp(score,8,96),notes:notes,em:em,comp:comp};
}
