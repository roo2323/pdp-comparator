const $=id=>document.getElementById(id);

// ═══════════════════════ DOM Comparison Selectors (existing) ═══════════════════════
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
function getDS(){return $('pdpTypeSelect').value==='SUBSCRIPTION'?DS_SUBSCRIPTION:DS_PURCHASE;}
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
function applyTx(results){const out={};for(const k in results){let v=results[k];if(v&&TX[k])v=TX[k](v);out[k]=v;}return out;}

// ═══════════════════════ State ═══════════════════════
let sel=[],sync=true,aR=false,tR=false,cApi=null,pOpen=true,bSF=null,pRes={},rId=0,mobileOn=false,perfData={};
let auditRes={},auditId=0,lastAudit=null,apiList=[];

// ═══════════════════════ Init ═══════════════════════
function refreshSel(){sel=getDS();$('selCfg').value=JSON.stringify(sel,null,2);}
function init(){
  $('asisUrl').value=localStorage.getItem('pdp-au')||'';
  $('tobeUrl').value=localStorage.getItem('pdp-tu')||'';
  $('modelInput').value=localStorage.getItem('pdp-m')||'';
  $('pdpTypeSelect').value=localStorage.getItem('pdp-type')||'PURCHASE';
  refreshSel();bind();
  if(!localStorage.getItem('pdp-mobile-init')){localStorage.setItem('pdp-mobile-init','1');toggleMobile(true);}
  else{if($('mobileMode').checked)toggleMobile(true);}
}
function bind(){
  $('loadBtn').onclick=load;
  $('modelInput').onkeydown=e=>{if(e.key==='Enter')load();};
  $('reloadBtn').onclick=()=>{[$('asisF'),$('tobeF')].forEach(f=>{if(f.src)f.src=f.src;});aR=false;tR=false;fs('asis','loading');fs('tobe','loading');};
  $('syncScroll').onchange=e=>{sync=e.target.checked;};
  $('mobileMode').onchange=e=>{toggleMobile(e.target.checked);};
  $('runDiff').onclick=runDiff;
  $('runAudit').onclick=runAudit;
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
  $('exportJSON').onclick=()=>exportData('json');
  $('exportCSV').onclick=()=>exportData('csv');
  $('exportHTML').onclick=()=>exportData('html');
  initDiv();
}

const BASE='https://wwwdev50.lge.co.kr';
const API_BASE='http://localhost:18093';

// ═══════════════════════ Page Load ═══════════════════════
function load(){
  const m=$('modelInput').value.trim();
  if(!m){toast('모델 ID를 입력해주세요');return;}
  localStorage.setItem('pdp-m',m);
  const pdpType=$('pdpTypeSelect').value;
  localStorage.setItem('pdp-type',pdpType);refreshSel();
  $('dres').innerHTML='';$('dsum').style.display='none';
  $('apiCont').style.display='none';$('apiSt').style.display='block';$('apiSt').textContent='로딩 중... API 대기 중';
  cApi=null;aR=false;tR=false;perfData={};auditRes={};lastAudit=null;apiList=[];
  $('perfSt').textContent='페이지 로드 완료 후 자동 측정됩니다';$('perfRes').innerHTML='';
  clearAuditTabs();
  toast('URL 조회 중...');
  fetch(API_BASE+'/api/v1/models/'+m+'/purchase-type')
    .then(r=>r.json()).then(res=>{
      const d=res.data;let asisPath,tobeUrl;
      if(pdpType==='SUBSCRIPTION'&&d.subscription&&d.subscription.url){asisPath=d.subscription.url;tobeUrl=BASE+'/model?modelId='+m+'&pdpType=SUBSCRIPTION';}
      else if(d.purchase&&d.purchase.url){asisPath=d.purchase.url;tobeUrl=BASE+'/model?modelId='+m;}
      else{toast('URL을 찾을 수 없습니다');return;}
      $('asisUrl').value=BASE+asisPath;$('tobeUrl').value=tobeUrl;
      $('asisT').textContent=m+' (JSP)';$('tobeT').textContent=m+' (Next.js)';
      fs('asis','loading');fs('tobe','loading');
      $('asisF').src=BASE+asisPath;$('tobeF').src=tobeUrl;
      toast('URL 자동 설정 완료');
    }).catch(e=>{toast('API 오류 — URL을 직접 입력해주세요');console.error(e);});
}
function fs(s,st){const d=$(s+'D'),t=$(s+'St'),o=$(s+'Ov');d.className='dot '+st;t.textContent=st==='loading'?'로딩 중...':st==='ready'?'준비됨':'오류';o.classList.toggle('show',st==='loading');}
function fl(s){
  fs(s,'ready');if(s==='asis')aR=true;else tR=true;
  const f=$(s+'F');
  f.contentWindow?.postMessage({type:'SET_ROLE',role:s},'*');
  setTimeout(()=>{f.contentWindow?.postMessage({type:'SET_ROLE',role:s},'*');},500);
  setTimeout(()=>{f.contentWindow?.postMessage({type:'SET_ROLE',role:s},'*');},1500);
  toast((s==='asis'?'AS-IS':'TO-BE')+' 로드 완료');
}

// ═══════════════════════ Message Handler ═══════════════════════
function onMsg(e){
  if(!e.data)return;
  if(e.data.type==='SCROLL_FROM_IFRAME'&&sync){
    const{role:r,scrollRatio:sr}=e.data;if(bSF===r)return;
    const tf=r==='asis'?$('tobeF'):$('asisF');bSF=r==='asis'?'tobe':'asis';
    tf.contentWindow?.postMessage({type:'SCROLL_TO_RATIO',ratio:sr},'*');
    clearTimeout(window._su);window._su=setTimeout(()=>{bSF=null;},50);
  }
  if(e.data.type==='DOM_EXTRACT_RESULT'){
    if(e.data.reqId!==rId)return;
    pRes[e.data.role]=applyTx(e.data.result);
    if(pRes.asis&&pRes.tobe){renderDiff(pRes.asis,pRes.tobe);$('runDiff').textContent='\u25B6 DOM 비교 실행';$('runDiff').disabled=false;}
  }
  if(e.data.type==='AUDIT_RESULT'){
    if(e.data.reqId!==auditId)return;
    auditRes[e.data.role]=e.data.result;
    if(auditRes.asis&&auditRes.tobe){
      lastAudit={asis:auditRes.asis,tobe:auditRes.tobe,time:new Date().toISOString()};
      renderFullAudit(auditRes.asis,auditRes.tobe);
      $('runAudit').textContent='\u25B6 전체 감사 실행';$('runAudit').disabled=false;
    }
  }
  if(e.data.type==='PERF_DATA'){
    perfData[e.data.role]=e.data.data;
    if(perfData.asis&&perfData.tobe)renderPerf(perfData.asis,perfData.tobe);
    else $('perfSt').textContent=(perfData.asis?'AS-IS':'TO-BE')+' 측정 완료, 나머지 대기 중...';
  }
  if(e.data.type==='API_CAPTURED'){
    const role=e.data.role||'unknown';
    const urlShort=(e.data.url||'').replace(/https?:\/\/[^/]+/,'').split('?')[0];
    apiList.push({url:e.data.url,data:e.data.data,role,time:new Date().toLocaleTimeString()});
    renderApiList();
    toast((role==='asis'?'AS-IS':'TO-BE')+' API 캡처: '+urlShort);
  }
}

