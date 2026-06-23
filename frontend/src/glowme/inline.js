
const CONFIG={OWNER_WHATSAPP:'919876543210'};
const menuTrigger=document.getElementById('menuTrigger');
const mainMenu=document.getElementById('mainMenu');
const menuBackdrop=document.getElementById('menuBackdrop');
const menuClose=document.getElementById('menuClose');
function setMainMenu(open){
  if(!mainMenu||!menuTrigger||!menuBackdrop)return;
  mainMenu.classList.toggle('open',open);
  menuBackdrop.classList.toggle('open',open);
  document.body.classList.toggle('menu-open',open);
  mainMenu.setAttribute('aria-hidden',String(!open));
  menuTrigger.setAttribute('aria-expanded',String(open));
}
if(menuTrigger)menuTrigger.addEventListener('click',()=>setMainMenu(true));
if(menuClose)menuClose.addEventListener('click',()=>setMainMenu(false));
if(menuBackdrop)menuBackdrop.addEventListener('click',()=>setMainMenu(false));
if(mainMenu)mainMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMainMenu(false)));
document.addEventListener('keydown',event=>{if(event.key==='Escape')setMainMenu(false);});
function showToast(msg,type){
  type=type||'success';
  var t=document.createElement('div');
  t.textContent=msg;
  t.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1A1714;border:1px solid '+(type==='error'?'#c85050':'#C9A96E')+';color:'+(type==='error'?'#ffaaaa':'#F5F0E8')+';padding:12px 24px;font-size:13px;z-index:99999;font-family:Jost,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.4)';
  document.body.appendChild(t);
  setTimeout(function(){t.remove();},3500);
}
window.addEventListener('scroll',()=>{
  document.getElementById('mainNav').classList.toggle('scrolled',window.scrollY>80);
  const pct=(window.scrollY/(document.body.scrollHeight-window.innerHeight))*100;
  document.getElementById('scroll-progress').style.width=Math.min(pct,100)+'%';
});
const obs=new IntersectionObserver(e=>{e.forEach(el=>{if(el.isIntersecting)el.target.classList.add('in');});},{threshold:0.1,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el=>obs.observe(el));
const countObs=new IntersectionObserver(e=>{e.forEach(el=>{if(el.isIntersecting&&!el.target.dataset.counted){el.target.dataset.counted='1';const target=parseInt(el.target.dataset.target);let start=0,dur=1400,startTime=null;const step=ts=>{if(!startTime)startTime=ts;const prog=Math.min((ts-startTime)/dur,1);const ease=1-Math.pow(1-prog,3);el.target.textContent=Math.floor(target*ease);if(prog<1)requestAnimationFrame(step);else el.target.textContent=target;};requestAnimationFrame(step);}});},{threshold:0.5});
document.querySelectorAll('.stat-num[data-target]').forEach(el=>countObs.observe(el));
function toggleSave(btn){btn.textContent=btn.textContent==='x'?'x':'x';btn.textContent=btn.innerHTML==='♡'?'♥':'♡';btn.style.background=btn.textContent==='♥'?'var(--gold)':'rgba(8,8,8,0.6)';btn.style.color=btn.textContent==='♥'?'var(--black)':'var(--gold)';}
function bookIt(btn){var card=btn.closest('.artist-card, .nail-card');var name=(card&&card.querySelector('.artist-name, .nail-name'));var svc='Bridal';var tags=card&&card.querySelector('.artist-tags .atag');if(tags)svc=tags.textContent.trim()==='Party'?'Party Makeup':tags.textContent.trim()==='Natural'?'Natural Look':tags.textContent.trim();openCal((name?name.textContent.trim():'Artist'),svc);}
let curM=new Date().getMonth(),curY=new Date().getFullYear(),selDay=null,selTime=null,selSvc=null,curArtist='';
const svcs={'Bridal':['Bridal makeup','Full bridal package','Bridal trial','Reception look'],'Party Makeup':['Party makeup','Evening glam','Festival look'],'Nail Extensions':['Acrylic extensions','Gel extensions','Ombre nails'],'Nail Art':['3D nail art','Gel polish','Bridal nail package'],'Salon Service':['Bridal makeup','Facial','Hair styling','Nail extensions'],'Bridal Package':['Full bridal package','Pre-bridal facial','Engagement look'],'Nail Service':['Acrylic extensions','Gel extensions','Nail art'],'Skincare':['Gold facial','Cleanup','De-tan','Body polishing'],'Natural Look':['Natural glow','Korean look','Dewy skin']};
function artistHours(name){const n=(name||'').charCodeAt(0)%3;if(n===0)return{start:9,end:18,label:'9 AM – 6 PM'};if(n===1)return{start:11,end:20,label:'11 AM – 8 PM'};return{start:7,end:16,label:'7 AM – 4 PM'};}
function dayCapacity(d,m,y){const booked=(d+m+y+curArtist.length)%6;const remaining=Math.max(1,10-booked);return{capacity:10,booked,remaining,label:remaining<=3?'Limited Slots':'Available'};}
function getStatus(d,m,y){const today=new Date();const dt=new Date(y,m,d);dt.setHours(23,59,59,999);if(dt<today)return'past';const cap=dayCapacity(d,m,y);return cap.remaining<=0?'booked':cap.remaining<=3?'limited':'avail';}
function getSlots(){const h=artistHours(curArtist);const all=[];for(let hour=h.start;hour<h.end;hour++){const suffix=hour>=12?'PM':'AM';const hr=((hour+11)%12)+1;all.push(hr+':00 '+suffix);}return all.map(t=>({time:t,taken:false}));}
function openCal(name,svcType){curArtist=name;selDay=null;selTime=null;selSvc=null;curM=new Date().getMonth();curY=new Date().getFullYear();document.getElementById('modalName').textContent=name;document.getElementById('modalSub').textContent=svcType+' Check availability';const pills=svcs[svcType]||svcs['Party Makeup'];document.getElementById('svcPills').innerHTML=pills.map(p=>'<button class="sp" onclick="selSvcBtn(this,\''+p+'\')">'+p+'</button>').join('');document.getElementById('timeSection').style.display='none';updateSum();renderCal();var modal=document.getElementById('calModal');modal.classList.remove('view-only');modal.classList.add('open');document.body.style.overflow='hidden';}
// View-only "Calendar" mode: shows just the month availability grid, no service pills,
// no time slots, no deposit confirm. Distinct from the full Book flow above.
function openAvail(name,svcType){curArtist=name;selDay=null;selTime=null;selSvc=null;curM=new Date().getMonth();curY=new Date().getFullYear();document.getElementById('modalName').textContent=name;document.getElementById('modalSub').textContent=(svcType||'')+' · Availability calendar';document.getElementById('svcPills').innerHTML='';document.getElementById('timeSection').style.display='none';renderCal();var modal=document.getElementById('calModal');modal.classList.add('view-only');modal.classList.add('open');document.body.style.overflow='hidden';}
window.openAvail=openAvail;
function closeCal(){document.getElementById('calModal').classList.remove('open');document.body.style.overflow='';}
function closeIfBg(e){if(e.target===document.getElementById('calModal'))closeCal();}
function selSvcBtn(btn,name){document.querySelectorAll('.sp').forEach(p=>p.classList.remove('sel'));btn.classList.add('sel');selSvc=name;updateSum();}
function chMonth(d){curM+=d;if(curM>11){curM=0;curY++;}if(curM<0){curM=11;curY--;}selDay=null;selTime=null;document.getElementById('timeSection').style.display='none';updateSum();renderCal();}
function renderCal(){const months=['January','February','March','April','May','June','July','August','September','October','November','December'];document.getElementById('calMonthName').textContent=months[curM]+' '+curY;const first=new Date(curY,curM,1).getDay();const days=new Date(curY,curM+1,0).getDate();const today=new Date();let html='';for(let i=0;i<first;i++)html+='<div class="cd empty"></div>';for(let d=1;d<=days;d++){const st=getStatus(d,curM,curY);const isToday=d===today.getDate()&&curM===today.getMonth()&&curY===today.getFullYear();const isSel=d===selDay;let cls='cd '+st;if(isToday)cls+=' today';if(isSel)cls='cd sel';const click=(st==='avail'||st==='advance')?'onclick="pickDay('+d+',\''+st+'\')"':'';html+='<div class="'+cls+'" '+click+'>'+d+'</div>';}document.getElementById('calGrid').innerHTML=html;}
function pickDay(d,st){selDay=d;selTime=null;renderCal();const months=['January','February','March','April','May','June','July','August','September','October','November','December'];const cap=dayCapacity(d,curM,curY);const h=artistHours(curArtist);document.getElementById('selDateLbl').textContent=d+' '+months[curM]+' '+curY+' · '+cap.label+' · '+cap.remaining+' of '+cap.capacity+' daily seats left · '+h.label;const slots=getSlots(d);document.getElementById('timeSlots').innerHTML=slots.map(s=>'<button type="button" class="ts" onclick="pickTime(this,\''+s.time+'\')">'+s.time+'<span class="slot-meta">Available</span></button>').join('');document.getElementById('timeSection').style.display='block';updateSum();}
function pickTime(el,t){document.querySelectorAll('.ts').forEach(s=>s.classList.remove('tsel'));el.classList.add('tsel');selTime=t;updateSum();}
function updateSum(){const months=['January','February','March','April','May','June','July','August','September','October','November','December'];const s=document.getElementById('bookSum');if(!selSvc&&!selDay){s.innerHTML='Select a service and date to continue.';return;}const price=Math.max(2000,(selSvc||'').length*180);const dep=Math.round(price*0.5/100)*100;s.innerHTML='<strong>Artist</strong> '+curArtist+'<br><strong>Service</strong> '+(selSvc||'Not selected')+'<br><strong>Date</strong> '+(selDay?selDay+' '+months[curM]+' '+curY:'Not selected')+'<br><strong>Time</strong> '+(selTime||'Not selected')+'<br><strong>Total price</strong> Rs '+price.toLocaleString('en-IN')+'<br><strong>Deposit now 50%</strong> Rs '+dep.toLocaleString('en-IN');}
const UPI_VPA='glowme@upi';
function confirmBook(){
  if(!selSvc||!selDay||!selTime){showToast('Please select a service, date, and time slot.','error');return;}
  openUpiPay('studio','Studio: '+curArtist+' · Sector 17, Chandigarh');
}
function closeUpiOverlay(){const e=document.getElementById('gmUpiOv');if(e)e.remove();}
function openUpiPay(mode,address){
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr=selDay+' '+months[curM]+' '+curY;
  const price=Math.max(2000,(selSvc||'').length*180);
  let plan='deposit';
  function amount(){return plan==='full'?price:Math.round(price*0.5/100)*100;}
  const tn='GlowMe-'+(curArtist||'').replace(/\s+/g,'')+'-'+selDay+months[curM].slice(0,3);
  function upiLink(app){
    const amt=(amount()).toFixed(2);
    const base='pa='+encodeURIComponent(UPI_VPA)+'&pn=GlowMe&am='+amt+'&cu=INR&tn='+encodeURIComponent(tn);
    if(app==='gpay')return 'tez://upi/pay?'+base;
    if(app==='phonepe')return 'phonepe://pay?'+base;
    if(app==='paytm')return 'paytmmp://pay?'+base;
    return 'upi://pay?'+base;
  }
  function qrUrl(){
    return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='+encodeURIComponent(upiLink('any'));
  }
  const wrap=document.createElement('div');
  wrap.className='modal-overlay';wrap.id='gmUpiOv';wrap.style.display='flex';wrap.style.zIndex='99999';
  function html(){
    return '<div class="modal" style="max-width:560px"><div class="modal-head"><div><div class="modal-artist-name">Secure UPI payment</div><div class="modal-artist-sub">Step 2 of 2 · Pay to confirm</div></div><button class="modal-close" type="button" data-x>x</button></div><div class="modal-body"><div style="background:#0d0d0d;border:1px solid #2a2a2a;border-radius:10px;padding:12px;font-size:13px;color:#ccc;margin-bottom:14px"><strong style="color:#C9A96E">'+selSvc+'</strong> with '+curArtist+'<br>'+dateStr+' · '+selTime+'<br>'+('🏢 Studio')+'<br><span style="font-size:11px;color:#888">'+address+'</span></div><div style="display:flex;gap:8px;margin-bottom:14px"><button type="button" data-plan="deposit" class="ts '+(plan==='deposit'?'tsel':'')+'" style="flex:1">50% deposit<br><span class="slot-meta">₹'+(Math.round(price*0.5/100)*100).toLocaleString("en-IN")+'</span></button><button type="button" data-plan="full" class="ts '+(plan==='full'?'tsel':'')+'" style="flex:1">Full payment<br><span class="slot-meta">₹'+price.toLocaleString("en-IN")+'</span></button></div><div style="display:grid;grid-template-columns:1fr 240px;gap:18px;align-items:start"><div><div style="font-size:12px;color:#888;margin-bottom:8px">Pay with UPI app</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><a href="'+upiLink('gpay')+'" class="ts" style="text-align:center">🟢 GPay</a><a href="'+upiLink('phonepe')+'" class="ts" style="text-align:center">🟣 PhonePe</a><a href="'+upiLink('paytm')+'" class="ts" style="text-align:center">🔵 Paytm</a><a href="'+upiLink('any')+'" class="ts" style="text-align:center">Other UPI</a></div><div style="margin-top:14px;font-size:12px;color:#888">Or pay to VPA</div><div style="display:flex;gap:6px;margin-top:4px"><input readonly value="'+UPI_VPA+'" style="flex:1;padding:8px;border:1px solid #333;background:#0a0a0a;color:#C9A96E;border-radius:6px;font-family:monospace"><button type="button" data-copy class="cal-btn">Copy</button></div></div><div style="text-align:center"><div style="background:#fff;padding:8px;border-radius:8px;display:inline-block"><img src="'+qrUrl()+'" alt="UPI QR" style="display:block;width:220px;height:220px"></div><div style="font-size:11px;color:#888;margin-top:6px">Scan with any UPI app</div></div></div><div style="margin-top:18px;display:flex;gap:8px"><button type="button" data-paid class="confirm-btn" style="flex:1">✓ I have paid ₹'+amount().toLocaleString("en-IN")+'</button></div><div style="font-size:11px;color:#666;margin-top:8px;text-align:center">Booking is confirmed only after we verify the UPI transaction.</div></div></div>';
  }
  wrap.innerHTML=html();
  document.body.appendChild(wrap);
  function bind(){
    wrap.querySelector('[data-x]').addEventListener('click',()=>wrap.remove());
    wrap.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{plan=b.dataset.plan;wrap.innerHTML=html();bind();}));
    const cp=wrap.querySelector('[data-copy]');
    if(cp)cp.addEventListener('click',()=>{navigator.clipboard?.writeText(UPI_VPA);showToast('VPA copied');});
    wrap.querySelector('[data-paid]').addEventListener('click',()=>{
      const paid=amount();
      const remaining=price-paid;
      const ownerMsg='🌸 *New GlowMe Booking!*\n\n👤 Artist: '+curArtist+'\n💄 Service: '+selSvc+'\n📅 '+dateStr+' · '+selTime+'\n📍 '+(mode==='home'?'Home: ':'Studio: ')+address+'\n💳 Paid (UPI): ₹'+paid.toLocaleString('en-IN')+(remaining>0?'\n🧾 Balance after service: ₹'+remaining.toLocaleString('en-IN'):'\n✓ Paid in full');
      wrap.remove();
      closeCal();
      showToast('✓ Booking confirmed! Opening WhatsApp...');
      setTimeout(()=>window.open('https://wa.me/'+CONFIG.OWNER_WHATSAPP+'?text='+encodeURIComponent(ownerMsg),'_blank'),400);
    });
  }
  bind();
}

