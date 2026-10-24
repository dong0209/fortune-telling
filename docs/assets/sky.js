/* 星空背景與星宿羅盤 */
(function(){
  var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* ---- 星空 ---- */
  var cv=document.getElementById("sky");
  if(cv&&cv.getContext){
    var c=cv.getContext("2d"), stars=[], groups=[], W=0, H=0, seed=7;
    function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
    function size(){
      var dpr=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
      cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+"px";cv.style.height=H+"px";c.setTransform(dpr,0,0,dpr,0,0);
      seed=7;stars=[];var n=Math.round(W*H/5200);
      for(var i=0;i<n;i++)stars.push({x:rnd()*W,y:rnd()*H,r:rnd()<0.08?1.6:rnd()*1.1+0.3,p:rnd()*6.28,s:0.4+rnd()*1.2,gold:rnd()<0.12});
      groups=[];for(var g=0;g<4;g++){var cx=rnd()*W,cy=rnd()*H*0.9,pts=[];for(var k=0;k<5+Math.floor(rnd()*3);k++)pts.push([cx+(rnd()-0.5)*220,cy+(rnd()-0.5)*160]);groups.push(pts)}
    }
    function draw(t){
      c.clearRect(0,0,W,H);
      c.strokeStyle="rgba(217,181,106,0.10)";c.lineWidth=1;
      groups.forEach(function(pts){c.beginPath();pts.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])});c.stroke();
        pts.forEach(function(p){c.fillStyle="rgba(241,213,142,0.55)";c.beginPath();c.arc(p[0],p[1],1.6,0,6.3);c.fill()})});
      for(var i=0;i<stars.length;i++){var s=stars[i],a=0.35+0.55*Math.abs(Math.sin(s.p+t*0.0006*s.s));
        c.fillStyle=s.gold?"rgba(241,213,142,"+a+")":"rgba(220,226,255,"+a+")";c.beginPath();c.arc(s.x,s.y,s.r,0,6.3);c.fill()}
    }
    var last=0;function loop(t){if(t-last>50){draw(t);last=t}if(!document.hidden)requestAnimationFrame(loop)}
    size();draw(0);
    addEventListener("resize",function(){size();draw(performance.now())});
    if(!reduce){requestAnimationFrame(loop);document.addEventListener("visibilitychange",function(){if(!document.hidden)requestAnimationFrame(loop)})}
  }
  /* ---- 星宿羅盤 ---- */
  var host=document.getElementById("ring");
  if(host){
    var XIU="角亢氐房心尾箕斗牛女虛危室壁奎婁胃昴畢觜參井鬼柳星張翼軫", ZHI="子丑寅卯辰巳午未申酉戌亥", GUA="乾兌離震巽坎艮坤";
    function ring(chars,r,fs,cls){
      var s='<g class="'+cls+'">', n=chars.length;
      for(var i=0;i<n;i++){var a=i*360/n;s+='<g transform="rotate('+a+')"><line x1="0" y1="'+(-r-14)+'" x2="0" y2="'+(-r-8)+'"/><text x="0" y="'+(-r+fs*0.35)+'" font-size="'+fs+'" text-anchor="middle">'+chars[i]+'</text></g>'}
      return s+'</g>';
    }
    var dipper=[[-46,-22],[-24,-30],[-6,-18],[10,-4],[34,-6],[46,16],[22,26]];
    var svg='<svg viewBox="-200 -200 400 400" role="presentation">'+
      '<circle r="196" class="r-thin"/><circle r="174" class="r-thin"/><circle r="140" class="r-thin"/><circle r="104" class="r-thin"/><circle r="70" class="r-gold"/>'+
      ring(XIU,184,11,"spin-a")+ring(ZHI,156,17,"spin-b")+ring(GUA,121,15,"spin-a2")+
      '<g class="dipper"><polyline points="'+dipper.map(function(p){return p.join(",")}).join(" ")+'"/>'+dipper.map(function(p,i){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(i===0?3.6:2.6)+'"/>'}).join("")+'</g>'+
      '</svg>';
    host.innerHTML=svg;
  }
})();