// ═══════════════════════ Audit ═══════════════════════
function runAudit(){
  if(!aR&&!tR){toast('먼저 페이지를 로드해주세요');return;}
  auditId=Date.now();auditRes={};
  $('runAudit').textContent='\u23F3 감사 중...';$('runAudit').disabled=true;
  $('asisF').contentWindow?.postMessage({type:'AUDIT_REQUEST',reqId:auditId},'*');
  $('tobeF').contentWindow?.postMessage({type:'AUDIT_REQUEST',reqId:auditId},'*');
  setTimeout(()=>{
    if(!auditRes.asis||!auditRes.tobe){
      $('auditOverview').innerHTML='<div style="color:var(--warn);font-size:11px;padding:10px;background:var(--surface2);border-radius:6px">\u26A0\uFE0F Cross-Origin 제한으로 추출 차단됨</div>';
      $('runAudit').textContent='\u25B6 전체 감사 실행';$('runAudit').disabled=false;
    }
  },5000);
}

function clearAuditTabs(){
  ['auditSummary','auditOverview','seoRes','jsonldRes','sectionsRes','mediaRes','deepRes','imagesRes','trackingRes'].forEach(id=>{
    const el=$(id);if(el)el.innerHTML=id.endsWith('Res')?'<div style="color:var(--muted);font-size:11px;text-align:center;padding:20px 0">감사 실행 후 결과가 표시됩니다</div>':'';
  });
  $('exportBar').style.display='none';
}

function renderFullAudit(a,t){
  const seo=buildSEOItems(a.seo,t.seo);
  const ld=buildJSONLDItems(a.jsonld,t.jsonld);
  const sec=buildSectionItems(a.sections,t.sections);
  const med=buildMediaItems(a.media,t.media);
  const all=[...seo,...ld,...sec,...med];
  const crit=all.filter(i=>i.sev==='crit').length;
  const warn=all.filter(i=>i.sev==='warn').length;
  const ok=all.filter(i=>i.sev==='ok').length;

  // Summary cards
  $('auditSummary').innerHTML=`
    <div class="sev-cards">
      <div class="sev-card sev-crit"><div class="num">${crit}</div><div class="lbl">Critical</div></div>
      <div class="sev-card sev-warn"><div class="num">${warn}</div><div class="lbl">Warning</div></div>
      <div class="sev-card sev-ok"><div class="num">${ok}</div><div class="lbl">OK</div></div>
    </div>`;

  // Overview: top critical items
  const critItems=all.filter(i=>i.sev==='crit');
  let ovHtml='';
  if(critItems.length){
    ovHtml+='<div class="audit-section"><div class="audit-section-title">\u{1F6A8} Critical Issues ('+critItems.length+')</div>';
    critItems.forEach(i=>{ovHtml+=`<div style="font-size:10px;padding:4px 0;color:var(--danger)">\u2022 <b>${i.group}</b> — ${i.key}: ${i.detail||'TO-BE 누락'}</div>`;});
    ovHtml+='</div>';
  }
  $('auditOverview').innerHTML=ovHtml;
  $('exportBar').style.display='flex';

  // Render each tab
  renderSEOTab(a.seo,t.seo,seo);
  renderJSONLDTab(a.jsonld,t.jsonld,ld);
  renderSectionsTab(a.sections,t.sections,sec);
  renderMediaTab(a.media,t.media,med);
  renderDeepDiff(a,t);
  renderImagesDiff(a.images||[],t.images||[]);
  renderTrackingDiff(a.tracking||{},t.tracking||{},a.scripts||[],t.scripts||[]);
  toast('감사 완료 — Critical '+crit+'건');
}

// ─── SEO ───
const SEO_FIELDS=[
  {key:'title',label:'title',sev:'crit'},
  {key:'titleLength',label:'title 길이',type:'info'},
  {key:'metaDescription',label:'meta description',sev:'crit'},
  {key:'metaDescLength',label:'description 길이',type:'info'},
  {key:'canonical',label:'canonical',sev:'crit'},
  {key:'robots',label:'robots',sev:'warn'},
  {key:'og:title',og:true,label:'og:title',sev:'crit'},
  {key:'og:description',og:true,label:'og:description',sev:'crit'},
  {key:'og:image',og:true,label:'og:image',sev:'crit'},
  {key:'og:url',og:true,label:'og:url',sev:'crit'},
  {key:'og:type',og:true,label:'og:type',sev:'warn'},
  {key:'og:site_name',og:true,label:'og:site_name',sev:'warn'},
  {key:'og:locale',og:true,label:'og:locale',sev:'warn'},
  {key:'twitter:card',tw:true,label:'twitter:card',sev:'warn'},
  {key:'twitter:title',tw:true,label:'twitter:title',sev:'warn'},
  {key:'hreflangs',label:'hreflang',sev:'warn',type:'count'},
  {key:'favicon',label:'favicon',sev:'warn'},
];

function getVal(seo,f){
  if(f.og) return seo.og?.['og:'+f.key.split(':')[1]]||null;
  if(f.tw) return seo.twitter?.[f.key]||null;
  if(f.type==='count') return seo[f.key]?.length??0;
  return seo[f.key]??null;
}

function buildSEOItems(a,t){
  return SEO_FIELDS.filter(f=>f.sev).map(f=>{
    const av=getVal(a,f),tv=getVal(t,f);
    const aHas=av!==null&&av!==''&&av!==0;
    const tHas=tv!==null&&tv!==''&&tv!==0;
    let sev='ok';
    if(aHas&&!tHas) sev=f.sev; // AS-IS has it, TO-BE missing
    else if(!aHas&&!tHas) sev='na';
    return{group:'SEO',key:f.label,sev,av:fmtVal(av),tv:fmtVal(tv),detail:aHas&&!tHas?'TO-BE 누락':null};
  });
}

function renderSEOTab(a,t,items){
  let html='<div class="audit-row header"><div>항목</div><div>AS-IS</div><div>TO-BE</div><div>상태</div></div>';
  SEO_FIELDS.forEach(f=>{
    const av=getVal(a,f),tv=getVal(t,f);
    const aHas=av!==null&&av!==''&&av!==0;
    const tHas=tv!==null&&tv!==''&&tv!==0;
    let sev=f.type==='info'?'na':(!aHas&&!tHas?'na':aHas&&!tHas?f.sev:aHas&&tHas&&av===tv?'ok':'warn');
    if(!f.sev&&f.type==='info') sev='na';
    html+=`<div class="audit-row">
      <div class="audit-key">${f.label}</div>
      <div class="audit-val asis-v"><span class="trunc">${fmtVal(av)}</span></div>
      <div class="audit-val tobe-v"><span class="trunc">${fmtVal(tv)}</span></div>
      <div class="audit-badge badge-${sev}">${sevLabel(sev)}</div>
    </div>`;
  });
  $('seoRes').innerHTML=html;
}

