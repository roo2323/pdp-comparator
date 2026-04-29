const $=id=>document.getElementById(id);

// === 공통 셀렉터 ===
const COMMON=[
  {key:"제품명",asis:".product-name h2.name,.product-name h1.name,.product-name .name",tobe:"[class*='product_name_title_area']"},
  {key:"모델번호",asis:"button.sku.copy",tobe:"[class*='button_copy'] > span:first-child"},
  {key:"리뷰 평점",asis:".review-info .scope",tobe:"[class*='review_star_info']"},
  {key:"색상",asis:".sibling-color .text,.opt-colorchip-wrap .chk-wrap-colorchip[title]",tobe:"[class*='color_name'],[class*='options_selected']"},
  {key:"재고/판매상태",asis:".box.non-purchase .title,.soldBanner .head p",tobe:"[class*='product_sell_info_title']"},
  {key:"배송 안내",asis:".delivery-wrap .info-title .title",tobe:"[class*='delivery_info_content'] dt span"},
  {key:"배송 일정",asis:".delivery-wrap .info-text",tobe:"[class*='delivery_info_content'] dd"},
  {key:"플래그/뱃지",asis:".flag-wrap.bar-type .flag",tobe:"[class*='gallery_badge_top'] span,[class*='badge_text'] span",all:true},
];

// === 일시불 전용 ===
const DS_PURCHASE=[
  ...COMMON,
  {key:"판매가",asis:".price-detail-item .price-info .content .price",tobe:"[class*='pricing_info_item'] [class*='price_text']"},
  {key:"정상가",asis:".price-detail-item.type-small-dept small.original",tobe:"[class*='origin_price']"},
  {key:"할인율",asis:".price-detail-item .price-info .content .percent",tobe:"[class*='price_rate']"},
  {key:"최대혜택가",asis:".price-detail-item .price-info .content a.link-text .price,.benefit-info .benefit-price em",tobe:"[class*='pricing_info_max_benefit'] em"},
  {key:"혜택-제휴카드",asis:".buy-benefit-info ul > li",tobe:"[class*='benefits_purchase_list'] > li",textFilter:"제휴카드|카드혜택|캐시백"},
  {key:"혜택-결제일할인",asis:".buy-benefit-info ul > li",tobe:"[class*='benefits_purchase_list'] > li",textFilter:"결제일"},
  {key:"혜택-무이자",asis:".buy-benefit-info ul > li",tobe:"[class*='benefits_purchase_list'] > li",textFilter:"무이자"},
  {key:"혜택-간편결제",asis:".buy-benefit-info ul > li",tobe:"[class*='benefits_purchase_list'] > li",textFilter:"간편결제"},
  {key:"핵심 스펙",asis:"li.lists.laptap-opt .opt-info-list .tit,li.lists.Spec .btn-area span,button.sibling-spec .spec-cont",tobe:"[class*='notebook_options_basic'] dt",all:true},
];

// === 구독 전용 ===
const DS_SUBSCRIPTION=[
  ...COMMON,
  {key:"월 이용요금",asis:".select-info.price-info.total .price-won,.tabs-price",tobe:"[class*='pricing_info_subscribe'] [class*='price_text']"},
  {key:"정상요금",asis:".select-info.price-info.total small.original,.price-detail-item3 .price",tobe:"[class*='pricing_info_subscribe'] [class*='origin_price']"},
  {key:"최대혜택 월요금",asis:".benefit-info .benefit-price em",tobe:"[class*='pricing_info_max_benefit'] em"},
  {key:"계약기간",asis:".subscribe-detail-select dd ul li label,select[title='계약기간 선택'] option:checked",tobe:"[class*='options_button_title']",textFilter:"계약기간",all:true},
  {key:"계약기간(선택값)",asis:".subscribe-detail-select dd ul li input:checked + label,.article-box li .value",tobe:"[class*='options_button'] input[name='subscription-contract-term']:checked + label",textFilter:""},
  {key:"케어서비스 주기",asis:".subscribe-detail-select dd ul li label,select[title='방문주기 선택'] option:checked",tobe:"[class*='options_button_title']",textFilter:"케어서비스|케어십|방문",all:true},
  {key:"서비스타입",asis:".subscribe-detail-select dd ul li label",tobe:"[class*='options_button_title']",textFilter:"서비스타입|케어서비스 유형",all:true},
  {key:"선납할인",asis:".prepay-info,.prepay-discount",tobe:"[class*='pricing_info_pre_pay']"},
  {key:"제휴카드할인",asis:".buy-benefit-info ul > li",tobe:"[class*='pricing_info_benefit'] li",textFilter:"제휴카드|카드|할인",all:true},
  {key:"핵심 스펙",asis:"button.sibling-spec .spec-cont,li.lists.Spec .btn-area span",tobe:"[class*='options_wrap'] [class*='options_selected']"},
  {key:"총요금",asis:".total-price-info .price,.rental-total .price",tobe:"[class*='rental_total_payment']"},
];