let chatOpen=false,chatHist=[],isSend=false;
function toggleChat(){chatOpen=!chatOpen;document.getElementById('chat-window').classList.toggle('open',chatOpen);if(chatOpen&&chatHist.length===0){setTimeout(()=>addAI('Welcome to GlowMe. I am your personal beauty concierge here to help you find the perfect artist, check availability, or answer any questions. How may I assist you today?'),400);}if(chatOpen)setTimeout(()=>document.getElementById('chat-input').focus(),350);}
function qa(t){document.getElementById('chat-input').value=t;sendMsg();}
async function sendMsg(){if(isSend)return;const input=document.getElementById('chat-input');const text=input.value.trim();if(!text)return;input.value='';input.style.height='auto';addUser(text);const qr=document.getElementById('chatQR');if(qr)qr.style.display='none';isSend=true;document.getElementById('chat-send').disabled=true;chatHist.push({role:'user',content:text});const tid=showTyping();try{const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,system:'You are the GlowMe AI concierge for Indias premium beauty marketplace. Be warm, elegant and concise. Help users find artists, book appointments, learn about services.',messages:chatHist})});removeTyping(tid);if(!res.ok)throw new Error();const data=await res.json();const reply=data.content?.[0]?.text||fallback(text);chatHist.push({role:'assistant',content:reply});addAI(reply);}catch{removeTyping(tid);const r=fallback(text);chatHist.push({role:'assistant',content:r});addAI(r);}isSend=false;document.getElementById('chat-send').disabled=false;}
function fallback(t){const l=t.toLowerCase();if(l.includes('bridal')||l.includes('wedding'))return'For bridal makeup, our finest artists include Priya Mehta from Rs 3,500 in Chandigarh and Anjali Sharma from Rs 5,000 in Delhi both rated 5 stars. Advance booking up to 12 months available. Shall I help you check their calendar?';if(l.includes('nail')||l.includes('extension'))return'Our nail specialists offer acrylic and gel extensions from Rs 1,000, 3D nail art, ombre nails, and full bridal nail packages. Ritika Bose and Deepa Verma are our top rated nail artists. Would you like to view their availability?';if(l.includes('salon'))return'We partner with four curated salons Blush and Co in Chandigarh, The Bridal Atelier in Mohali, Gloss Nail Studio in Chandigarh, and Radiance Beauty Bar in Panchkula. Each offers a complete range of services. Which area suits you?';if(l.includes('book')||l.includes('how'))return'Booking is effortless. Browse artists, check their live calendar, select your date and time, and pay a 30% deposit to confirm. Balance is collected after your appointment. Shall I guide you to an artist?';if(l.includes('price')||l.includes('cost'))return'Services start from Rs 2,200 for party makeup, Rs 3,500 for bridal, and Rs 1,000 for nail extensions. You pay just 30% to secure your booking with the balance due after. What service interests you?';if(l.includes('cancel'))return'We offer a full refund for cancellations 48 hours before your appointment, 50% for 24 to 48 hours prior, and no refund within 24 hours. One complimentary reschedule is available per booking.';return'Thank you for your enquiry. For personalised assistance our team is available at hello@glowme.in and responds within 2 hours. Is there a specific service or artist I can help you find?';}
function addUser(t){const m=document.createElement('div');m.className='msg user';m.innerHTML='<div class="msg-bub">'+esc(t)+'</div><div class="msg-av u">U</div>';document.getElementById('chatMsgs').appendChild(m);scrollB();}
function addAI(t){const m=document.createElement('div');m.className='msg ai';const f=t.replace(/\n/g,'<br>');m.innerHTML='<div class="msg-av ai">G</div><div class="msg-bub">'+f+'</div>';document.getElementById('chatMsgs').appendChild(m);scrollB();}
function showTyping(){const m=document.createElement('div');m.className='msg ai';const id='t'+Date.now();m.id=id;m.innerHTML='<div class="msg-av ai">G</div><div class="typing"><span></span><span></span><span></span></div>';document.getElementById('chatMsgs').appendChild(m);scrollB();return id;}
function removeTyping(id){const el=document.getElementById(id);if(el)el.remove();}
function scrollB(){const m=document.getElementById('chatMsgs');setTimeout(()=>{m.scrollTop=m.scrollHeight;},50);}
function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function ck(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}
function ar(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,80)+'px';}