// ─── JSON-LD ───
const LD_PRODUCT_FIELDS=['name','sku','brand','image','description','offersPrice','offersCurrency','offersAvailability','ratingValue','reviewCount'];

function buildJSONLDItems(aList,tList){
  const items=[];
  const aTypes=new Set(aList.map(i=>i.type));
  const tTypes=new Set(tList.map(i=>i.type));
  const allTypes=new Set([...aTypes,...tTypes]);
  allTypes.forEach(type=>{
    const aHas=aTypes.has(type),tHas=tTypes.has(type);
    let sev='ok';
    if(aHas&&!tHas) sev=(type==='Product'||type==='BreadcrumbList')?'crit':'warn';
    else if(!aHas&&tHas) sev='ok';
    items.push({group:'JSON-LD',key:'@type: '+type,sev,detail:aHas&&!tHas?'TO-BE 누락':null});
    if(type==='Product'){
      const aP=aList.find(i=>i.type==='Product')||{};
      const tP=tList.find(i=>i.type==='Product')||{};
      LD_PRODUCT_FIELDS.forEach(f=>{
        const av=aP[f],tv=tP[f];
        const aH=av!==null&&av!==undefined&&av!==false;
        const tH=tv!==null&&tv!==undefined&&tv!==false;
        if(aH&&!tH) items.push({group:'JSON-LD',key:'Product.'+f,sev:'crit',detail:'TO-BE 누락'});
      });
    }
  });
  return items;
}

function renderJSONLDTab(aList,tList){
  const aTypes=new Set(aList.map(i=>i.type));
  const tTypes=new Set(tList.map(i=>i.type));
  const allTypes=[...new Set([...aTypes,...tTypes])];

  let html='<div class="audit-section"><div class="audit-section-title">@type 비교</div>';
  html+='<div class="matrix-row header"><div>Type</div><div>AS-IS</div><div>TO-BE</div></div>';
  allTypes.forEach(type=>{
    const aH=aTypes.has(type),tH=tTypes.has(type);
    html+=`<div class="matrix-row">
      <div class="matrix-label">${type}</div>
      <div class="matrix-cell ${aH?'matrix-yes':'matrix-no'}">${aH?'✓':'✗'}</div>
      <div class="matrix-cell ${tH?'matrix-yes':'matrix-no'}">${tH?'✓':'✗'}</div>
    </div>`;
  });
  html+='</div>';

  // Product detail comparison
  const aP=aList.find(i=>i.type==='Product');
  const tP=tList.find(i=>i.type==='Product');
  if(aP||tP){
    html+='<div class="audit-section"><div class="audit-section-title">Product 상세</div>';
    html+='<div class="audit-row header"><div>필드</div><div>AS-IS</div><div>TO-BE</div><div>상태</div></div>';
    LD_PRODUCT_FIELDS.forEach(f=>{
      const av=(aP||{})[f],tv=(tP||{})[f];
      const aH=av!==null&&av!==undefined&&av!==false;
      const tH=tv!==null&&tv!==undefined&&tv!==false;
      const sev=aH&&!tH?'crit':!aH&&!tH?'na':'ok';
      html+=`<div class="audit-row">
        <div class="audit-key">${f}</div>
        <div class="audit-val asis-v"><span class="trunc">${fmtVal(av)}</span></div>
        <div class="audit-val tobe-v"><span class="trunc">${fmtVal(tv)}</span></div>
        <div class="audit-badge badge-${sev}">${sevLabel(sev)}</div>
      </div>`;
    });
    html+='</div>';
  }

  // BreadcrumbList
  const aB=aList.find(i=>i.type==='BreadcrumbList');
  const tB=tList.find(i=>i.type==='BreadcrumbList');
  if(aB||tB){
    html+='<div class="audit-section"><div class="audit-section-title">BreadcrumbList</div>';
    html+=`<div style="font-size:10px;margin-bottom:4px;color:var(--asis)">AS-IS (${(aB?.itemCount)||0}): ${(aB?.items||[]).join(' > ')||'없음'}</div>`;
    html+=`<div style="font-size:10px;color:var(--tobe)">TO-BE (${(tB?.itemCount)||0}): ${(tB?.items||[]).join(' > ')||'없음'}</div>`;
    html+='</div>';
  }

  $('jsonldRes').innerHTML=html;
}

// ─── Sections ───
function buildSectionItems(aSecs,tSecs){
  const items=[];
  const aMap=new Map();aSecs.forEach(s=>{if(s.title)aMap.set(normTitle(s.title),s);});
  const tMap=new Map();tSecs.forEach(s=>{if(s.title)tMap.set(normTitle(s.title),s);});
  const allKeys=[...new Set([...aMap.keys(),...tMap.keys()])];
  allKeys.forEach(k=>{
    const aH=aMap.has(k),tH=tMap.has(k);
    const sev=aH&&!tH?'crit':!aH&&tH?'ok':'ok';
    items.push({group:'섹션',key:aMap.get(k)?.title||tMap.get(k)?.title||k,sev,detail:aH&&!tH?'TO-BE 누락':null});
  });
  return items;
}

function normTitle(t){return t.replace(/\s+/g,' ').trim().toLowerCase();}

function renderSectionsTab(aSecs,tSecs){
  const aMap=new Map();aSecs.forEach(s=>{if(s.title)aMap.set(normTitle(s.title),s);});
  const tMap=new Map();tSecs.forEach(s=>{if(s.title)tMap.set(normTitle(s.title),s);});
  const allKeys=[...new Set([...aMap.keys(),...tMap.keys()])];

  let html=`<div class="audit-section"><div class="audit-section-title">콘텐츠 섹션 매핑 (${allKeys.length}개)</div>`;
  html+='<div class="matrix-row header"><div>섹션명</div><div>AS-IS</div><div>TO-BE</div></div>';
  allKeys.forEach(k=>{
    const aH=aMap.has(k),tH=tMap.has(k);
    const title=aMap.get(k)?.title||tMap.get(k)?.title||k;
    html+=`<div class="matrix-row">
      <div class="matrix-label" title="${esc(title)}">${esc(title)}</div>
      <div class="matrix-cell ${aH?'matrix-yes':'matrix-no'}">${aH?'✓':'✗'}</div>
      <div class="matrix-cell ${tH?'matrix-yes':'matrix-no'}">${tH?'✓':'✗'}</div>
    </div>`;
  });
  html+='</div>';

  // Detail: AS-IS only sections
  const asisOnly=allKeys.filter(k=>aMap.has(k)&&!tMap.has(k));
  if(asisOnly.length){
    html+=`<div class="audit-section"><div class="audit-section-title" style="color:var(--danger)">\u{1F6A8} TO-BE 누락 섹션 (${asisOnly.length})</div>`;
    asisOnly.forEach(k=>{
      const s=aMap.get(k);
      html+=`<div style="font-size:10px;padding:3px 0;color:var(--danger)">\u2022 ${esc(s.title)} ${s.id?'<span style="color:var(--muted)">#'+s.id+'</span>':''} (이미지 ${s.imageCount}장)</div>`;
    });
    html+='</div>';
  }

  // TO-BE only sections
  const tobeOnly=allKeys.filter(k=>!aMap.has(k)&&tMap.has(k));
  if(tobeOnly.length){
    html+=`<div class="audit-section"><div class="audit-section-title" style="color:var(--ok)">TO-BE 신규 섹션 (${tobeOnly.length})</div>`;
    tobeOnly.forEach(k=>{
      const s=tMap.get(k);
      html+=`<div style="font-size:10px;padding:3px 0;color:var(--ok)">\u2022 ${esc(s.title)}</div>`;
    });
    html+='</div>';
  }

  $('sectionsRes').innerHTML=html;
}

