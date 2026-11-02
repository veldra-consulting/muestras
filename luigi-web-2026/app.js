(function(){
'use strict';
var d=document,LANG=d.documentElement.lang==='en'?'en':'es';
var T={
 es:{open:'Abierto ahora · cocina hasta las 00:00',closed:'Cerrado ahora · abrimos a las 12:00',two:'Esta tarde, para dos',twoTom:'Mañana por la tarde, para dos',rsvIn:'Reservar en ',rsvTwo:'Para dos · ',today:'hoy',tomorrow:'mañana',choose:'Elige restaurante',cmLang:'spanish'},
 en:{open:'Open now · kitchen until midnight',closed:'Closed now · we open at 12:00',two:'This evening, for two',twoTom:'Tomorrow evening, for two',rsvIn:'Book at ',rsvTwo:'For two · ',today:'today',tomorrow:'tomorrow',choose:'Choose a restaurant',cmLang:'english'}
}[LANG];
var CM={lluria:'restaurante-luigi-pizzeria',laietana:'restaurante-luigivialaietana'};
var NAMES={lluria:'Roger de Llúria',laietana:'Via Laietana'};

/* Hora de Barcelona, sea cual sea la zona del móvil */
function madrid(offsetDays){
 var dt=new Date(Date.now()+(offsetDays||0)*864e5);
 var p={};new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(dt).forEach(function(x){p[x.type]=x.value});
 return {y:p.year,m:p.month,d:p.day,h:+p.hour,min:+p.minute,iso:p.year+'-'+p.month+'-'+p.day};
}
window.LuigiTime=madrid;

/* Abierto / cerrado (12:00 a 24:00 todos los días) */
var now=madrid(),open=now.h>=12;
d.querySelectorAll('[data-status]').forEach(function(el){
 el.innerHTML='<span class="dot'+(open?'':' off')+'"></span>'+(open?T.open:T.closed);
});

/* «Esta tarde, para dos»: a partir de las 21:00 pasa a mañana */
var late=now.h>=21||now.h<4;
d.querySelectorAll('[data-two-label]').forEach(function(el){el.textContent=late?T.twoTom:T.two});

/* Menú móvil */
var mb=d.querySelector('.menu-b'),dr=d.getElementById('drawer');
if(mb&&dr){mb.addEventListener('click',function(){var o=dr.classList.toggle('open');mb.setAttribute('aria-expanded',o)})}

/* Reserva: hoja con elección de local y el módulo de CoverManager */
function cmUrl(k,two){
 var u='https://www.covermanager.com/reserve/module_restaurant/'+CM[k]+'/'+T.cmLang;
 if(two){u+='?people=2&day='+madrid(late?1:0).iso}
 return u;
}
var dlg=d.getElementById('rsv');
function frame(box,k,two){
 box.innerHTML='';
 var f=d.createElement('iframe');
 f.className='cm';f.title=T.rsvIn+NAMES[k];f.src=cmUrl(k,two);f.setAttribute('loading','eager');
 box.appendChild(f);
}
function openRsv(k,two){
 if(!dlg){location.href=d.documentElement.dataset.rsvUrl+(k?('?local='+k+(two?'&para=2':'')):'');return}
 var title=dlg.querySelector('[data-rsv-title]'),pick=dlg.querySelector('.pick'),box=dlg.querySelector('[data-rsv-box]'),back=dlg.querySelector('.back');
 dlg.dataset.two=two?'1':'';
 if(k){pick.hidden=true;box.hidden=false;back.hidden=false;title.textContent=(two?T.rsvTwo:T.rsvIn)+NAMES[k];frame(box,k,two)}
 else{pick.hidden=false;box.hidden=true;back.hidden=true;box.innerHTML='';title.textContent=two?(late?T.twoTom:T.two):T.choose}
 if(!dlg.open){dlg.showModal();d.body.style.overflow='hidden'}
}
if(dlg){
 dlg.addEventListener('close',function(){d.body.style.overflow='';dlg.querySelector('[data-rsv-box]').innerHTML=''});
 dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
 dlg.querySelector('.x').addEventListener('click',function(){dlg.close()});
 dlg.querySelector('.back').addEventListener('click',function(){openRsv('',dlg.dataset.two==='1')});
 dlg.querySelectorAll('.pick [data-k]').forEach(function(b){b.addEventListener('click',function(){openRsv(b.dataset.k,dlg.dataset.two==='1')})});
}
d.addEventListener('click',function(e){
 var a=e.target.closest('[data-rsv]');
 if(!a)return;
 e.preventDefault();
 openRsv(a.dataset.rsv||'',a.hasAttribute('data-two'));
});

/* Página de reservas: módulo en línea */
var inl=d.querySelector('[data-rsv-inline]');
if(inl){
 var q=new URLSearchParams(location.search),k0=q.get('local'),two0=q.get('para')==='2';
 var go=function(k,two){d.querySelectorAll('[data-pick-inline]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.k===k)});inl.hidden=false;frame(inl,k,two);inl.scrollIntoView({behavior:'smooth',block:'start'})};
 d.querySelectorAll('[data-pick-inline]').forEach(function(b){b.addEventListener('click',function(){go(b.dataset.k,b.hasAttribute('data-two'))})});
 if(CM[k0])go(k0,two0);
}

/* Vídeo de portada: entra cuando la página ya ha cargado (no frena la carga) */
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var save=navigator.connection&&(navigator.connection.saveData||/2g/.test(navigator.connection.effectiveType||''));
function startVideo(box){
 if(!box||box.dataset.done||reduce||save)return;box.dataset.done='1';
 var v=d.createElement('video');v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('muted','');v.setAttribute('aria-hidden','true');v.preload='auto';
 v.src=box.dataset.video;if(box.dataset.poster)v.poster=box.dataset.poster;
 v.addEventListener('playing',function(){v.classList.add('on')},{once:true});
 box.appendChild(v);
 var p=v.play();if(p&&p.catch)p.catch(function(){});
 if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){v.play().catch(function(){})}else{v.pause()}})}).observe(box)}
}
var hv=d.querySelector('[data-video].hero-media');
if(hv){
 var kick=function(){startVideo(hv);['pointerdown','scroll','keydown','touchstart'].forEach(function(t){removeEventListener(t,kick)})};
 ['pointerdown','scroll','keydown','touchstart'].forEach(function(t){addEventListener(t,kick,{passive:true,once:true})});
 addEventListener('load',function(){setTimeout(kick,2500)});
}
/* Vídeos de sección: al acercarse a pantalla */
if('IntersectionObserver' in window){
 var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){io.unobserve(x.target);startVideo(x.target)}})},{rootMargin:'200px'});
 d.querySelectorAll('[data-video]:not(.hero-media)').forEach(function(el){io.observe(el)});
}