/* LOOK RECOMMENDER - INDIA + WORLDWIDE */
const INDIAN_LOOKS = [
  {id:'punjabi-bridal',name:'Punjabi Bridal',sub:'North India - Heavy glam',region:'punjabi',img:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80&fit=crop',desc:'Bold red lips, heavy kohl eyes, gold-complementing base, dramatic contouring.',tones:['medium','tan','light'],artists:[{name:'Priya Mehta',loc:'Chandigarh',price:'Rs 8,500',spec:'Punjabi bridal'},{name:'Anjali Sharma',loc:'Delhi',price:'Rs 12,000',spec:'Full bridal'}]},
  {id:'punjabi-party',name:'Punjabi Party Glam',sub:'North India - Full glam',region:'punjabi',img:'https://images.unsplash.com/photo-1470259078422-826894b933aa?w=400&q=80&fit=crop',desc:'Smoky eyes, bold lip, highlighted cheekbones for Sangeet and festive nights.',tones:['all'],artists:[{name:'Simran Kaur',loc:'Mohali',price:'Rs 3,500',spec:'Party glam'},{name:'Priya Mehta',loc:'Chandigarh',price:'Rs 3,800',spec:'Glam'}]},
  {id:'bengali-bride',name:'Bengali Bride',sub:'East India - Kajal and sindoor',region:'bengali',img:'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80&fit=crop&crop=face',desc:'Heavy kajal, sindoor, luminous skin. Red and white aesthetic.',tones:['medium','tan','fair'],artists:[{name:'Anjali Sharma',loc:'Delhi',price:'Rs 9,000',spec:'Traditional'},{name:'Priya Mehta',loc:'Chandigarh',price:'Rs 7,500',spec:'Bridal'}]},
  {id:'mehendi-look',name:'Mehendi Glow',sub:'All India - Soft dewy',region:'punjabi',img:'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&q=80&fit=crop',desc:'Fresh dewy skin, soft peach tones, natural brows.',tones:['fair','light','medium'],artists:[{name:'Simran Kaur',loc:'Mohali',price:'Rs 2,800',spec:'Natural'},{name:'Neha Patel',loc:'Panchkula',price:'Rs 2,500',spec:'Bridal prep'}]},
  {id:'south-bridal',name:'South Indian Bride',sub:'South India - Temple jewellery',region:'south',img:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&fit=crop&crop=face',desc:'Kohl-lined eyes, vermillion lips, flawless skin with silk saree.',tones:['tan','medium','deep'],artists:[{name:'Anjali Sharma',loc:'Delhi',price:'Rs 10,000',spec:'South Indian'},{name:'Priya Mehta',loc:'Chandigarh',price:'Rs 8,000',spec:'Traditional'}]},
  {id:'kerala-look',name:'Kerala Natural',sub:'South India - Minimal glow',region:'south',img:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&fit=crop&crop=face',desc:'Minimal fresh look, glowing skin, natural lips, defined eyes.',tones:['deep','tan','medium'],artists:[{name:'Simran Kaur',loc:'Mohali',price:'Rs 3,200',spec:'Natural'},{name:'Kavya Nair',loc:'Chandigarh',price:'Rs 3,000',spec:'Kerala-inspired'}]},
  {id:'rajasthani-bride',name:'Rajasthani Royal',sub:'Rajasthan - Vibrant bold',region:'rajasthani',img:'https://images.unsplash.com/photo-1502767089025-6572583495f9?w=400&q=80&fit=crop&crop=face',desc:'Extended liner, deep pink lips, bold brows with vivid lehenga.',tones:['medium','tan','deep'],artists:[{name:'Anjali Sharma',loc:'Delhi',price:'Rs 11,000',spec:'Royal Indian'},{name:'Priya Mehta',loc:'Chandigarh',price:'Rs 8,500',spec:'Vibrant bridal'}]},
  {id:'gujarati-bride',name:'Gujarati Garba Glam',sub:'West India - Festive warm',region:'west',img:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80&fit=crop&crop=face',desc:'Warm golden tones, terracotta lips, champagne eye shadow.',tones:['medium','light','tan'],artists:[{name:'Neha Patel',loc:'Panchkula',price:'Rs 3,500',spec:'Festive'},{name:'Anjali Sharma',loc:'Delhi',price:'Rs 9,000',spec:'Gujarati bridal'}]},
  {id:'korean-look',name:'Korean Glass Skin',sub:'K-Beauty - Dewy minimal',region:'kpop',img:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80&fit=crop&crop=face',desc:'Ultra dewy skin, lip tint, feathered brows, glossy base.',tones:['fair','light','medium'],artists:[{name:'Simran Kaur',loc:'Mohali',price:'Rs 2,800',spec:'K-beauty'},{name:'Kavya Nair',loc:'Chandigarh',price:'Rs 3,000',spec:'Korean styles'}]},
  {id:'kpop-idol',name:'K-Pop Idol',sub:'K-Beauty - Gradient lips',region:'kpop',img:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&fit=crop&crop=face',desc:'Gradient ombre lips, puppy eyeliner, fluffy brows, pearlescent skin.',tones:['fair','light','medium'],artists:[{name:'Simran Kaur',loc:'Mohali',price:'Rs 3,000',spec:'K-Pop beauty'},{name:'Kavya Nair',loc:'Chandigarh',price:'Rs 3,200',spec:'Korean'}]},
  {id:'hd-airbrush',name:'HD Airbrush',sub:'Modern - Camera ready',region:'modern',img:'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&q=80&fit=crop',desc:'Flawless airbrushed finish, sweat-proof, perfect for photography.',tones:['all'],artists:[{name:'Priya Mehta',loc:'Chandigarh',price:'Rs 4,500',spec:'HD airbrush'},{name:'Anjali Sharma',loc:'Delhi',price:'Rs 6,000',spec:'Editorial'}]},
  {id:'editorial-bold',name:'Editorial Bold',sub:'Modern - Fashion forward',region:'modern',img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80&fit=crop',desc:'Graphic liner, statement lip, bold cut crease for fashion shoots.',tones:['all'],artists:[{name:'Anjali Sharma',loc:'Delhi',price:'Rs 7,000',spec:'Editorial'},{name:'Priya Mehta',loc:'Chandigarh',price:'Rs 5,500',spec:'Bold looks'}]},
  {id:'western-glam',name:'Hollywood Glam',sub:'Western - Old Hollywood',region:'western',img:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80&fit=crop&crop=face',desc:'Classic red lip, winged liner, sculpted cheekbones, matte skin.',tones:['all'],artists:[{name:'Anjali Sharma',loc:'Delhi',price:'Rs 6,500',spec:'Western glam'},{name:'Riya Batra',loc:'Delhi',price:'Rs 5,000',spec:'Hollywood'}]},
  {id:'natural-western',name:'No-Makeup Makeup',sub:'Western - Effortless natural',region:'western',img:'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80&fit=crop&crop=face',desc:'Skin-like foundation, barely-there blush, glossy lips.',tones:['fair','light','medium'],artists:[{name:'Simran Kaur',loc:'Mohali',price:'Rs 2,500',spec:'Natural'},{name:'Kavya Nair',loc:'Chandigarh',price:'Rs 2,800',spec:'Minimal'}]},
  {id:'arabic-bridal',name:'Arabic Bridal',sub:'Middle East - Dramatic kohl',region:'arabic',img:'https://images.unsplash.com/photo-1502767089025-6572583495f9?w=400&q=80&fit=crop&crop=face',desc:'Intense kohl-rimmed eyes, flawless matte base, nude or deep berry lip.',tones:['medium','tan','deep'],artists:[{name:'Anjali Sharma',loc:'Delhi',price:'Rs 9,500',spec:'Arabic looks'},{name:'Priya Mehta',loc:'Chandigarh',price:'Rs 7,500',spec:'Middle Eastern'}]},
  {id:'arabic-everyday',name:'Arabic Everyday',sub:'Middle East - Defined eyes',region:'arabic',img:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80&fit=crop',desc:'Defined brows, subtle smoky eye, nude lips, luminous skin.',tones:['medium','tan','deep','rich'],artists:[{name:'Simran Kaur',loc:'Mohali',price:'Rs 3,200',spec:'Arabic looks'},{name:'Neha Patel',loc:'Panchkula',price:'Rs 2,800',spec:'Defined eye'}]},
];

const toneData={
  fair:{color:'#FDDBB4',name:'Fair',desc:'Light complexion, pink or yellow undertones'},
  light:{color:'#F2C18D',name:'Light Wheatish',desc:'Warm golden tone, common in North India'},
  medium:{color:'#E0A07A',name:'Medium Wheatish',desc:'Most common Indian skin, warm brown'},
  tan:{color:'#C47E55',name:'Tan / Dusky',desc:'Golden-brown, richly pigmented'},
  deep:{color:'#8D5524',name:'Deep Brown',desc:'Deep warm brown, South Indian complexion'},
  rich:{color:'#4A2912',name:'Rich / Dark',desc:'Very deep, richly pigmented, beautiful'}
};

let selectedLookId=null,lookTone='medium',lookSelfieData=null;

/* UPLOAD + CAMERA — both use same handler */
function lookSelfieUploaded(inp){
  const file=inp.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    lookSelfieData=e.target.result;
    document.getElementById('look-selfie-preview').src=e.target.result;
    document.getElementById('look-upload-zone').style.display='block';
    document.getElementById('look-no-photo').style.display='none';
    document.getElementById('tone-detected-label').textContent='Analysing skin tone...';
    autoDetectSkinTone();
  };
  reader.readAsDataURL(file);
}

/* AUTO DETECT SKIN TONE */
async function autoDetectSkinTone(){
  if(!lookSelfieData)return;
  try{
    const base64=lookSelfieData.split(',')[1];
    const mtype=lookSelfieData.split(';')[0].split(':')[1];
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':window.GLOWME_API_KEY||''},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',max_tokens:100,
        system:'Analyse the photo skin tone. Reply ONLY with JSON: {"tone":"medium"} where tone is one of: fair,light,medium,tan,deep,rich',
        messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:mtype,data:base64}},{type:'text',text:'Detect skin tone. Reply only JSON.'}]}]
      })
    });
    const d=await res.json();
    const txt=d.content?.[0]?.text||'{}';
    const parsed=JSON.parse(txt.match(/\{.*?\}/s)?.[0]||'{"tone":"medium"}');
    if(parsed.tone&&toneData[parsed.tone]){lookTone=parsed.tone;showDetectedTone(parsed.tone);}
    else{document.getElementById('tone-detected-label').textContent='Select tone manually below';}
  }catch(e){
    document.getElementById('tone-detected-label').textContent='Select tone manually below';
  }
}