// Active selector set
function getDS(){return $('pdpTypeSelect').value==='SUBSCRIPTION'?DS_SUBSCRIPTION:DS_PURCHASE;}

// Post-processing transforms by key
const TX={
  "모델번호": t=>t.replace(/모델명\s*복사|모델번호\s*복사/g,'').trim(),
  "판매가": t=>(t.match(/[\d,]+/)||[t])[0],
  "정상가": t=>(t.match(/[\d,]+/)||[t])[0],
  "할인율": t=>(t.match(/\d+%/)||[t])[0],
  "최대혜택가": t=>(t.match(/[\d,]+/)||[t])[0],
  "월 이용요금": t=>(t.match(/[\d,]+/)||[t])[0],
  "정상요금": t=>(t.match(/[\d,]+/)||[t])[0],
  "최대혜택 월요금": t=>(t.match(/[\d,]+/)||[t])[0],
  "총요금": t=>(t.match(/[\d,]+/)||[t])[0],
  "리뷰 평점": t=>{
    const cleaned=t.replace(/별점|현재|리뷰\s*개수|점|개/g,'').trim();
    const nums=cleaned.match(/[\d.,]+/g);
    if(nums&&nums.length>=2) return nums[0]+'('+nums[1]+')';
    if(nums&&nums.length===1) return nums[0];
    return cleaned;
  },
};

function applyTx(results){
  const out={};
  for(const k in results){
    let v=results[k];
    if(v&&TX[k]) v=TX[k](v);
    out[k]=v;
  }
  return out;
}

let sel=[],sync=true,aR=false,tR=false,cApi=null,pOpen=true,bSF=null,pRes={},rId=0,mobileOn=false,perfData={};

function refreshSel(){
  sel=getDS();
  $('selCfg').value=JSON.stringify(sel,null,2);
}

function init(){
  $('asisUrl').value=localStorage.getItem('pdp-au')||'';
  $('tobeUrl').value=localStorage.getItem('pdp-tu')||'';
  $('modelInput').value=localStorage.getItem('pdp-m')||'';
  $('pdpTypeSelect').value=localStorage.getItem('pdp-type')||'PURCHASE';
  refreshSel();
  bind();
  // Default to mobile mode on first load
  if(!localStorage.getItem('pdp-mobile-init')){
    localStorage.setItem('pdp-mobile-init','1');
    toggleMobile(true);
  } else {
    const cb=$('mobileMode');
    if(cb.checked) toggleMobile(true);
  }
}
function bind(){
  $('loadBtn').onclick=load;
  $('modelInput').onkeydown=e=>{if(e.key==='Enter')load();};
  $('reloadBtn').onclick=()=>{[$('asisF'),$('tobeF')].forEach(f=>{if(f.src)f.src=f.src;});aR=false;tR=false;fs('asis','loading');fs('tobe','loading');};
  $('syncScroll').onchange=e=>{sync=e.target.checked;};
  $('mobileMode').onchange=e=>{toggleMobile(e.target.checked);};
  $('runDiff').onclick=runDiff;
  $('saveCfg').onclick=()=>{try{sel=JSON.parse($('selCfg').value);localStorage.setItem('pdp-sel',JSON.stringify(sel));toast('저장 완료');}catch(e){toast('JSON 오류: '+e.message);}};
  $('panelBtn').onclick=()=>{pOpen=!pOpen;$('sp').classList.toggle('collapsed',!pOpen);$('panelBtn').textContent=pOpen?'\u25B6 비교 패널':'\u25C0 비교 패널';};
  document.querySelectorAll('.ptab').forEach(t=>t.onclick=()=>{
    document.querySelectorAll('.ptab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.pbody').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');$('tab-'+t.dataset.tab).classList.add('active');
  });
  $('asisF').onload=()=>fl('asis');$('tobeF').onload=()=>fl('tobe');
  window.addEventListener('message',onMsg);
  $('asisUrl').onchange=()=>localStorage.setItem('pdp-au',$('asisUrl').value);
  $('tobeUrl').onchange=()=>localStorage.setItem('pdp-tu',$('tobeUrl').value);
  $('pdpTypeSelect').onchange=()=>{localStorage.setItem('pdp-type',$('pdpTypeSelect').value);refreshSel();};
  initDiv();
}
const BASE='https://wwwdev50.lge.co.kr';
const API_BASE='http://localhost:18093';