// ─── Media ───
function buildMediaItems(a,t){
  const items=[];
  if(t.altMissingRate>50) items.push({group:'미디어',key:'alt 누락률',sev:'crit',detail:t.altMissingRate+'%'});
  else if(t.altMissingRate>20) items.push({group:'미디어',key:'alt 누락률',sev:'warn',detail:t.altMissingRate+'%'});
  else items.push({group:'미디어',key:'alt 누락률',sev:'ok'});
  if(t.lazyLoadRate<30&&t.totalImages>10) items.push({group:'미디어',key:'lazy-load 비율',sev:'warn',detail:t.lazyLoadRate+'%'});
  return items;
}

function renderMediaTab(a,t){
  const rows=[
    {label:'이미지 총 개수',av:a.totalImages+'장',tv:t.totalImages+'장'},
    {label:'alt 누락',av:a.altMissing+'장 ('+a.altMissingRate+'%)',tv:t.altMissing+'장 ('+t.altMissingRate+'%)',sev:t.altMissingRate>50?'crit':t.altMissingRate>20?'warn':'ok'},
    {label:'동영상 수',av:a.videoCount+'개',tv:t.videoCount+'개'},
    {label:'갤러리 썸네일',av:a.galleryThumbnails+'장',tv:t.galleryThumbnails+'장'},
    {label:'lazy-load 적용',av:a.lazyLoadCount+'장 ('+a.lazyLoadRate+'%)',tv:t.lazyLoadCount+'장 ('+t.lazyLoadRate+'%)',sev:t.lazyLoadRate<30&&t.totalImages>10?'warn':'ok'},
  ];
  let html='<div class="audit-section"><div class="audit-section-title">미디어 · 접근성</div>';
  html+='<div class="audit-row header"><div>항목</div><div>AS-IS</div><div>TO-BE</div><div>상태</div></div>';
  rows.forEach(r=>{
    html+=`<div class="audit-row">
      <div class="audit-key">${r.label}</div>
      <div class="audit-val asis-v">${r.av}</div>
      <div class="audit-val tobe-v">${r.tv}</div>
      <div class="audit-badge badge-${r.sev||'na'}">${sevLabel(r.sev||'na')}</div>
    </div>`;
  });
  html+='</div>';
  $('mediaRes').innerHTML=html;
}

// ═══════════════════════ Image Diff (3차) ═══════════════════════
function renderImagesDiff(aImgs,tImgs){
  const aPaths=new Set(aImgs.map(i=>i.path));
  const tPaths=new Set(tImgs.map(i=>i.path));
  const common=[...aPaths].filter(p=>tPaths.has(p));
  const onlyA=[...aPaths].filter(p=>!tPaths.has(p));
  const onlyT=[...tPaths].filter(p=>!aPaths.has(p));
  const aByPath=new Map();aImgs.forEach(i=>aByPath.set(i.path,i));
  const tByPath=new Map();tImgs.forEach(i=>tByPath.set(i.path,i));

  let html=`<div class="audit-section"><div class="audit-section-title">이미지 src 집합 비교</div>`;
  html+=`<div style="font-size:10px;color:var(--muted);margin-bottom:8px">AS-IS <b>${aImgs.length}</b>장 / TO-BE <b>${tImgs.length}</b>장 | 공통 <b>${common.length}</b> | <span style="color:var(--danger)">AS-IS only ${onlyA.length}</span> | <span style="color:var(--ok)">TO-BE only ${onlyT.length}</span></div>`;

  // AS-IS only
  if(onlyA.length){
    html+=`<div class="img-set-section"><div class="img-set-title" style="color:var(--danger)">AS-IS only (${onlyA.length}) — TO-BE에 없는 이미지</div>`;
    onlyA.slice(0,50).forEach(p=>{
      const img=aByPath.get(p);
      html+=`<div class="img-item img-only-a" title="${esc(p)}"><span>${esc(p.length>70?'…'+p.slice(-67):p)}</span>${img?.section?`<span class="img-sec">${esc(img.section)}</span>`:''}</div>`;
    });
    if(onlyA.length>50) html+=`<div style="font-size:9px;color:var(--muted);padding:4px 6px">+${onlyA.length-50}개 더...</div>`;
    html+='</div>';
  }

  // TO-BE only
  if(onlyT.length){
    html+=`<div class="img-set-section"><div class="img-set-title" style="color:var(--ok)">TO-BE only (${onlyT.length}) — 새로 추가된 이미지</div>`;
    onlyT.slice(0,50).forEach(p=>{
      const img=tByPath.get(p);
      html+=`<div class="img-item img-only-t" title="${esc(p)}"><span>${esc(p.length>70?'…'+p.slice(-67):p)}</span>${img?.section?`<span class="img-sec">${esc(img.section)}</span>`:''}</div>`;
    });
    if(onlyT.length>50) html+=`<div style="font-size:9px;color:var(--muted);padding:4px 6px">+${onlyT.length-50}개 더...</div>`;
    html+='</div>';
  }

  // Common with dimension diff
  const dimDiffs=common.filter(p=>{
    const a=aByPath.get(p),t=tByPath.get(p);
    return a&&t&&(a.width!==t.width||a.height!==t.height);
  });
  if(dimDiffs.length){
    html+=`<div class="img-set-section"><div class="img-set-title" style="color:var(--warn)">크기 불일치 (${dimDiffs.length})</div>`;
    html+='<div style="display:grid;grid-template-columns:1fr 70px 70px;gap:3px;font-size:9px;font-weight:700;color:var(--muted);margin-bottom:4px"><div>경로</div><div>AS-IS</div><div>TO-BE</div></div>';
    dimDiffs.slice(0,30).forEach(p=>{
      const a=aByPath.get(p),t=tByPath.get(p);
      html+=`<div style="display:grid;grid-template-columns:1fr 70px 70px;gap:3px;font-size:9px;margin-bottom:2px">
        <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)" title="${esc(p)}">${esc(p.length>50?'…'+p.slice(-47):p)}</div>
        <div style="color:var(--asis)">${a.width}×${a.height}</div>
        <div style="color:var(--tobe)">${t.width}×${t.height}</div>
      </div>`;
    });
    html+='</div>';
  }

  // Section-based image count comparison
  const aSecMap=new Map(),tSecMap=new Map();
  aImgs.forEach(i=>{const s=i.section||'(기타)';aSecMap.set(s,(aSecMap.get(s)||0)+1);});
  tImgs.forEach(i=>{const s=i.section||'(기타)';tSecMap.set(s,(tSecMap.get(s)||0)+1);});
  const allSecs=[...new Set([...aSecMap.keys(),...tSecMap.keys()])];
  if(allSecs.length>1){
    html+=`<div class="img-set-section"><div class="img-set-title" style="color:var(--accent2)">섹션별 이미지 수</div>`;
    html+='<div class="matrix-row header"><div>섹션</div><div>AS-IS</div><div>TO-BE</div></div>';
    allSecs.forEach(s=>{
      const ac=aSecMap.get(s)||0,tc=tSecMap.get(s)||0;
      html+=`<div class="matrix-row">
        <div class="matrix-label">${esc(s)}</div>
        <div class="matrix-cell" style="color:var(--asis)">${ac}</div>
        <div class="matrix-cell" style="color:var(--tobe)">${tc}</div>
      </div>`;
    });
    html+='</div>';
  }

  html+='</div>';
  $('imagesRes').innerHTML=html;
}