function showDetectedTone(tone){
  const td=toneData[tone];
  document.getElementById('skin-tone-result-box').style.display='block';
  document.getElementById('detected-swatch').style.background=td.color;
  document.getElementById('detected-tone-name').textContent=td.name;
  document.getElementById('detected-tone-desc').textContent=td.desc;
  document.getElementById('look-tone-label').textContent='AI detected: '+td.name;
  document.getElementById('tone-detected-label').textContent='Skin tone: '+td.name;
  const toneOrder=['fair','light','medium','tan','deep','rich'];
  document.querySelectorAll('.tone-swatch').forEach((s,i)=>s.classList.toggle('sel',toneOrder[i]===tone));
}

function selLookTone(el,tone,color,name,desc){
  document.querySelectorAll('.tone-swatch').forEach(s=>s.classList.remove('sel'));
  el.classList.add('sel');lookTone=tone;
  document.getElementById('skin-tone-result-box').style.display='block';
  document.getElementById('detected-swatch').style.background=color;
  document.getElementById('detected-tone-name').textContent=name;
  document.getElementById('detected-tone-desc').textContent=desc;
  document.getElementById('look-tone-label').textContent='Selected: '+name;
}

/* GALLERY */
function renderLookGallery(filter){
  const looks=filter==='all'?INDIAN_LOOKS:INDIAN_LOOKS.filter(l=>l.region===filter);
  const g=document.getElementById('look-gallery');
  g.innerHTML=looks.map(l=>`<div class="look-tile" id="tile-${l.id}" onclick="selectLook('${l.id}')"><img src="${l.img}" alt="${l.name}" loading="lazy"><div class="look-tile-label"><span class="look-tile-name">${l.name}</span><span class="look-tile-sub">${l.sub}</span></div><div class="look-tile-check">&#10003;</div></div>`).join('');
}
function filterLooks(region,btn){
  document.querySelectorAll('.rtab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderLookGallery(region);
}
function selectLook(id){
  document.querySelectorAll('.look-tile').forEach(t=>t.classList.remove('sel'));
  const tile=document.getElementById('tile-'+id);
  if(tile)tile.classList.add('sel');
  selectedLookId=id;
}

/* STEP NAV */
function goLookStep(n){
  [1,2,3].forEach(i=>{
    document.getElementById('lpane-'+i).classList.toggle('active',i===n);
    const s=document.getElementById('lstep-'+i);
    s.classList.toggle('active',i===n);
    s.classList.toggle('done',i<n);
  });
  if(n===2&&!document.getElementById('look-gallery').children.length)renderLookGallery('all');
}

/* MAIN AI GENERATION */
async function runLookAI(){
  if(!selectedLookId){alert('Please select a look first.');return;}
  const look=INDIAN_LOOKS.find(l=>l.id===selectedLookId);
  if(!look)return;
  const occ=document.querySelector('#look-occ .sel')?.textContent||'any occasion';
  const typingEl=document.getElementById('look-typing');
  const btn=document.getElementById('analyse-btn');
  typingEl.style.display='flex';
  if(btn){btn.disabled=true;btn.textContent='Generating...';}
  goLookStep(3);

  const systemPrompt=`You are GlowMe AI beauty stylist expert in Indian and international makeup. You deeply understand all Indian skin tones. Format response with these exact sections:
MATCH SCORE: [X/5] - [why]
WHY IT SUITS YOU: [skin tone specific]
HOW IT WILL LOOK: [on their specific tone]
BEST PRODUCT SHADES: [3 specific shades]
PRO TIP: [one expert tip]
Under 160 words total.`;

  let msgs=[];
  if(lookSelfieData){
    const base64=lookSelfieData.split(',')[1];
    const mtype=lookSelfieData.split(';')[0].split(':')[1];
    msgs=[{role:'user',content:[
      {type:'image',source:{type:'base64',media_type:mtype,data:base64}},
      {type:'text',text:'Client wants the "'+look.name+'" look. Details: '+look.desc+'. Occasion: '+occ+'. Detected skin tone: '+(toneData[lookTone]?.name||lookTone)+'. Analyse their photo and tell them how this look will suit them specifically.'}
    ]}];
  }else{
    msgs=[{role:'user',content:'Client wants "'+look.name+'" look: '+look.desc+'. Skin tone: '+(toneData[lookTone]?.name||'medium Indian')+'. Occasion: '+occ+'. Tell them how this look will work for their skin tone.'}];
  }

  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':window.GLOWME_API_KEY||''},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,system:systemPrompt,messages:msgs})
    });
    const data=await res.json();
    if(data.error)throw new Error(data.error.message);
    const reply=data.content?.[0]?.text;
    typingEl.style.display='none';
    if(btn){btn.disabled=false;btn.textContent='Generate my look';}
    showLookResult(look,reply||lookFallbackResult(look,lookTone,occ));
  }catch(err){
    typingEl.style.display='none';
    if(btn){btn.disabled=false;btn.textContent='Generate my look';}
    showLookResult(look,lookFallbackResult(look,lookTone,occ));
  }
}

function showLookResult(look,aiText){
  document.getElementById('look-result-img').src=look.img;
  document.getElementById('look-result-title').textContent=look.name;
  const stars=(aiText.match(/([1-5])\s*\/\s*5/)||[])[1];
  const r=stars?parseInt(stars):4;
  document.getElementById('look-result-sub').textContent='&#9733;'.repeat(r)+'&#9734;'.repeat(5-r)+' - '+(toneData[lookTone]?.name||'Your skin')+' - '+look.sub;
  document.getElementById('look-why-text').innerHTML=aiText.replace(/\n/g,'<br>');
  document.getElementById('look-artist-recs').innerHTML=look.artists.map(a=>`<div class="lar"><div class="lar-name">${a.name}</div><div class="lar-detail">${a.loc} - ${a.spec}</div><div class="lar-price">${a.price}</div><button class="lar-book" onclick="openCal('${a.name}','Bridal')">Book this artist</button></div>`).join('');
  document.getElementById('look-ai-result').style.display='block';
}

function lookFallbackResult(look,tone,occ){
  const td=toneData[tone]||toneData.medium;
  const good=look.tones?.includes(tone)||look.tones?.includes('all');
  return'MATCH SCORE: '+(good?'4':'3')+'/5 - '+(good?'This look complements your skin tone beautifully.':'With right adjustments this look can work for you.')+'\n\nWHY IT SUITS YOU: The '+td.name+' complexion has '+(tone==='fair'||tone==='light'?'delicate undertones this look enhances with soft pigments.':'warm rich undertones that make bold pigments truly pop.')+'\n\nHOW IT WILL LOOK: On '+td.name+' skin, this appears '+(tone==='fair'||tone==='light'?'luminous and refined.':'vibrant and rich, photographing beautifully.')+'\n\nBEST PRODUCT SHADES: Foundation - '+(tone==='fair'?'NC15-NC20':tone==='light'?'NC25-NC30':tone==='medium'?'NC35-NC40':tone==='tan'?'NC42-NC45':'NC50-NC55')+'. Lip - '+(tone==='fair'||tone==='light'?'Rose-pink or berry':'Terracotta or deep red')+'. Eyes - '+(tone==='deep'||tone==='rich'?'Bronze, copper, gold':'Champagne, taupe, brown')+'.\n\nPRO TIP: '+(tone==='fair'||tone==='light'?'Use colour-correcting primer so makeup lasts without oxidising.':'Apply golden highlighter on high points - catches light beautifully on your skin.');
}



/* ══════════════════════════════════════════════
   AI FEATURE JAVASCRIPT
   ══════════════════════════════════════════════ */

// ── MODAL OPEN/CLOSE ──
function openAI(key){
  if(key==='chat'){toggleChat();return;}
  document.getElementById('modal-'+key).classList.add('open');
  document.body.style.overflow='hidden';
}
function closeAI(key,e){
  if(e&&e.target!==document.getElementById('modal-'+key))return;
  document.getElementById('modal-'+key).classList.remove('open');
  document.body.style.overflow='';
}