function load(){
  const m=$('modelInput').value.trim();
  if(!m){toast('모델 ID를 입력해주세요');return;}
  localStorage.setItem('pdp-m',m);
  const pdpType=$('pdpTypeSelect').value;
  localStorage.setItem('pdp-type',pdpType);
  refreshSel();

  // Reset state
  $('dres').innerHTML='';$('dsum').style.display='none';
  $('apiCont').style.display='none';$('apiSt').style.display='block';
  $('apiSt').textContent='로딩 중... API 대기 중';cApi=null;aR=false;tR=false;
  perfData={};$('perfSt').textContent='페이지 로드 완료 후 자동 측정됩니다';$('perfRes').innerHTML='';

  // Fetch URL from purchase-type API
  toast('URL 조회 중...');
  fetch(API_BASE+'/api/v1/models/'+m+'/purchase-type')
    .then(r=>r.json())
    .then(res=>{
      const d=res.data;
      let asisPath,tobeUrl;
      if(pdpType==='SUBSCRIPTION'&&d.subscription&&d.subscription.url){
        asisPath=d.subscription.url;
        // TO-BE 구독: /model?modelId={modelId}&pdpType=SUBSCRIPTION
        tobeUrl=BASE+'/model?modelId='+m+'&pdpType=SUBSCRIPTION';
      } else if(d.purchase&&d.purchase.url){
        asisPath=d.purchase.url;
        // TO-BE 일시불: /model?modelId={modelId}
        tobeUrl=BASE+'/model?modelId='+m;
      } else {
        toast('URL을 찾을 수 없습니다');return;
      }
      const asisUrl=BASE+asisPath;

      // Update URL display
      $('asisUrl').value=asisUrl;
      $('tobeUrl').value=tobeUrl;
      $('asisT').textContent=m+' (JSP)';$('tobeT').textContent=m+' (Next.js)';
      fs('asis','loading');fs('tobe','loading');
      $('asisF').src=asisUrl;
      $('tobeF').src=tobeUrl;
      toast('URL 자동 설정 완료');
    })
    .catch(e=>{
      toast('API 오류 — URL을 직접 입력해주세요');
      console.error('purchase-type API error:',e);
    });
}
function fs(s,st){
  const d=$(s+'D'),t=$(s+'St'),o=$(s+'Ov');
  d.className='dot '+st;t.textContent=st==='loading'?'로딩 중...':st==='ready'?'준비됨':'오류';
  o.classList.toggle('show',st==='loading');
}
function fl(s){
  fs(s,'ready');if(s==='asis')aR=true;else tR=true;
  const f=$(s+'F');
  f.contentWindow?.postMessage({type:'SET_ROLE',role:s},'*');
  setTimeout(()=>{f.contentWindow?.postMessage({type:'SET_ROLE',role:s},'*');},500);
  setTimeout(()=>{f.contentWindow?.postMessage({type:'SET_ROLE',role:s},'*');},1500);
  toast((s==='asis'?'AS-IS':'TO-BE')+' 로드 완료');
}
function onMsg(e){
  if(!e.data)return;
  if(e.data.type==='SCROLL_FROM_IFRAME'&&sync){
    const{role:r,scrollRatio:sr}=e.data;
    if(bSF===r)return;
    const tf=r==='asis'?$('tobeF'):$('asisF');
    bSF=r==='asis'?'tobe':'asis';
    tf.contentWindow?.postMessage({type:'SCROLL_TO_RATIO',ratio:sr},'*');
    clearTimeout(window._su);window._su=setTimeout(()=>{bSF=null;},50);
  }
  if(e.data.type==='DOM_EXTRACT_RESULT'){
    if(e.data.reqId!==rId)return;
    // Apply post-processing transforms
    pRes[e.data.role]=applyTx(e.data.result);
    if(pRes.asis&&pRes.tobe){renderDiff(pRes.asis,pRes.tobe);$('runDiff').textContent='\u25B6 DOM 비교 실행';$('runDiff').disabled=false;}
  }
  if(e.data.type==='PERF_DATA'){
    perfData[e.data.role]=e.data.data;
    if(perfData.asis&&perfData.tobe) renderPerf(perfData.asis,perfData.tobe);
    else $('perfSt').textContent=(perfData.asis?'AS-IS':'TO-BE')+' 측정 완료, 나머지 대기 중...';
  }
  if(e.data.type==='API_CAPTURED'){
    cApi=e.data;$('apiSt').style.display='none';$('apiCont').style.display='block';
    $('apiUrl').textContent=e.data.url;$('apiJson').textContent=JSON.stringify(e.data.data,null,2);
    toast('API 응답 캡처됨');
  }
}
function runDiff(){
  if(!aR&&!tR){toast('먼저 페이지를 로드해주세요');return;}
  rId=Date.now();pRes={};
  // Send selectors with all/textFilter metadata
  $('asisF').contentWindow?.postMessage({type:'DOM_EXTRACT_REQUEST',selectors:sel.map(s=>({key:s.key,selector:s.asis,all:s.all||false,textFilter:s.textFilter||''})),reqId:rId},'*');
  $('tobeF').contentWindow?.postMessage({type:'DOM_EXTRACT_REQUEST',selectors:sel.map(s=>({key:s.key,selector:s.tobe,all:s.all||false,textFilter:s.textFilter||''})),reqId:rId},'*');
  $('runDiff').textContent='\u23F3 추출 중...';$('runDiff').disabled=true;
  setTimeout(()=>{
    if(Object.keys(pRes).length<2){$('dres').innerHTML='<div style="color:var(--warn);font-size:11px;padding:10px;background:var(--surface2);border-radius:6px">\u26A0\uFE0F Cross-Origin 제한으로 DOM 접근 차단됨<br><br>동일 도메인 URL 또는 CORS 헤더 추가 필요</div>';}
    $('runDiff').textContent='\u25B6 DOM 비교 실행';$('runDiff').disabled=false;
  },3000);
}
function renderDiff(a,t){
  let ok=0,d=0,m=0;
  const rows=sel.map(s=>{
    const av=a[s.key],tv=t[s.key];
    const aN=av===null||av===undefined||av==='',tN=tv===null||tv===undefined||tv==='';
    let st;if(aN&&tN){st='missing';m++;}else if(av===tv){st='ok';ok++;}else{st='mismatch';d++;}
    return{key:s.key,av,tv,st};
  });
  $('okC').textContent='\u2713 '+ok+' 일치';$('diffC').textContent='\u2717 '+d+' 불일치';$('missC').textContent='? '+m+' 미추출';
  $('dsum').style.display='flex';
  $('dres').innerHTML=rows.map(r=>{
    const ic=r.st==='ok'?'\u2705':r.st==='mismatch'?'\u274C':'\u26A0\uFE0F';
    const rc=r.st==='ok'?'':r.st==='mismatch'?'mismatch':'missing';
    return '<div class="drow '+rc+'"><div class="dkey"><span>'+ic+'</span>'+r.key+'</div><div class="dvals"><div class="dval asis">'+(r.av||'<span class="nv">미추출</span>')+'</div><div class="dval tobe">'+(r.tv||'<span class="nv">미추출</span>')+'</div></div></div>';
  }).join('');
  if(d>0&&cApi)toast(d+'건 불일치 \u2014 API 탭 확인');
}
function initDiv(){
  const dv=$('divider'),ap=$('asisPW'),tp=$('tobePW');let drag=false;
  dv.onmousedown=e=>{drag=true;dv.classList.add('dragging');e.preventDefault();};
  document.onmousemove=e=>{
    if(!drag)return;
    const r=$('main').getBoundingClientRect();
    const c=Math.max(.2,Math.min(.8,(e.clientX-r.left)/r.width));
    ap.style.flex='none';ap.style.width=(c*100)+'%';tp.style.flex='1';
  };
  document.onmouseup=()=>{drag=false;dv.classList.remove('dragging');};
}
function fmtSize(b){if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(1)+'KB';return(b/1048576).toFixed(2)+'MB';}
function fmtMs(ms){return ms>=1000?(ms/1000).toFixed(2)+'s':ms+'ms';}

