(function(){
'use strict';
var d=document,LANG=d.documentElement.lang==='en'?'en':'es';
var T={
 es:{today:'Hoy',tomorrow:'Mañana',none:'Hoy ya no quedan horas: elige mañana',first:'Primera hora libre: ',view:'Ver pedido',empty:'Añade algún plato',items:function(n){return n+(n===1?' plato':' platos')},add:'Añadir',
  needLocal:'Elige en qué local lo recoges.',needSlot:'Elige la hora de recogida.',needItems:'El pedido está vacío.',needName:'Escribe tu nombre.',needPhone:'Escribe un móvil válido (9 cifras).',
  pay:'Pagar ',paying:'Procesando el pago simulado…',order:'Pedido',pickup:'Recogida',client:'Cliente',total:'Total',paid:'PAGADO CON TARJETA · PRUEBA',notes:'Notas',kitchen:'TICKET PARA COCINA',at:' a las ',ticketHead:'PEDIDO PARA RECOGER',demo:'MODO PRUEBA · NO SE HA COBRADO NADA',ready:'Listo para recoger',locs:{lluria:'Roger de Llúria, 50',laietana:'Via Laietana, 41'},remove:'Quitar',ration:{'1':'Ración','1/2':'Media ración'}},
 en:{today:'Today',tomorrow:'Tomorrow',none:'No times left today: choose tomorrow',first:'First free slot: ',view:'View order',empty:'Add a dish',items:function(n){return n+(n===1?' item':' items')},add:'Add',
  needLocal:'Choose where you will pick it up.',needSlot:'Choose a pick-up time.',needItems:'Your order is empty.',needName:'Enter your name.',needPhone:'Enter a valid mobile number.',
  pay:'Pay ',paying:'Processing the simulated payment…',order:'Order',pickup:'Pick-up',client:'Customer',total:'Total',paid:'PAID BY CARD · TEST',notes:'Notes',kitchen:'KITCHEN TICKET',at:' at ',ticketHead:'PICK-UP ORDER',demo:'TEST MODE · NOTHING WAS CHARGED',ready:'Ready for pick-up',locs:{lluria:'Roger de Llúria, 50',laietana:'Via Laietana, 41'},remove:'Remove',ration:{'1':'Full portion','1/2':'Half portion'}}
}[LANG];
var KEY='luigi-pedido-demo';
var LEAD=20; /* minutos mínimos de preparación */
var FIRST=12*60+15,LAST=23*60+45; /* franjas de 12:15 a 23:45 */
function eur(c){var s=(c/100).toFixed(2);return LANG==='es'?s.replace('.',',')+' €':'€'+s}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var st={local:'',day:0,slot:'',lines:{},notes:'',name:'',phone:''};
try{var sv=JSON.parse(localStorage.getItem(KEY)||'null');if(sv&&sv.lines)st=Object.assign(st,sv,{slot:''})}catch(e){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({local:st.local,lines:st.lines,notes:st.notes,name:st.name}))}catch(e){}}

/* catálogo desde el HTML */
var CAT={};
d.querySelectorAll('[data-id]').forEach(function(b){CAT[b.dataset.id]={n:b.dataset.n,p:+b.dataset.p,v:b.dataset.v||'',img:b.dataset.img}});
Object.keys(st.lines).forEach(function(k){if(!CAT[k])delete st.lines[k]});

/* local */
var q=new URLSearchParams(location.search);
if(q.get('local')==='lluria'||q.get('local')==='laietana')st.local=q.get('local');
d.querySelectorAll('input[name=local]').forEach(function(r){r.checked=r.value===st.local;r.addEventListener('change',function(){st.local=r.value;persist();sum()})});