// ── CHIP SELECTION ──
function selChip(btn,group){
  document.querySelectorAll('#'+group+' .ai-chip').forEach(c=>c.classList.remove('sel'));
  btn.classList.add('sel');
}
function selChipMulti(btn){btn.classList.toggle('sel');}

// ── AI CALL HELPER ──
async function callAI(prompt){
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,
        system:'You are GlowMe AI — India\'s luxury beauty marketplace assistant. Give concise, direct, useful answers. Use line breaks for readability. Mention specific artist names from GlowMe when relevant: Priya Mehta (bridal/airbrush, Chandigarh, Rs 3500+), Simran Kaur (party/natural, Mohali, Rs 2800+), Anjali Sharma (bridal/editorial, Delhi, Rs 5000+), Neha Patel (party/airbrush, Panchkula, Rs 2200+), Ritika Bose (nail extensions, Chandigarh, Rs 1200+), Deepa Verma (nail art, Mohali, Rs 800+). Keep responses under 150 words.',
        messages:[{role:'user',content:prompt}]})
    });
    if(!res.ok)throw new Error();
    const d=await res.json();
    return d.content?.[0]?.text||null;
  }catch{return null;}
}

function showTypingAI(id){document.getElementById(id).classList.add('show');}
function hideTypingAI(id){document.getElementById(id).classList.remove('show');}
function showResultAI(id,html){const el=document.getElementById(id);el.innerHTML=html;el.classList.add('show');}

// ── 3. BOOKING CONFIRMATION ──
async function runConfirmAI(){
  const svc=document.querySelector('#conf-svc .sel')?.textContent;
  if(!svc){alert('Please select a service.');return;}
  showTypingAI('conf-typing');
  const prompt=`Write a personalised GlowMe booking confirmation prep guide for a client who booked: ${svc}. Include: what to do before the appointment (skin prep, hair, clothing tips), what to bring, and what to expect. Make it practical and friendly. Under 120 words.`;
  const reply=await callAI(prompt)||confFallback(svc);
  hideTypingAI('conf-typing');
  showResultAI('conf-result','<strong>Your GlowMe prep guide for '+svc+':</strong><br><br>'+reply.replace(/\n/g,'<br>'));
}
function confFallback(svc){
  const map={'Bridal makeup':'Come with a freshly cleansed, moisturised face. Avoid heavy skincare the night before. Wear a front-opening top. Bring your dupatta/lehenga for colour matching. Arrive 15 min early.','Nail extensions':'Remove all old nail polish before arriving. Trim your natural nails short. Avoid moisturising hands on the day. Bring inspiration photos if you have a design in mind.','HD airbrush':'Clean face, no makeup. Hydrate well the night before. Avoid exfoliating the same day. Wear a button-down shirt. Airbrush lasts longer on primed skin.'};
  return map[svc]||'Come with a clean face, no makeup. Wear comfortable clothing with easy neckline access. Bring reference photos of looks you like. Arrive 10 minutes early.';
}

// ── 4. REVIEW SUMMARISER ──
async function runReviewAI(){
  const artist=document.getElementById('rev-artist').value;
  if(!artist){alert('Please select an artist.');return;}
  showTypingAI('rev-typing');
  const prompt=`Write a 2-3 line AI summary of client reviews for GlowMe artist: ${artist}. Base it on what would be realistic for their speciality. Highlight what clients consistently praise. Make it specific and credible. Under 60 words.`;
  const reply=await callAI(prompt)||revFallback(artist);
  hideTypingAI('rev-typing');
  showResultAI('rev-result','<strong>AI Review Summary — '+artist+'</strong><br><br>'+reply.replace(/\n/g,'<br>'));
}
function revFallback(a){const map={'Priya Mehta — Chandigarh':'Clients consistently praise Priya for her flawless bridal airbrush and calm, professional demeanor on wedding days. 94% say they would rebook. Known for her ability to make heavy makeup look natural on camera.','Simran Kaur — Mohali':'Simran is loved for her Korean and natural looks — clients note how well she matches makeup to their skin tone. Popular for pre-wedding shoots and mehendi functions.','Anjali Sharma — Delhi':'Anjali is GlowMe\'s highest-rated artist. Clients say she elevates every look — bridal or editorial. Her attention to detail and product quality consistently draw 5-star reviews.','Ritika Bose — Nail Artist':'Clients rave about Ritika\'s nail extension durability — most report sets lasting 4-5 weeks without chipping. Her 3D designs are noted as the most intricate on the platform.'};return map[a]||'Clients consistently give this artist 5 stars for punctuality, product quality, and the final look. Highly recommended for both bridal and events.';}

// ── 5. NO-SHOW PREDICTOR ──
async function runNoshowAI(){
  const timing=document.querySelector('#ns-time .sel')?.textContent||'';
  const dep=document.querySelector('#ns-dep .sel')?.textContent||'';
  const hist=document.querySelector('#ns-hist .sel')?.textContent||'';
  if(!timing){alert('Please fill in the booking details.');return;}
  showTypingAI('ns-typing');
  const prompt=`A GlowMe artist has a booking: timing is ${timing}, deposit status: ${dep||'unknown'}, client history: ${hist||'unknown'}. Assess the no-show risk level (Low/Medium/High), explain why in 2 lines, and give 1 specific action to reduce the risk. Under 80 words.`;
  const reply=await callAI(prompt)||nsFallback(dep);
  hideTypingAI('ns-typing');
  showResultAI('ns-result',reply.replace(/\n/g,'<br>'));
}
function nsFallback(dep){
  if(dep&&dep.includes('paid'))return'<strong>Risk: Low</strong><br>Deposit paid is the strongest signal of commitment. Send a friendly reminder 2 hours before the appointment with the address and a "See you soon!" message.';
  return'<strong>Risk: Medium–High</strong><br>No deposit collected increases no-show risk significantly. Send a confirmation message now asking the client to confirm they\'re coming. If no response within 2 hours, follow up.';
}

// ── 6. STYLE PROFILE ──
async function runProfileAI(){
  const looks=[...document.querySelectorAll('#sp-looks .sel')].map(c=>c.textContent).join(', ');
  const freq=document.querySelector('#sp-freq .sel')?.textContent||'';
  if(!looks){alert('Please select at least one look preference.');return;}
  showTypingAI('sp-typing');
  const prompt=`Build a GlowMe client style profile. Their preferred looks: ${looks}. Booking frequency: ${freq||'varies'}. Name their style archetype (e.g. "The Dewy Minimalist"), recommend 2 GlowMe artists who match, and suggest the top service to try. Under 100 words.`;
  const reply=await callAI(prompt)||spFallback(looks);
  hideTypingAI('sp-typing');
  showResultAI('sp-result',reply.replace(/\n/g,'<br>'));
}
function spFallback(looks){return`<strong>Your Style Archetype: The Luminous Natural</strong><br><br>Based on your preferences (${looks}), you lean towards looks that enhance your features rather than transform them. We recommend <strong>Simran Kaur</strong> for her Korean glass-skin technique and <strong>Neha Patel</strong> for her signature glow. Your perfect first service: Natural Glow + Dewy Finish Makeup (₹2,200–₹2,800).`;}

// ── 7. SMART PRICING ──
async function runPricingAI(){
  const city=document.getElementById('pr-city').value;
  const svc=document.getElementById('pr-svc').value;
  const price=document.getElementById('pr-price').value;
  if(!city||!svc){alert('Please fill city and service.');return;}
  showTypingAI('pr-typing');
  const prompt=`GlowMe market pricing insight for ${svc} in ${city}. Artist's current price: Rs ${price||'not specified'}. Give: the typical market range on GlowMe for this service in this city, whether the artist is priced competitively, and one specific pricing recommendation. Under 90 words.`;
  const reply=await callAI(prompt)||prFallback(svc,city,price);
  hideTypingAI('pr-typing');
  showResultAI('pr-result',reply.replace(/\n/g,'<br>'));
}
function prFallback(svc,city,price){const ranges={'Bridal makeup':'₹3,500–₹8,000','Party makeup':'₹2,200–₹4,500','HD airbrush':'₹3,000–₹6,000','Nail extensions':'₹1,200–₹2,500','Nail art':'₹800–₹2,000'};const range=ranges[svc]||'₹2,000–₹5,000';const p=parseInt(price)||0;const low=p&&p<2500;return`<strong>Market Range for ${svc} in ${city}: ${range}</strong><br><br>${p?`Your price of ₹${p.toLocaleString('en-IN')} is ${low?'below market — consider increasing by 15–20% to reflect your expertise. Clients associate higher prices with better quality.':'well-positioned for this market.'}`:''} Weekend and bridal season bookings (Oct–Feb) can be priced 20–30% higher.`;}