// ═══════════════════════ Tracking Diff (3차) ═══════════════════════
function renderTrackingDiff(a,t,aScr,tScr){
  let html='';

  // ─── 3rd Party Scripts ───
  html+=renderScriptsSection(aScr||[],tScr||[]);

  // GTM Container IDs
  html+='<div class="audit-section"><div class="audit-section-title">GTM 컨테이너</div>';
  const aGtm=a.gtmIds||[],tGtm=t.gtmIds||[];
  if(!aGtm.length&&!tGtm.length) html+='<div style="font-size:10px;color:var(--muted)">GTM 미감지</div>';
  else{
    html+='<div class="audit-row header"><div>항목</div><div>AS-IS</div><div>TO-BE</div><div>상태</div></div>';
    html+=`<div class="audit-row">
      <div class="audit-key">GTM ID</div>
      <div class="audit-val asis-v">${aGtm.join(', ')||'<span class="nv">없음</span>'}</div>
      <div class="audit-val tobe-v">${tGtm.join(', ')||'<span class="nv">없음</span>'}</div>
      <div class="audit-badge badge-${aGtm.join()===tGtm.join()?'ok':'warn'}">${aGtm.join()===tGtm.join()?'OK':'DIFF'}</div>
    </div>`;
    const aGa=a.gaIds||[],tGa=t.gaIds||[];
    html+=`<div class="audit-row">
      <div class="audit-key">GA4 ID</div>
      <div class="audit-val asis-v">${aGa.join(', ')||'<span class="nv">없음</span>'}</div>
      <div class="audit-val tobe-v">${tGa.join(', ')||'<span class="nv">없음</span>'}</div>
      <div class="audit-badge badge-${aGa.join()===tGa.join()?'ok':'warn'}">${aGa.join()===tGa.join()?'OK':'DIFF'}</div>
    </div>`;
  }
  html+='</div>';

  // dataLayer event types
  const aEv=a.eventTypes||[],tEv=t.eventTypes||[];
  const bothEv=aEv.filter(e=>tEv.includes(e));
  const onlyAEv=aEv.filter(e=>!tEv.includes(e));
  const onlyTEv=tEv.filter(e=>!aEv.includes(e));
  html+=`<div class="audit-section"><div class="audit-section-title">dataLayer 이벤트 (AS-IS ${a.dataLayerCount||0}건 / TO-BE ${t.dataLayerCount||0}건)</div>`;
  html+=`<div style="font-size:9px;color:var(--muted);margin-bottom:6px">이벤트 타입: 공통 ${bothEv.length} | <span style="color:var(--asis)">AS-IS only ${onlyAEv.length}</span> | <span style="color:var(--tobe)">TO-BE only ${onlyTEv.length}</span></div>`;
  html+='<div style="margin-bottom:8px">';
  bothEv.forEach(e=>{html+=`<span class="track-ev track-ev-both">${esc(e)}</span>`;});
  onlyAEv.forEach(e=>{html+=`<span class="track-ev track-ev-asis">${esc(e)}</span>`;});
  onlyTEv.forEach(e=>{html+=`<span class="track-ev track-ev-tobe">${esc(e)}</span>`;});
  if(!bothEv.length&&!onlyAEv.length&&!onlyTEv.length) html+='<span style="font-size:10px;color:var(--muted)">이벤트 없음</span>';
  html+='</div></div>';

  // page_view comparison
  if(a.pageView||t.pageView){
    html+='<div class="audit-section"><div class="audit-section-title">page_view 파라미터</div>';
    html+=renderTrackKV(a.pageView||{},t.pageView||{});
    html+='</div>';
  }

  // view_item comparison
  if(a.viewItem||t.viewItem){
    html+='<div class="audit-section"><div class="audit-section-title">view_item 파라미터</div>';
    html+=renderTrackKV(a.viewItem||{},t.viewItem||{});
    html+='</div>';
  }

  $('trackingRes').innerHTML=html;
}

function renderTrackKV(a,t){
  const allKeys=[...new Set([...Object.keys(a),...Object.keys(t)])].sort();
  if(!allKeys.length) return'<div style="font-size:10px;color:var(--muted)">데이터 없음</div>';
  let html='<div class="track-kv" style="font-weight:700;color:var(--muted);font-size:8px;text-transform:uppercase"><div>Key</div><div>AS-IS</div><div>TO-BE</div></div>';
  allKeys.forEach(k=>{
    const av=a[k]||null,tv=t[k]||null;
    const match=av===tv;
    const cls=!av&&tv?'tobe':av&&!tv?'danger':match?'':'warn';
    html+=`<div class="track-kv">
      <div class="track-kv-key" title="${esc(k)}">${esc(k)}</div>
      <div class="track-kv-val audit-val asis-v">${av?esc(av.substring(0,80)):'<span class="nv">-</span>'}</div>
      <div class="track-kv-val audit-val tobe-v">${tv?esc(tv.substring(0,80)):'<span class="nv">-</span>'}</div>
    </div>`;
  });
  return html;
}