/* días y franjas de 15 minutos dentro del horario */
var daySel=d.getElementById('tw-day'),slotSel=d.getElementById('tw-slot'),hint=d.getElementById('tw-hint');
function fmt(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function slots(day){
 var t=window.LuigiTime(0),min=day===0?t.h*60+t.min+LEAD:0,out=[];
 for(var m=FIRST;m<=LAST;m+=15){if(m>=min)out.push(fmt(m))}
 return out;
}
function fillDays(){
 var t0=window.LuigiTime(0),t1=window.LuigiTime(1);
 daySel.innerHTML='<option value="0">'+T.today+' · '+t0.d+'/'+t0.m+'</option><option value="1">'+T.tomorrow+' · '+t1.d+'/'+t1.m+'</option>';
 if(!slots(0).length)st.day=1;
 daySel.value=String(st.day);
}
function fillSlots(){
 var s=slots(st.day);
 slotSel.innerHTML=s.map(function(x){return '<option>'+x+'</option>'}).join('');
 if(s.indexOf(st.slot)<0)st.slot=s[0]||'';
 slotSel.value=st.slot;
 hint.textContent=st.day===0&&!s.length?T.none:(s.length?T.first+s[0]:'');
}
daySel.addEventListener('change',function(){st.day=+daySel.value;fillSlots();sum()});
slotSel.addEventListener('change',function(){st.slot=slotSel.value;sum()});
fillDays();fillSlots();

/* añadir / quitar */
function count(){return Object.keys(st.lines).reduce(function(a,k){return a+st.lines[k]},0)}
function total(){return Object.keys(st.lines).reduce(function(a,k){return a+st.lines[k]*CAT[k].p},0)}
function setQty(id,n){if(n<=0)delete st.lines[id];else st.lines[id]=n;persist();paint()}
function ctl(id){
 var n=st.lines[id]||0;
 if(!n)return '<button type="button" class="plus" data-plus="'+id+'">'+T.add+(CAT[id].v?' · '+esc(T.ration[CAT[id].v]||CAT[id].v):'')+'</button>';
 return '<span class="qty"><button type="button" aria-label="-" data-minus="'+id+'">−</button><output>'+n+'</output><button type="button" aria-label="+" data-plus="'+id+'">+</button></span>';
}
function paint(){
 d.querySelectorAll('[data-ctl]').forEach(function(el){el.innerHTML=ctl(el.dataset.ctl)});
 var n=count(),b=d.getElementById('tw-bar');
 b.disabled=!n;
 b.innerHTML=n?'<span>'+T.view+' <span class="c">· '+T.items(n)+'</span></span><span class="c">'+eur(total())+'</span>':'<span>'+T.empty+'</span><span class="c">'+eur(0)+'</span>';
}
d.addEventListener('click',function(e){
 var p=e.target.closest('[data-plus]'),m=e.target.closest('[data-minus]');
 if(p){setQty(p.dataset.plus,(st.lines[p.dataset.plus]||0)+1);if(dlg.open)lines()}
 if(m){setQty(m.dataset.minus,(st.lines[m.dataset.minus]||0)-1);if(dlg.open)lines()}
});

/* hoja del pedido */
var dlg=d.getElementById('tw-dlg'),v1=d.getElementById('tw-v1'),v2=d.getElementById('tw-v2'),v3=d.getElementById('tw-v3');
function view(n){[v1,v2,v3].forEach(function(v,i){v.hidden=i!==n});dlg.querySelector('.sheet-b').scrollTop=0}
function lines(){
 var ul=d.getElementById('tw-lines');
 ul.innerHTML=Object.keys(st.lines).map(function(k){var it=CAT[k];return '<li><div><div class="nm">'+esc(it.n)+(it.v?' <span class="sm">· '+esc(T.ration[it.v]||it.v)+'</span>':'')+'</div><div class="sm">'+eur(it.p)+'</div></div><div data-ctl="'+k+'">'+ctl(k)+'</div></li>'}).join('');
 d.getElementById('tw-total').textContent=eur(total());
 if(!count())dlg.close();
}
function sum(){
 var h='<div><span>'+T.pickup+'</span><span>'+(st.local?esc(T.locs[st.local]):'—')+'</span></div><div><span>&nbsp;</span><span>'+(st.day?T.tomorrow:T.today)+T.at+(st.slot||'—')+'</span></div>';
 d.querySelectorAll('[data-sum]').forEach(function(s){s.innerHTML=h});
}
d.getElementById('tw-bar').addEventListener('click',function(){lines();sum();view(0);dlg.showModal();d.body.style.overflow='hidden'});
dlg.addEventListener('close',function(){d.body.style.overflow=''});
dlg.querySelector('.x').addEventListener('click',function(){dlg.close()});
dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
var fN=d.getElementById('tw-name'),fP=d.getElementById('tw-phone'),fT=d.getElementById('tw-notes'),er=d.getElementById('tw-err');
fN.value=st.name||'';fT.value=st.notes||'';
d.getElementById('tw-next').addEventListener('click',function(){
 st.name=fN.value.trim();st.phone=fP.value.replace(/\s+/g,'');st.notes=fT.value.trim();persist();
 var msg=!st.local?T.needLocal:!st.slot?T.needSlot:!count()?T.needItems:!st.name?T.needName:!/^\+?\d{9,13}$/.test(st.phone)?T.needPhone:'';
 er.textContent=msg;
 if(msg){if(!st.local||!st.slot){dlg.close();d.getElementById('paso-1').scrollIntoView({behavior:'smooth'})}return}
 sum();d.getElementById('tw-paybtn').textContent=T.pay+eur(total());view(1);
});
d.getElementById('tw-back').addEventListener('click',function(){view(0)});
d.getElementById('tw-paybtn').addEventListener('click',function(){
 var b=this;b.disabled=true;b.innerHTML='<span class="spin"></span> '+T.paying;
 setTimeout(function(){b.disabled=false;done()},1600);
});
function done(){
 var id=(st.local==='lluria'?'LL-':'LA-')+String(Math.floor(1000+Math.random()*9000));
 var hora=(st.day?T.tomorrow:T.today)+T.at+st.slot;
 var rows=Object.keys(st.lines).map(function(k){var it=CAT[k];return '<div class="r"><span>'+st.lines[k]+' x '+esc(it.n)+(it.v==='1/2'?' (1/2)':'')+'</span><span>'+eur(it.p*st.lines[k])+'</span></div>'}).join('');
 d.getElementById('tw-id').textContent=id;
 d.getElementById('tw-when').textContent=hora+' · '+T.locs[st.local];
 d.getElementById('tw-ticket').innerHTML='<div class="c">LUIGI · '+esc(T.locs[st.local]).toUpperCase()+'</div><div class="c">'+T.kitchen+'</div><hr><div class="r"><span>'+T.ticketHead+'</span><span>'+id+'</span></div><div class="r"><span>'+T.pickup+'</span><span>'+esc(hora)+'</span></div><div class="r"><span>'+T.client+'</span><span>'+esc(st.name)+' · ···'+esc(st.phone.slice(-3))+'</span></div><hr>'+rows+(st.notes?'<hr><div>'+T.notes+': '+esc(st.notes)+'</div>':'')+'<hr><div class="r"><b>'+T.total+'</b><b>'+eur(total())+'</b></div><div class="c">'+T.paid+'</div><hr><div class="c">'+T.demo+'</div>';
 view(2);
 st.lines={};persist();paint();
}
d.getElementById('tw-new').addEventListener('click',function(){dlg.close();scrollTo({top:0,behavior:'smooth'})});
sum();paint();
})();