// ── 8. BRIDAL PLANNER ──
async function runBridalAI(){
  const date=document.getElementById('br-date').value;
  const city=document.getElementById('br-city').value;
  const events=[...document.querySelectorAll('#br-events .sel')].map(c=>c.textContent).join(', ');
  if(!date||!city){alert('Please select wedding date and city.');return;}
  showTypingAI('br-typing');
  const wDate=new Date(date);
  const today=new Date();
  const daysLeft=Math.ceil((wDate-today)/(1000*60*60*24));
  const prompt=`Create a GlowMe bridal beauty timeline. Wedding date: ${date} (${daysLeft} days away). City: ${city}. Events: ${events||'Wedding day'}. List each event with: recommended booking date (working backwards), suggested look/service, estimated GlowMe price. Make it practical and specific to Indian weddings. Under 200 words.`;
  const reply=await callAI(prompt)||brFallback(daysLeft,city,events);
  hideTypingAI('br-typing');
  showResultAI('br-result','<strong>Your Bridal Beauty Timeline — '+city+'</strong><br><br>'+reply.replace(/\n/g,'<br>'));
}
function brFallback(days,city,events){
  return`<strong>Book now</strong> — ${days} days to go!<br><br>Here is your recommended timeline:<br><br>• <strong>Bridal trial</strong> — Book 4–6 weeks before. Test your wedding day look. ₹1,500–₹3,000.<br>• <strong>Pre-bridal facial</strong> — 2 weeks before. Glowing skin prep. ₹800–₹1,800.<br>• <strong>Mehendi makeup</strong> — Fresh, natural look. Book 1 month before. ₹2,500–₹4,000.<br>• <strong>Wedding day glam</strong> — Book now to secure your date. ₹8,000–₹18,000.<br>• <strong>Reception look</strong> — Bold and different from wedding day. ₹3,500–₹7,000.<br><br>Recommendation: Secure your wedding day artist today with a 30% deposit.`;
}

// ── 9. VOICE BOOKING ──
let voiceRec=null,voiceOn=false;
function toggleVoice(){
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){
    showResultAI('voice-result','<strong>Voice booking coming soon!</strong><br>Your browser does not support voice recognition yet. Please use Chrome on desktop. For now, use our chatbot to book in Hindi or English.');
    return;
  }
  if(voiceOn){voiceRec.stop();return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  voiceRec=new SR();
  voiceRec.lang='hi-IN';voiceRec.interimResults=true;voiceRec.maxAlternatives=1;
  document.getElementById('voiceBtn').classList.add('listening');
  document.getElementById('voice-status').textContent='Listening... speak now';
  voiceOn=true;
  voiceRec.onresult=async(e)=>{
    const t=[...e.results].map(r=>r[0].transcript).join('');
    document.getElementById('voice-status').textContent='"'+t+'"';
    if(e.results[e.results.length-1].isFinal){
      voiceRec.stop();
      showResultAI('voice-result','<strong>Understood:</strong> "'+t+'"<br><br>Processing your booking request...');
      const reply=await callAI('A GlowMe client said via voice: "'+t+'". Understand their booking intent and respond as a booking confirmation assistant — confirm what they want (service, city if mentioned) and guide them to the next step. In Hindi or English matching their language. Under 80 words.')||'Samajh liya! Bridal makeup Chandigarh mein book karne ke liye, please above calendar section mein jaayein aur apni date select karein. 30% deposit se booking confirm ho jaayegi.';
      document.getElementById('voice-result').innerHTML='<strong>Understood:</strong> "'+t+'"<br><br>'+reply.replace(/\n/g,'<br>');
    }
  };
  voiceRec.onend=()=>{document.getElementById('voiceBtn').classList.remove('listening');document.getElementById('voice-status').textContent='Click to speak again';voiceOn=false;};
  voiceRec.start();
}

// ── 10. SKIN TONE MATCH ──
let selectedTone='';
function selTone(el,tone){
  document.querySelectorAll('.tone-swatch').forEach(s=>s.classList.remove('sel'));
  el.classList.add('sel');selectedTone=tone;
  const names={fair:'Fair',light:'Light',medium:'Medium',tan:'Tan',deep:'Deep',rich:'Rich'};
  document.getElementById('tone-sel-label').textContent='Selected: '+names[tone]+' skin tone';
}
function previewSkin(inp){
  const file=inp.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{const img=document.getElementById('skin-preview');img.src=e.target.result;img.style.display='block';document.getElementById('skin-upload-txt').style.display='none';};
  reader.readAsDataURL(file);
}
async function runSkinAI(){
  const svc=document.getElementById('skin-svc').value;
  if(!selectedTone){alert('Please select your skin tone.');return;}
  if(!svc){alert('Please select a service.');return;}
  showTypingAI('skin-typing');
  const toneNames={fair:'fair/very light',light:'light wheatish',medium:'medium wheatish',tan:'tan/dusky',deep:'deep brown',rich:'very deep/rich'};
  const prompt=`A GlowMe client has ${toneNames[selectedTone]} Indian skin tone and wants ${svc}. Recommend 2 specific GlowMe artists who are best suited for this skin tone (from: Priya Mehta, Simran Kaur, Anjali Sharma, Neha Patel). Explain why each is a good match for this skin tone. Mention what products or techniques work well. Under 120 words.`;
  const reply=await callAI(prompt)||skinFallback(selectedTone,svc);
  hideTypingAI('skin-typing');
  showResultAI('skin-result',reply.replace(/\n/g,'<br>'));
}
function skinFallback(tone,svc){
  const toneMap={fair:'For fair skin, we recommend <strong>Simran Kaur</strong> — her Korean glass-skin technique and light-handed application are perfect. She specialises in enhancing fair complexions without looking heavy.',light:'For light wheatish skin, <strong>Priya Mehta</strong> is ideal. Her HD airbrush technique is specifically trained for wheatish undertones, giving a flawless camera-ready finish.',medium:'For medium skin, <strong>Neha Patel</strong> is your best match — she excels at warm-toned makeup that complements golden-brown undertones beautifully.',tan:'For tan/dusky skin, <strong>Anjali Sharma</strong> is the expert. Her editorial background means she works confidently with rich pigments that flatter deeper complexions.',deep:'For deep skin tones, <strong>Anjali Sharma</strong> (Delhi) is highly recommended. She understands how to make bold pigments work, avoiding the ashiness many artists struggle with.',rich:'For rich/deep complexions, <strong>Anjali Sharma</strong> is GlowMe\'s top artist. She uses high-coverage, full-pigment products that photograph beautifully on dark skin.'};
  return toneMap[tone]||'Our artists are trained across all Indian skin tones. We recommend booking a consultation to find your perfect match.';}

// ── TREND REPORT ──
function runTrendAI(){
  const city=document.getElementById('tr-city').value;if(!city)return;
  const trends={
    Chandigarh:[['Bridal HD makeup',92],['Nail extensions acrylic',78],['Korean glass skin',71],['Pre-bridal facial',65],['Ombre nails',58]],
    Mohali:[['Party glam',88],['Natural dewy look',75],['Nail art 3D',70],['Airbrush makeup',62],['Bridal trial',55]],
    Panchkula:[['Bridal makeup',85],['Gold facial',72],['Gel nail extensions',68],['Reception look',60],['Threading + wax',52]],
    Delhi:[['Editorial makeup',90],['Bridal package full',84],['Airbrush HD',76],['Nail extensions gel',69],['Korean look',63]],
  };
  const data=trends[city]||trends['Chandigarh'];
  const max=data[0][1];
  document.getElementById('trend-list').innerHTML=data.map(([name,val])=>`<div class="trend-item"><span class="trend-name">${name}</span><div class="trend-bar-wrap"><div class="trend-bar" style="width:${(val/max*100)}%"></div></div><span class="trend-pct">${val}%</span></div>`).join('');
  document.getElementById('trend-insight').innerHTML=`<strong>AI Insight for ${city} this week:</strong><br>${city==='Delhi'?'Editorial and bridal HD demand is surging — artists with international-style portfolio photos are getting 3x more profile views.':city==='Chandigarh'?'Bridal season is driving HD makeup demand. Artists who offer trials are converting 40% more bookings than those who don\'t.':city==='Mohali'?'Korean glass-skin is the fastest growing search in Mohali. Only 2 artists on GlowMe currently offer this — high opportunity.':'Pre-bridal facials are up 65% month-on-month. Clients are bundling skin prep with makeup bookings — consider offering package deals.'}`;
  document.getElementById('trend-result').style.display='block';
}

// ── UPGRADE CHATBOT SYSTEM PROMPT ──
// Override the chatbot system to include look matching intelligence
const _origSendMsg=sendMsg;



/* ── Artist auth (Google sign-in) ── */
function glowmeRenderUser(a){
  glowmeCurrentArtist=a;
  const wrap=document.createElement('span');
  wrap.className='nav-auth-user';
  if(a.picture){
    const img=document.createElement('img');
    img.className='nav-auth-avatar';img.src=a.picture;img.alt='';img.referrerPolicy='no-referrer';
    wrap.appendChild(img);
  }
  const name=document.createElement('span');
  name.className='nav-auth-name';name.textContent=(a.name||'Artist').split(' ')[0];
  wrap.appendChild(name);
  const manage=document.createElement('button');
  manage.className='nav-auth-manage';manage.textContent='My listing';manage.addEventListener('click',openMyListing);
  wrap.appendChild(manage);
  const btn=document.createElement('button');
  btn.className='nav-auth-logout';btn.textContent='Logout';btn.addEventListener('click',glowmeLogout);
  wrap.appendChild(btn);
  return wrap;
}
function glowmeRenderLogin(mount){
  mount.innerHTML='<a class="nav-auth-login" href="/auth">Sign in</a> <a class="nav-auth-login" href="/artist/auth" style="margin-left:8px">Artist Login</a>';
}
async function glowmeInitAuth(){
  const mount=document.getElementById('navAuth');
  if(!mount)return;
  try{
    const sb=window.supabase||(await import('/src/integrations/supabase/client.ts')).supabase;
    const { data } = await sb.auth.getSession();
    mount.innerHTML='';
    if(data&&data.session){
      let isArtist=false;
      try{
        const { data: artist } = await sb.from('artists').select('id').eq('owner_id', data.session.user.id).maybeSingle();
        isArtist=!!artist;
      }catch{}
      const wrap=document.createElement('div');wrap.className='nav-auth';
      const dash=document.createElement('a');dash.className='nav-auth-manage';dash.textContent=isArtist?'Artist Dashboard':'Main Menu';dash.href=isArtist?'/dashboard':'/me';
      const out=document.createElement('button');out.className='nav-auth-logout';out.textContent='Logout';
      out.addEventListener('click',async()=>{await sb.auth.signOut();glowmeInitAuth();});
      wrap.appendChild(dash);wrap.appendChild(out);mount.appendChild(wrap);
    } else {
      glowmeRenderLogin(mount);
    }
  }catch{
    glowmeRenderLogin(mount);
  }
}
(function(){
  // One-time toast after the OAuth redirect, then strip ?auth from the URL.
  const params=new URLSearchParams(window.location.search);
  const auth=params.get('auth');
  if(auth&&typeof showToast==='function'){
    if(auth==='success')showToast('Signed in with Google. Welcome!');
    else if(auth==='error')showToast('Sign-in failed. Please try again.','error');
  }
  if(auth){
    params.delete('auth');
    const qs=params.toString();
    history.replaceState({},'',window.location.pathname+(qs?'?'+qs:'')+window.location.hash);
  }
})();
document.addEventListener('DOMContentLoaded',glowmeInitAuth);