// ═══════════════════════ Scripts Section (트래킹 탭에 통합) ═══════════════════════
function renderScriptsSection(aScr,tScr){
  const a3p=aScr.filter(s=>s.is3p),t3p=tScr.filter(s=>s.is3p);
  const a1p=aScr.filter(s=>!s.is3p),t1p=tScr.filter(s=>!s.is3p);
  const aHosts=new Set(a3p.map(s=>s.host)),tHosts=new Set(t3p.map(s=>s.host));
  const bothH=[...aHosts].filter(h=>tHosts.has(h));
  const onlyAH=[...aHosts].filter(h=>!tHosts.has(h));
  const onlyTH=[...tHosts].filter(h=>!aHosts.has(h));

  let html=`<div class="audit-section"><div class="audit-section-title">3rd Party 스크립트 비교</div>`;
  html+=`<div style="font-size:10px;color:var(--muted);margin-bottom:8px">
    AS-IS: 전체 <b>${aScr.length}</b>개 (3P <b>${a3p.length}</b>) / TO-BE: 전체 <b>${tScr.length}</b>개 (3P <b>${t3p.length}</b>)<br>
    3P 도메인: 공통 <b>${bothH.length}</b> | <span style="color:var(--asis)">AS-IS only ${onlyAH.length}</span> | <span style="color:var(--tobe)">TO-BE only ${onlyTH.length}</span>
  </div>`;

  // 3P domain matrix
  html+='<div class="matrix-row header"><div>도메인</div><div>AS-IS</div><div>TO-BE</div></div>';
  const allH=[...new Set([...aHosts,...tHosts])].sort();
  allH.forEach(h=>{
    const aH=aHosts.has(h),tH=tHosts.has(h);
    const cat=(a3p.find(s=>s.host===h)||t3p.find(s=>s.host===h))?.category||'other';
    html+=`<div class="matrix-row">
      <div class="matrix-label"><span class="script-cat cat-${cat}">${cat}</span> ${esc(h)}</div>
      <div class="matrix-cell ${aH?'matrix-yes':'matrix-no'}">${aH?'✓':'✗'}</div>
      <div class="matrix-cell ${tH?'matrix-yes':'matrix-no'}">${tH?'✓':'✗'}</div>
    </div>`;
  });
  html+='</div>';

  // Category summary
  const cats=['analytics','ads','social','ux','chat','library','other'];
  const aCatCnt={},tCatCnt={};
  a3p.forEach(s=>{aCatCnt[s.category]=(aCatCnt[s.category]||0)+1;});
  t3p.forEach(s=>{tCatCnt[s.category]=(tCatCnt[s.category]||0)+1;});
  html+=`<div class="audit-section"><div class="audit-section-title">카테고리별 3P 스크립트 수</div>`;
  html+='<div class="matrix-row header"><div>카테고리</div><div>AS-IS</div><div>TO-BE</div></div>';
  cats.forEach(c=>{
    const ac=aCatCnt[c]||0,tc=tCatCnt[c]||0;
    if(!ac&&!tc) return;
    html+=`<div class="matrix-row">
      <div class="matrix-label"><span class="script-cat cat-${c}">${c}</span></div>
      <div class="matrix-cell" style="color:var(--asis)">${ac}</div>
      <div class="matrix-cell" style="color:var(--tobe)">${tc}</div>
    </div>`;
  });
  html+='</div>';

  // AS-IS only 3P detail
  if(onlyAH.length){
    html+=`<div class="audit-section"><div class="audit-section-title" style="color:var(--asis)">AS-IS only 3P (${onlyAH.length} 도메인)</div>`;
    a3p.filter(s=>onlyAH.includes(s.host)).forEach(s=>{
      html+=`<div class="script-row img-only-a">
        <span class="script-cat cat-${s.category}">${s.category}</span>
        <span class="script-host">${esc(s.host)}</span>
        <span class="script-path" title="${esc(s.path)}">${esc(s.path.length>50?'…'+s.path.slice(-47):s.path)}</span>
        <span class="script-flags">${s.async?'<span class="script-flag">async</span>':''}${s.defer?'<span class="script-flag">defer</span>':''}</span>
      </div>`;
    });
    html+='</div>';
  }

  // TO-BE only 3P detail
  if(onlyTH.length){
    html+=`<div class="audit-section"><div class="audit-section-title" style="color:var(--tobe)">TO-BE only 3P (${onlyTH.length} 도메인)</div>`;
    t3p.filter(s=>onlyTH.includes(s.host)).forEach(s=>{
      html+=`<div class="script-row img-only-t">
        <span class="script-cat cat-${s.category}">${s.category}</span>
        <span class="script-host">${esc(s.host)}</span>
        <span class="script-path" title="${esc(s.path)}">${esc(s.path.length>50?'…'+s.path.slice(-47):s.path)}</span>
        <span class="script-flags">${s.async?'<span class="script-flag">async</span>':''}${s.defer?'<span class="script-flag">defer</span>':''}</span>
      </div>`;
    });
    html+='</div>';
  }

  // 1P script count
  html+=`<div class="audit-section"><div class="audit-section-title">1st Party 스크립트</div>`;
  html+=`<div style="font-size:10px;color:var(--muted)">AS-IS <b>${a1p.length}</b>개 / TO-BE <b>${t1p.length}</b>개</div></div>`;

  return html;
}

// ═══════════════════════ Deep Diff (2차) ═══════════════════════

// ─── Word-level diff (Myers-like, simplified) ───
function wordDiff(oldStr,newStr){
  if(!oldStr&&!newStr) return[];
  if(!oldStr) return(newStr||'').split(/(\s+)/).map(w=>({type:'add',val:w}));
  if(!newStr) return(oldStr||'').split(/(\s+)/).map(w=>({type:'del',val:w}));
  const a=oldStr.split(/(\s+)/),b=newStr.split(/(\s+)/);
  // LCS-based diff
  const m=a.length,n=b.length;
  // For performance, limit to 200 tokens each
  if(m>200||n>200) return[{type:'del',val:oldStr.substring(0,300)+'…'},{type:'add',val:newStr.substring(0,300)+'…'}];
  const dp=Array.from({length:m+1},()=>new Uint16Array(n+1));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
  const result=[];let i=m,j=n;
  while(i>0||j>0){
    if(i>0&&j>0&&a[i-1]===b[j-1]){result.unshift({type:'eq',val:a[i-1]});i--;j--;}
    else if(j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])){result.unshift({type:'add',val:b[j-1]});j--;}
    else{result.unshift({type:'del',val:a[i-1]});i--;}
  }
  return result;
}

function renderWordDiff(diff){
  return diff.map(d=>{
    if(d.type==='eq') return `<span class="wdiff-eq">${esc(d.val)}</span>`;
    if(d.type==='add') return `<span class="wdiff-add">${esc(d.val)}</span>`;
    return `<span class="wdiff-del">${esc(d.val)}</span>`;
  }).join('');
}

// ─── Heading tree comparison ───
function renderHeadingTree(nodes,missing){
  const missSet=new Set((missing||[]).map(n=>n.text.toLowerCase()));
  return nodes.map(n=>{
    const indent=(n.level-1)*16;
    const isMiss=missSet.has(n.text.toLowerCase());
    const cls=isMiss?'htree-miss':'';
    return `<div class="htree-node" style="padding-left:${indent}px">
      <span class="htree-tag htree-tag-h${n.level}">${n.tag}</span>
      <span class="htree-text ${cls}">${esc(n.text)}</span>
    </div>`;
  }).join('');
}

function diffHeadings(aH,tH){
  const aSet=new Set(aH.map(h=>h.text.toLowerCase()));
  const tSet=new Set(tH.map(h=>h.text.toLowerCase()));
  const aMissing=tH.filter(h=>!aSet.has(h.text.toLowerCase())); // in TO-BE but not AS-IS
  const tMissing=aH.filter(h=>!tSet.has(h.text.toLowerCase())); // in AS-IS but not TO-BE
  return{aMissing,tMissing};
}