/* Mapa: imagen fija y, al tocar, Google Maps */
d.querySelectorAll('[data-map]').forEach(function(b){
 b.addEventListener('click',function(){
  var box=b.closest('.map'),f=d.createElement('iframe');
  f.src='https://www.google.com/maps?q='+encodeURIComponent(b.dataset.map)+'&output=embed&hl='+LANG;
  f.title=b.dataset.title||'Mapa';f.setAttribute('loading','lazy');f.referrerPolicy='no-referrer-when-downgrade';
  box.innerHTML='';box.appendChild(f);
 });
});

/* Carta: filtro de alérgenos y categoría activa */
var fl=d.querySelector('[data-filter]');
if(fl){
 var items=d.querySelectorAll('.item[data-a]'),cnt=fl.querySelector('[data-count]');
 var apply=function(){
  var off=[].map.call(fl.querySelectorAll('input:checked'),function(i){return i.value});
  var n=0;items.forEach(function(it){var a=it.dataset.a.split('|');var h=off.some(function(x){return a.indexOf(x)>-1});it.classList.toggle('hide',h);if(!h)n++});
  if(cnt)cnt.textContent=n;
 };
 fl.addEventListener('change',apply);
}
var chips=d.querySelectorAll('.chips a');
if(chips.length&&'IntersectionObserver' in window){
 var map={};chips.forEach(function(c){map[c.getAttribute('href').slice(1)]=c});
 var so=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){chips.forEach(function(c){c.classList.remove('on')});var c=map[x.target.id];if(c){c.classList.add('on');var pr=c.parentNode;pr.scrollTo({left:c.offsetLeft-pr.clientWidth/2+c.clientWidth/2,behavior:'smooth'})}}})},{rootMargin:'-45% 0px -50% 0px'});
 d.querySelectorAll('.cat[id]').forEach(function(s){so.observe(s)});
}
})();