/* ── Listings (data-driven catalog from /api/listings) ── */
/* Note: this seed data is OUR own (trusted), so template-string innerHTML is
   fine here. When artists self-onboard (untrusted input), we'll switch to
   escaped/DOM-built rendering — same trust-boundary rule as the login chip. */
function glowmeStars(rating){
  // Reproduces the original hand-authored stars (4.7 → 4★, ≥4.8 → 5★).
  const full=Math.floor(rating+0.25);
  return '★'.repeat(full)+'☆'.repeat(Math.max(0,5-full));
}
/* Escape for HTML text AND double/single-quoted attribute contexts. Named
   glowmeEsc to avoid colliding with the chat widget's text-only esc(). */
function glowmeEsc(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function glowmeLoc(l){return l.area?glowmeEsc(l.city)+', '+glowmeEsc(l.area):glowmeEsc(l.city);}
function glowmeRatingHTML(l,starColor){
  if(l.rating==null)return '<span class="rating-txt">New</span>'; // artist-created, no reviews yet
  const st=starColor?' style="color:'+starColor+'"':'';
  return '<span class="stars"'+st+'>'+glowmeStars(l.rating)+'</span><span class="rating-txt">'+l.rating.toFixed(1)+' ('+(l.reviews??0)+')</span>';
}

function artistCardHTML(a){
  const name=glowmeEsc(a.name);
  const tags=(a.details.tags||[]).map(t=>'<span class="atag">'+glowmeEsc(t)+'</span>').join('');
  const avail=a.available?'<div class="artist-avail">Available today</div>':'';
  return '<div class="artist-card">'
    +'<div class="artist-img"><img src="'+glowmeEsc(a.image)+'" alt="'+name+'" loading="lazy">'+avail
    +'<button class="artist-save" onclick="toggleSave(this)">♡</button></div>'
    +'<div class="artist-info"><div class="artist-name-row"><span class="artist-name">'+name+'</span>'
    +'<div class="artist-rate">₹'+Number(a.priceFrom||0).toLocaleString('en-IN')+'<span>starting from</span></div></div>'
    +'<div class="artist-loc">📍 '+glowmeLoc(a)+'</div>'
    +'<div class="artist-tags">'+tags+'</div>'
    +'<div class="artist-footer"><div>'+glowmeRatingHTML(a)+'</div>'
    +'<div style="display:flex;gap:8px">'
    +'<button class="book-btn glowme-book" style="font-size:9px;padding:7px 12px" data-name="'+name+'" data-service="'+glowmeEsc(a.bookService)+'">📅 Calendar</button>'
    +'<button class="book-btn" onclick="bookIt(this)">Book</button></div></div></div>';
}

function renderArtists(list){
  const grid=document.getElementById('artistsGrid');
  if(!grid)return;
  grid.innerHTML=list.length
    ? list.map(artistCardHTML).join('')
    : '<p class="listings-empty">No artists in this city yet — check back soon.</p>';
}

function salonCardHTML(s){
  const d=s.details||{};
  const name=glowmeEsc(s.name);
  const chips=(d.chips||[]).map(c=>'<span class="s-chip">'+glowmeEsc(c)+'</span>').join('');
  const rating=s.rating!=null?glowmeStars(s.rating)+' '+s.rating.toFixed(1):'New';
  return '<div class="salon-card">'
    +'<div class="salon-img"><img src="'+glowmeEsc(s.image)+'" alt="'+name+'" loading="lazy"></div>'
    +'<div class="salon-overlay"><div class="salon-type">'+glowmeEsc(d.type||'')+'</div>'
    +'<div class="salon-name">'+name+'</div>'
    +'<div class="salon-loc">📍 '+glowmeLoc(s)+(d.hours?' · '+glowmeEsc(d.hours):'')+'</div>'
    +'<div class="salon-services-row">'+chips+'</div>'
    +'<div class="salon-footer"><div class="salon-rating">'+rating+(d.artistsCount?' · '+glowmeEsc(d.artistsCount)+' artists':'')+'</div>'
    +'<button class="salon-book glowme-book" data-name="'+name+'" data-service="'+glowmeEsc(s.bookService)+'">Book slot</button></div></div></div>';
}

function nailCardHTML(n){
  const d=n.details||{};
  const name=glowmeEsc(n.name);
  const prices=(d.prices||[]).map(p=>'<div class="npl-row"><span class="npl-name">'+glowmeEsc(p.name)+'</span><span class="npl-price">'+glowmeEsc(p.price)+'</span></div>').join('');
  return '<div class="nail-card">'
    +'<div class="nail-img"><img src="'+glowmeEsc(n.image)+'" alt="'+name+'" loading="lazy"><div class="nail-spec">'+glowmeEsc(d.spec||'')+'</div></div>'
    +'<div class="nail-info"><div class="nail-name">'+name+'</div>'
    +'<div class="nail-sub">📍 '+glowmeLoc(n)+(d.serviceMode?' · '+glowmeEsc(d.serviceMode):'')+'</div>'
    +'<div class="nail-price-list">'+prices+'</div>'
    +'<div class="nail-footer"><div>'+glowmeRatingHTML(n,'var(--blush)')+'</div>'
    +'<button class="nail-book-btn glowme-book" data-name="'+name+'" data-service="'+glowmeEsc(n.bookService)+'">Book</button></div></div></div>';
}

function renderSalons(list){
  const grid=document.getElementById('salonsGrid');
  if(!grid)return;
  grid.innerHTML=list.length?list.map(salonCardHTML).join(''):'<p class="listings-empty">No salons in this city yet — check back soon.</p>';
}

function renderNails(list){
  const grid=document.getElementById('nailsScroll');
  if(!grid)return;
  grid.innerHTML=list.length?list.map(nailCardHTML).join(''):'<p class="listings-empty">No nail specialists in this city yet — check back soon.</p>';
}

/* City centroids for "Detect me". Our catalog spans only these cities, so we
   map the browser's GPS coords to the nearest one locally — no geocoding API. */
const GLOWME_CITY_COORDS={
  Chandigarh:[30.7333,76.7794],
  Mohali:[30.7046,76.7179],
  Panchkula:[30.6942,76.8606],
  Delhi:[28.6139,77.2090],
};
let glowmeAllListings=[];
let glowmeCities=[];
let glowmeCity='all';
let glowmeCurrentArtist=null;

function listingsFor(kind){
  return glowmeAllListings.filter(l=>l.kind===kind&&(glowmeCity==='all'||l.city===glowmeCity));
}
function glowmeRenderAll(){
  renderArtists(listingsFor('artist'));
  renderSalons(listingsFor('salon'));
  renderNails(listingsFor('nail'));
}
function buildCityPills(){
  const wrap=document.getElementById('locPills');
  if(!wrap)return;
  wrap.innerHTML=['all',...glowmeCities].map(c=>
    '<button class="loc-pill'+(c===glowmeCity?' active':'')+'" data-city="'+c+'" onclick="glowmeApplyCity(\''+c+'\')">'+(c==='all'?'All cities':c)+'</button>'
  ).join('');
}
function glowmeApplyCity(city){
  glowmeCity=city;
  try{localStorage.setItem('glowme_city',city);}catch{}
  document.querySelectorAll('.loc-pill').forEach(p=>p.classList.toggle('active',p.dataset.city===city));
  glowmeRenderAll();
}
/* Great-circle distance (km) between two lat/lng points. */
function glowmeHaversine(lat1,lng1,lat2,lng2){
  const R=6371,toRad=x=>x*Math.PI/180;
  const dLat=toRad(lat2-lat1),dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
function glowmeNearestCity(lat,lng){
  let best=null,bestD=Infinity;
  for(const city of glowmeCities){
    const c=GLOWME_CITY_COORDS[city];
    if(!c)continue;
    const d=glowmeHaversine(lat,lng,c[0],c[1]);
    if(d<bestD){bestD=d;best=city;}
  }
  return bestD<=150?best:null; // sanity threshold: 150km, else "no city near you"
}
function glowmeDetectCity(){
  const btn=document.getElementById('locDetectBtn');
  if(!navigator.geolocation){showToast('Location isn\'t supported on this browser.','error');return;}
  if(btn){btn.disabled=true;btn.textContent='Detecting…';}
  navigator.geolocation.getCurrentPosition(
    pos=>{
      if(btn){btn.disabled=false;btn.textContent='Detect me';}
      const nearest=glowmeNearestCity(pos.coords.latitude,pos.coords.longitude);
      if(nearest){glowmeApplyCity(nearest);showToast('Showing results near '+nearest+'.');}
      else{showToast('No GlowMe city near you yet — pick one manually.','error');}
    },
    err=>{
      if(btn){btn.disabled=false;btn.textContent='Detect me';}
      showToast(err.code===1?'Location permission denied — pick your city manually.':'Couldn\'t get your location.','error');
    },
    {timeout:8000,maximumAge:600000}
  );
}
async function glowmeLoadListings(){
  try{
    const res=await fetch('/api/listings');
    const contentType=res.headers.get('content-type')||'';
    if(!res.ok||!contentType.includes('application/json'))throw new Error('Listings API unavailable');
    const data=await res.json();
    glowmeAllListings=data.listings||[];
    glowmeCities=data.cities||[];
    let saved=null;try{saved=localStorage.getItem('glowme_city');}catch{}
    glowmeCity=(saved==='all'||glowmeCities.includes(saved))?saved:'all';
    buildCityPills();
    glowmeRenderAll();
  }catch(err){
    // Leave the hardcoded fallback cards in place if the API is unreachable.
    console.warn('Listings load failed; keeping static fallback.',err);
  }
}
/* ── Artist: create/edit my listing ── */
function glowmeSetVal(id,v){const el=document.getElementById(id);if(el)el.value=(v==null?'':v);}
async function openMyListing(){
  const dl=document.getElementById('ml-city-options');
  if(dl)dl.innerHTML=(glowmeCities||[]).map(c=>'<option value="'+glowmeEsc(c)+'"></option>').join('');
  const err=document.getElementById('ml-error');if(err)err.textContent='';
  openAI('mylisting');
  try{
    const res=await fetch('/api/my/listing');
    if(res.status===401){closeAI('mylisting');showToast('Please sign in first.','error');return;}
    const l=(await res.json()).listing;
    glowmeSetVal('ml-name', l?l.name:((glowmeCurrentArtist&&glowmeCurrentArtist.name)||''));
    glowmeSetVal('ml-city', l?l.city:'');
    glowmeSetVal('ml-area', l&&l.area?l.area:'');
    glowmeSetVal('ml-price', l&&l.priceFrom?l.priceFrom:'');
    glowmeSetVal('ml-tags', l&&l.details&&l.details.tags?l.details.tags.join(', '):'');
    glowmeSetVal('ml-image', l&&l.image?l.image:'');
  }catch{}
}
async function saveMyListing(){
  const btn=document.getElementById('ml-save-btn');
  const err=document.getElementById('ml-error');if(err)err.textContent='';
  const payload={
    name:document.getElementById('ml-name').value,
    city:document.getElementById('ml-city').value,
    area:document.getElementById('ml-area').value,
    priceFrom:Number(document.getElementById('ml-price').value),
    tags:document.getElementById('ml-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    image:document.getElementById('ml-image').value,
  };
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    const res=await fetch('/api/my/listing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await res.json();
    if(!res.ok){if(err)err.textContent=data.error||'Could not save.';return;}
    showToast('Your listing is live!');
    closeAI('mylisting');
    await glowmeLoadListings();
    glowmeApplyCity('all'); // show everything so the artist sees their new card
    const sec=document.getElementById('artists');if(sec)sec.scrollIntoView({behavior:'smooth'});
  }catch{
    if(err)err.textContent='Network error — please try again.';
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Save my listing →';}
  }
}

/* Delegated booking: rendered cards carry data-name/data-service instead of an
   inline onclick, so no user data is ever interpolated into executable JS. */
document.addEventListener('click',e=>{
  const b=e.target.closest('.glowme-book');
  if(b)openCal(b.dataset.name,b.dataset.service);
});
document.addEventListener('DOMContentLoaded',glowmeLoadListings);

/* ===== Voice Assistant ===== */
(function(){
  let menuOpen=false, recog=null, currentLang=null;
  window.toggleVoiceMenu=function(){
    menuOpen=!menuOpen;
    const m=document.getElementById('voice-menu');
    if(m) m.classList.toggle('open',menuOpen);
  };
  function setStatus(t){const s=document.getElementById('voiceStatus');if(s)s.textContent=t||'';}
  function setTranscript(t){const s=document.getElementById('voiceTranscript');if(s)s.textContent=t||'';}
  function dispatchToChat(text){
    if(!text)return;
    if(typeof toggleChat==='function'){
      const w=document.getElementById('chat-window');
      if(w && !w.classList.contains('open')) toggleChat();
    }
    const input=document.getElementById('chat-input');
    if(input){ input.value=text; if(typeof sendMsg==='function') sendMsg(); }
  }
  window.startVoice=function(lang){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ setStatus('Voice not supported in this browser'); return; }
    if(recog){ try{recog.stop();}catch{} }
    document.querySelectorAll('.voice-lang').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
    currentLang=lang;
    recog=new SR();
    recog.lang=lang;
    recog.interimResults=true;
    recog.continuous=false;
    setStatus(lang==='hi-IN'?'सुन रहा हूँ…':'Listening…');
    setTranscript('');
    document.getElementById('voice-fab')?.classList.add('listening');
    let finalText='';
    recog.onresult=(e)=>{
      let interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const r=e.results[i];
        if(r.isFinal) finalText+=r[0].transcript;
        else interim+=r[0].transcript;
      }
      setTranscript(finalText+interim);
    };
    recog.onerror=(e)=>{
      document.getElementById('voice-fab')?.classList.remove('listening');
      if(e.error==='not-allowed'||e.error==='service-not-allowed'){
        setStatus('Microphone permission denied');
      } else if(e.error==='no-speech'){
        setStatus('No speech detected. Try again.');
      } else {
        setStatus('Error: '+e.error);
      }
    };
    recog.onend=()=>{
      document.getElementById('voice-fab')?.classList.remove('listening');
      const text=(finalText||document.getElementById('voiceTranscript')?.textContent||'').trim();
      if(text){
        setStatus('Sending…');
        dispatchToChat(text);
        setTimeout(()=>{ setStatus(''); setTranscript(''); window.toggleVoiceMenu(); },600);
      }
    };
    try{ recog.start(); }catch(err){ setStatus('Could not start mic'); document.getElementById('voice-fab')?.classList.remove('listening'); }
  };
  document.addEventListener('click',(e)=>{
    if(!menuOpen) return;
    const menu=document.getElementById('voice-menu');
    const fab=document.getElementById('voice-fab');
    if(menu && !menu.contains(e.target) && fab && !fab.contains(e.target)){
      menuOpen=false; menu.classList.remove('open');
    }
  });
})();

/* ===== Menu filter panel: toggle + apply (sort/filter artist grid) ===== */
(function(){
  function init(){
    var btn=document.getElementById('menuFilterBtn');
    var panel=document.getElementById('menuFilterPanel');
    var apply=document.getElementById('mfpApply');
    var clear=document.getElementById('mfpClear');
    if(!btn||!panel) return;
    btn.addEventListener('click',function(){
      var open=!panel.hasAttribute('hidden');
      if(open){panel.setAttribute('hidden','');btn.setAttribute('aria-expanded','false');}
      else{panel.removeAttribute('hidden');btn.setAttribute('aria-expanded','true');panel.scrollIntoView({behavior:'smooth',block:'start'});}
    });
    // Accordion: only one filter group open at a time
    panel.querySelectorAll('.mfp-group').forEach(function(g){
      g.addEventListener('toggle',function(e){
        if(g.open){
          panel.querySelectorAll('.mfp-group').forEach(function(sib){
            if(sib!==g && sib.open) sib.removeAttribute('open');
          });
        }
      });
    });
    function applyFilters(){
      var grid=document.getElementById('artistsGrid');if(!grid) return;
      var cards=Array.from(grid.querySelectorAll('.artist-card'));
      var price=panel.querySelector('input[name="mfp-price"]:checked');
      var minP=price?+price.dataset.min:0, maxP=price?+price.dataset.max:Infinity;
      var rat=panel.querySelector('input[name="mfp-rating"]:checked');
      var minR=rat?+rat.dataset.min:0;
      var sort=(panel.querySelector('input[name="mfp-sort"]:checked')||{}).value||'popularity';
      cards.forEach(function(c){
        var p=+c.dataset.price*100, r=+c.dataset.rating;
        c.style.display=(p>=minP&&p<=maxP&&r>=minR)?'':'none';
      });
      var visible=cards.filter(function(c){return c.style.display!=='none';});
      visible.sort(function(a,b){
        var pa=+a.dataset.price,pb=+b.dataset.price,ra=+a.dataset.rating,rb=+b.dataset.rating;
        if(sort==='price-asc') return pa-pb;
        if(sort==='price-desc') return pb-pa;
        if(sort==='rating') return rb-ra;
        return 0;
      });
      visible.forEach(function(c){grid.appendChild(c);});
      // close menu so user sees results
      var menu=document.getElementById('mainMenu');
      var trigger=document.getElementById('menuTrigger');
      if(menu&&menu.classList.contains('open')){
        menu.classList.remove('open');menu.setAttribute('aria-hidden','true');
        if(trigger)trigger.setAttribute('aria-expanded','false');
        var bd=document.getElementById('menuBackdrop');if(bd)bd.classList.remove('show');
        document.body.style.overflow='';
      }
      var grid2=document.getElementById('artists');if(grid2)grid2.scrollIntoView({behavior:'smooth'});
    }
    if(apply) apply.addEventListener('click',applyFilters);
    if(clear) clear.addEventListener('click',function(){
      panel.querySelectorAll('input[type=checkbox],input[type=radio]').forEach(function(i){i.checked=false;});
      panel.querySelectorAll('input[type=text],select').forEach(function(i){i.value='';});
      var def=panel.querySelector('input[name="mfp-sort"][value="popularity"]');if(def)def.checked=true;
      var any=panel.querySelector('input[name="mfp-gen"]');if(any)any.checked=true;
      applyFilters();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