// ─── Spec table diff ───
function diffSpecs(aSpecs,tSpecs){
  const allKeys=[...new Set([...Object.keys(aSpecs),...Object.keys(tSpecs)])];
  return allKeys.map(k=>{
    const av=aSpecs[k]||null,tv=tSpecs[k]||null;
    let sev='ok';
    if(av&&!tv) sev='crit';
    else if(!av&&tv) sev='ok'; // new in TO-BE
    else if(av&&tv&&av!==tv) sev='warn';
    return{key:k,av,tv,sev};
  });
}

// ─── Deep Diff renderer ───
function renderDeepDiff(a,t){
  let html='';

  // 1. Heading tree comparison
  const aH=a.headings||[],tH=t.headings||[];
  const{aMissing,tMissing}=diffHeadings(aH,tH);
  html+='<div class="audit-section"><div class="audit-section-title">헤딩 트리 비교 (H1~H6)</div>';
  html+=`<div style="font-size:9px;color:var(--muted);margin-bottom:6px">AS-IS ${aH.length}개 / TO-BE ${tH.length}개 | <span style="color:var(--danger)">TO-BE 누락 ${tMissing.length}개</span> | <span style="color:var(--ok)">TO-BE 신규 ${aMissing.length}개</span></div>`;
  html+='<div class="htree-side">';
  html+='<div><div style="font-size:9px;font-weight:700;color:var(--asis);margin-bottom:4px">AS-IS</div><div class="htree">'+renderHeadingTree(aH,tMissing)+'</div></div>';
  html+='<div><div style="font-size:9px;font-weight:700;color:var(--tobe);margin-bottom:4px">TO-BE</div><div class="htree">'+renderHeadingTree(tH,aMissing)+'</div></div>';
  html+='</div>';
  if(tMissing.length){
    html+='<div style="margin-top:6px;font-size:10px;color:var(--danger)">';
    tMissing.forEach(h=>{html+=`<div>\u2022 <b>${h.tag}</b> "${esc(h.text)}" — TO-BE에 없음</div>`;});
    html+='</div>';
  }
  html+='</div>';

  // 2. Spec table key-value diff
  const aS=a.specs||{},tS=t.specs||{};
  const specDiffs=diffSpecs(aS,tS);
  if(specDiffs.length){
    const specMiss=specDiffs.filter(d=>d.sev==='crit').length;
    const specChg=specDiffs.filter(d=>d.sev==='warn').length;
    html+='<div class="audit-section"><div class="audit-section-title">스펙 테이블 Diff ('+specDiffs.length+'행)</div>';
    html+=`<div style="font-size:9px;color:var(--muted);margin-bottom:6px">TO-BE 누락 <span style="color:var(--danger)">${specMiss}건</span> | 값 변경 <span style="color:var(--warn)">${specChg}건</span></div>`;
    html+='<div class="spec-diff-row" style="font-weight:700;color:var(--muted);font-size:9px;text-transform:uppercase"><div>항목</div><div>AS-IS</div><div>TO-BE</div><div>상태</div></div>';
    specDiffs.forEach(d=>{
      html+=`<div class="spec-diff-row">
        <div class="spec-diff-key" title="${esc(d.key)}">${esc(d.key)}</div>
        <div class="spec-diff-val audit-val asis-v">${d.av?esc(d.av):'<span class="nv">-</span>'}</div>
        <div class="spec-diff-val audit-val tobe-v">${d.tv?esc(d.tv):'<span class="nv">-</span>'}</div>
        <div class="audit-badge badge-${d.sev}">${sevLabel(d.sev)}</div>
      </div>`;
    });
    html+='</div>';
  }

  // 3. Section text word-level diff
  const aST=a.sectionTexts||[],tST=t.sectionTexts||[];
  if(aST.length||tST.length){
    const aMap=new Map();aST.forEach(s=>aMap.set(s.title.toLowerCase(),s));
    const tMap=new Map();tST.forEach(s=>tMap.set(s.title.toLowerCase(),s));
    const matched=[];
    aMap.forEach((aS,key)=>{
      const tS=tMap.get(key);
      if(tS&&aS.text!==tS.text) matched.push({title:aS.title,aText:aS.text,tText:tS.text});
    });
    if(matched.length){
      html+='<div class="audit-section"><div class="audit-section-title">섹션별 텍스트 Word Diff ('+matched.length+'개 차이)</div>';
      matched.forEach(m=>{
        const diff=wordDiff(m.aText,m.tText);
        html+=`<div class="wdiff-title">${esc(m.title)}</div><div class="wdiff">${renderWordDiff(diff)}</div>`;
      });
      html+='</div>';
    }
  }

  if(!html) html='<div style="color:var(--muted);font-size:11px;text-align:center;padding:20px 0">비교 데이터가 없습니다</div>';
  $('deepRes').innerHTML=html;
}