function renderPerf(a,t){
  $('perfSt').style.display='none';
  const sections=[
    {title:'Web Vitals (Core)',items:[
      {label:'TTFB',ak:'ttfb',fmt:fmtMs,lower:true,desc:'Time to First Byte'},
      {label:'FCP',ak:'fcp',fmt:fmtMs,lower:true,desc:'First Contentful Paint'},
      {label:'LCP',ak:'lcp',fmt:fmtMs,lower:true,desc:'Largest Contentful Paint'},
      {label:'CLS',ak:'cls',fmt:v=>v.toFixed(3),lower:true,desc:'Cumulative Layout Shift'},
    ]},
    {title:'Page Load',items:[
      {label:'DOM Load',ak:'domLoad',fmt:fmtMs,lower:true,desc:'DOMContentLoaded'},
      {label:'Page Load',ak:'pageLoad',fmt:fmtMs,lower:true,desc:'Load Event End'},
    ]},
    {title:'Resources',items:[
      {label:'Total Size',ak:'totalSize',fmt:fmtSize,lower:true},
      {label:'Requests',ak:'totalRequests',fmt:v=>v+'건',lower:true},
      {label:'JS',ak:'jsSize',fmt:v=>fmtSize(v),lower:true,count:'jsCount'},
      {label:'CSS',ak:'cssSize',fmt:v=>fmtSize(v),lower:true,count:'cssCount'},
      {label:'Images',ak:'imgSize',fmt:v=>fmtSize(v),lower:true,count:'imgCount'},
    ]},
    {title:'DOM Complexity',items:[
      {label:'DOM Nodes',ak:'domNodes',fmt:v=>v.toLocaleString()+'개',lower:true},
    ]},
  ];

  let html='<div class="perf-hdr"><span>Metric</span><span>AS-IS</span><span>TO-BE</span></div>';
  sections.forEach(sec=>{
    html+='<div class="perf-section"><div class="perf-section-title">'+sec.title+'</div>';
    sec.items.forEach(it=>{
      const av=a[it.ak]||0, tv=t[it.ak]||0;
      const af=it.fmt(av), tf=it.fmt(tv);
      // Determine winner (lower is better by default)
      let aw='',tw='';
      if(av!==tv&&av>0&&tv>0){
        if(it.lower){aw=av<=tv?'win':'lose';tw=tv<=av?'win':'lose';}
        else{aw=av>=tv?'win':'lose';tw=tv>=av?'win':'lose';}
      }
      const countInfo=it.count?(' ('+a[it.count]+'건 / '+t[it.count]+'건)'):'';
      const label=it.label+(it.desc?' <span style="color:var(--muted);font-size:9px">'+it.desc+'</span>':'');
      html+='<div class="perf-row"><div class="perf-label">'+label+'</div>';
      html+='<div class="perf-val asis-v '+aw+'">'+af+'</div>';
      html+='<div class="perf-val tobe-v '+tw+'">'+tf+'</div></div>';
    });
    html+='</div>';
  });
  $('perfRes').innerHTML=html;
  toast('성능 측정 완료');
}

function toggleMobile(on){
  mobileOn=on;
  chrome.runtime.sendMessage({type:'SET_MOBILE_UA',enabled:on},()=>{
    ['asisPW','tobePW'].forEach(id=>{
      const el=$(id);
      el.classList.toggle('mobile-view',on);
      el.style.flex='';el.style.width='';
    });
    if(on&&pOpen){pOpen=false;$('sp').classList.add('collapsed');$('panelBtn').textContent='\u25C0 비교 패널';}
    toast(on?'모바일 모드 ON':'데스크톱 모드 복원');
    if(aR||tR){
      [$('asisF'),$('tobeF')].forEach(f=>{if(f.src)f.src=f.src;});
      aR=false;tR=false;fs('asis','loading');fs('tobe','loading');
    }
  });
}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(()=>el.classList.remove('show'),2500);}
init();