// ─── Helpers ───
function fmtVal(v){
  if(v===null||v===undefined) return '<span class="nv">없음</span>';
  if(typeof v==='boolean') return v?'✓':'✗';
  if(typeof v==='number') return String(v);
  const s=String(v);
  return s.length>60?esc(s.substring(0,57))+'…':esc(s);
}
function sevLabel(s){return{crit:'CRIT',warn:'WARN',ok:'OK',na:'-'}[s]||'-';}
function esc(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ─── Export ───
function exportData(fmt){
  if(!lastAudit){toast('감사를 먼저 실행해주세요');return;}
  const model=$('modelInput').value||'unknown';
  if(fmt==='json'){
    dl(JSON.stringify(lastAudit,null,2),'audit-'+model+'.json','application/json');
  }else if(fmt==='csv'){
    const seo=buildSEOItems(lastAudit.asis.seo,lastAudit.tobe.seo);
    const ld=buildJSONLDItems(lastAudit.asis.jsonld,lastAudit.tobe.jsonld);
    const sec=buildSectionItems(lastAudit.asis.sections,lastAudit.tobe.sections);
    const all=[...seo,...ld,...sec];
    let csv='Group,Key,Severity,Detail\n';
    all.forEach(i=>{csv+=`"${i.group}","${i.key}","${i.sev}","${i.detail||''}"\n`;});
    dl(csv,'audit-'+model+'.csv','text/csv');
  }else if(fmt==='html'){
    const body=$('sp').innerHTML;
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PDP Audit - ${model}</title>
<style>body{font-family:system-ui;background:#0f1419;color:#e2e8f0;padding:20px;font-size:12px;}
.sev-cards{display:flex;gap:10px;margin-bottom:20px;}
.sev-card{flex:1;text-align:center;padding:15px;border-radius:8px;font-weight:700;}
.sev-crit{background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);}
.sev-warn{background:rgba(251,191,36,.15);color:#fbbf24;border:1px solid rgba(251,191,36,.3);}
.sev-ok{background:rgba(52,211,153,.15);color:#34d399;border:1px solid rgba(52,211,153,.3);}
.num{font-size:28px;}.lbl{font-size:10px;text-transform:uppercase;margin-top:4px;}
</style></head><body><h1>PDP Audit Report: ${model}</h1><p>Generated: ${new Date().toLocaleString()}</p><hr>
${$('auditSummary').innerHTML}${$('seoRes').innerHTML}${$('jsonldRes').innerHTML}${$('sectionsRes').innerHTML}${$('mediaRes').innerHTML}
</body></html>`;
    dl(html,'audit-'+model+'.html','text/html');
  }
  toast(fmt.toUpperCase()+' 다운로드 완료');
}
function dl(content,filename,type){
  const blob=new Blob([content],{type});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);
}

// ═══════════════════════ API List ═══════════════════════
function renderApiList(){
  if(!apiList.length){$('apiSt').style.display='block';$('apiCont').style.display='none';return;}
  $('apiSt').style.display='none';$('apiCont').style.display='block';
  const grouped={asis:[],tobe:[]};
  apiList.forEach(a=>{(grouped[a.role]||grouped.tobe).push(a);});
  let html=`<div style="font-size:10px;color:var(--muted);margin-bottom:8px">${apiList.length}개 API 캡처됨</div>`;
  ['asis','tobe'].forEach(role=>{
    const list=grouped[role];
    if(!list.length) return;
    const color=role==='asis'?'var(--asis)':'var(--tobe)';
    const label=role==='asis'?'AS-IS':'TO-BE';
    html+=`<div style="font-size:10px;font-weight:700;color:${color};margin:8px 0 4px">${label} (${list.length})</div>`;
    list.forEach((a,i)=>{
      const path=(a.url||'').replace(/https?:\/\/[^/]+/,'');
      const short=path.length>80?path.substring(0,77)+'…':path;
      const id=`api-${role}-${i}`;
      html+=`<div style="margin-bottom:6px">
        <div class="aurl" style="cursor:pointer;font-size:9px" onclick="document.getElementById('${id}').style.display=document.getElementById('${id}').style.display==='none'?'block':'none'" title="${esc(a.url)}">${a.time} ${esc(short)}</div>
        <div id="${id}" style="display:none"><pre style="font-family:monospace;font-size:9px;line-height:1.5;white-space:pre-wrap;word-break:break-word;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px;max-height:300px;overflow-y:auto;color:#a5f3fc">${esc(JSON.stringify(a.data,null,2))}</pre></div>
      </div>`;
    });
  });
  $('apiCont').innerHTML=html;
}

// ═══════════════════════ DOM Diff (existing) ═══════════════════════
function runDiff(){
  if(!aR&&!tR){toast('먼저 페이지를 로드해주세요');return;}
  rId=Date.now();pRes={};
  $('asisF').contentWindow?.postMessage({type:'DOM_EXTRACT_REQUEST',selectors:sel.map(s=>({key:s.key,selector:s.asis,all:s.all||false,textFilter:s.textFilter||''})),reqId:rId},'*');
  $('tobeF').contentWindow?.postMessage({type:'DOM_EXTRACT_REQUEST',selectors:sel.map(s=>({key:s.key,selector:s.tobe,all:s.all||false,textFilter:s.textFilter||''})),reqId:rId},'*');
  $('runDiff').textContent='\u23F3 추출 중...';$('runDiff').disabled=true;
  setTimeout(()=>{
    if(Object.keys(pRes).length<2){$('dres').innerHTML='<div style="color:var(--warn);font-size:11px;padding:10px;background:var(--surface2);border-radius:6px">\u26A0\uFE0F Cross-Origin 제한으로 DOM 접근 차단됨</div>';}
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
}

// ═══════════════════════ Performance (existing) ═══════════════════════
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
    ]},{title:'Page Load',items:[
      {label:'DOM Load',ak:'domLoad',fmt:fmtMs,lower:true,desc:'DOMContentLoaded'},
      {label:'Page Load',ak:'pageLoad',fmt:fmtMs,lower:true,desc:'Load Event End'},
    ]},{title:'Resources',items:[
      {label:'Total Size',ak:'totalSize',fmt:fmtSize,lower:true},
      {label:'Requests',ak:'totalRequests',fmt:v=>v+'건',lower:true},
      {label:'JS',ak:'jsSize',fmt:fmtSize,lower:true,count:'jsCount'},
      {label:'CSS',ak:'cssSize',fmt:fmtSize,lower:true,count:'cssCount'},
      {label:'Images',ak:'imgSize',fmt:fmtSize,lower:true,count:'imgCount'},
    ]},{title:'DOM Complexity',items:[
      {label:'DOM Nodes',ak:'domNodes',fmt:v=>v.toLocaleString()+'개',lower:true},
    ]},
  ];
  let html='<div class="perf-hdr"><span>Metric</span><span>AS-IS</span><span>TO-BE</span></div>';
  sections.forEach(sec=>{
    html+='<div class="perf-section"><div class="perf-section-title">'+sec.title+'</div>';
    sec.items.forEach(it=>{
      const av=a[it.ak]||0,tv=t[it.ak]||0;
      const af=it.fmt(av),tf=it.fmt(tv);
      let aw='',tw='';
      if(av!==tv&&av>0&&tv>0){if(it.lower){aw=av<=tv?'win':'lose';tw=tv<=av?'win':'lose';}else{aw=av>=tv?'win':'lose';tw=tv>=av?'win':'lose';}}
      const countInfo=it.count?(' ('+a[it.count]+'건 / '+t[it.count]+'건)'):'';
      const label=it.label+(it.desc?' <span style="color:var(--muted);font-size:9px">'+it.desc+'</span>':'');
      html+='<div class="perf-row"><div class="perf-label">'+label+'</div><div class="perf-val asis-v '+aw+'">'+af+'</div><div class="perf-val tobe-v '+tw+'">'+tf+'</div></div>';
    });html+='</div>';
  });
  $('perfRes').innerHTML=html;toast('성능 측정 완료');
}

// ═══════════════════════ UI (existing) ═══════════════════════
function initDiv(){
  const dv=$('divider'),ap=$('asisPW'),tp=$('tobePW');let drag=false;
  dv.onmousedown=e=>{drag=true;dv.classList.add('dragging');e.preventDefault();};
  document.onmousemove=e=>{if(!drag)return;const r=$('main').getBoundingClientRect();const c=Math.max(.2,Math.min(.8,(e.clientX-r.left)/r.width));ap.style.flex='none';ap.style.width=(c*100)+'%';tp.style.flex='1';};
  document.onmouseup=()=>{drag=false;dv.classList.remove('dragging');};
}
function toggleMobile(on){
  mobileOn=on;
  chrome.runtime.sendMessage({type:'SET_MOBILE_UA',enabled:on},()=>{
    ['asisPW','tobePW'].forEach(id=>{const el=$(id);el.classList.toggle('mobile-view',on);el.style.flex='';el.style.width='';});
    if(on&&pOpen){pOpen=false;$('sp').classList.add('collapsed');$('panelBtn').textContent='\u25C0 비교 패널';}
    toast(on?'모바일 모드 ON':'데스크톱 모드 복원');
    if(aR||tR){[$('asisF'),$('tobeF')].forEach(f=>{if(f.src)f.src=f.src;});aR=false;tR=false;fs('asis','loading');fs('tobe','loading');}
  });
}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(()=>el.classList.remove('show'),2500);}
init();
