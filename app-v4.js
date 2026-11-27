/* MDM, preuve de concept autonome. Aucune connexion au référentiel MDM.
   Les affaires et toutes les suggestions sont des données de démonstration.
   Le fichier choisi n'est ni lu ni transmis. */
(() => {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
  const unique = items => [...new Set(items.filter(Boolean))];
  const choose = (list, value, label='Sélectionner…') => `<option value="" ${!value?'selected':''}>${esc(label)}</option>` + list.map(x=>`<option value="${esc(x)}" ${x===value?'selected':''}>${esc(x)}</option>`).join('');
  const LANGUAGES = [
    'Allemand','Anglais','Bulgare','Croate','Danois','Espagnol','Estonien','Finnois',
    'Français','Grec','Hongrois','Irlandais','Italien','Letton','Lituanien','Maltais',
    'Néerlandais','Polonais','Portugais','Roumain','Slovaque','Slovène','Suédois','Tchèque'
  ];
  const INDEXATION_TYPES = [
    'Indicateurs (Préexamen)',
    'Descripteurs (Préexamen)',
    "Mots-clés (Acte Introdutif de l'Instance)",
    "Objet (Acte Introdutif de l'Instance)",
    'Indicateurs (Premier contrôle du Pourvoi)',
    'Descripteurs (Premier contrôle du Pourvoi)',
    "Indicateurs (Demande d'admission du Pourvoi)",
    'Indicateurs (Conclusions/Prise de position de l’AG)',
    'Indicateurs (Arrêt/Ordonnance/Avis)',
    'Chaine de mots-clés (Sommaire/Résumé)'
  ];
  const MULTILINE_TYPES = new Set([INDEXATION_TYPES[1],INDEXATION_TYPES[5],INDEXATION_TYPES[9]]);
  const MATIERE_TYPES = new Set([INDEXATION_TYPES[4],INDEXATION_TYPES[5],INDEXATION_TYPES[6],INDEXATION_TYPES[7],INDEXATION_TYPES[8],INDEXATION_TYPES[9]]);
  const DOCUMENT_TYPES = [
    'Demande de décision préjudicielle (DDP)', "Demande d'avis", 'Requête en pourvoi', 'Requête',
    "Conclusions de l'AG", "Prise de position de l'AG", 'Arrêt','Ordonnance','Avis'
  ];
  const JURIDICTIONS = ['Cour','Tribunal','Guichet Unique'];
  const FORCED_DOCUMENT = new Map([
    [INDEXATION_TYPES[0], DOCUMENT_TYPES[0]], [INDEXATION_TYPES[1], DOCUMENT_TYPES[0]],
    [INDEXATION_TYPES[4], DOCUMENT_TYPES[2]], [INDEXATION_TYPES[5], DOCUMENT_TYPES[2]],
    [INDEXATION_TYPES[6], DOCUMENT_TYPES[2]]
  ]);
  // Trois types autorisés uniquement pour Sommaire/Résumé, autres correspondances à confirmer.
  const RESTRICTED_DOCUMENT = new Map([[INDEXATION_TYPES[9],['Arrêt','Ordonnance','Avis']]]);
  const AFFAIRES = [
    {id:'DEMO-C-101/26',jurisdiction:'Cour',year:'2026',order:'101',archetype:'Renvoi préjudiciel',publishedId:'C-101/26',usual:'Affaire de démonstration A',matter:'Marché intérieur'},
    {id:'DEMO-C-238/25',jurisdiction:'Cour',year:'2025',order:'238',archetype:'Pourvoi',publishedId:'C-238/25 P',usual:'Affaire de démonstration B',matter:'Droit institutionnel'},
    {id:'DEMO-C-417/26',jurisdiction:'Cour',year:'2026',order:'417',archetype:'Demande d’avis',publishedId:'C-417/26',usual:'Affaire de démonstration C',matter:'Relations extérieures'},
    {id:'DEMO-T-089/24',jurisdiction:'Tribunal',year:'2024',order:'89',archetype:'Recours direct',publishedId:'T-89/24',usual:'Affaire de démonstration D',matter:'Propriété intellectuelle'},
    {id:'DEMO-T-156/25',jurisdiction:'Tribunal',year:'2025',order:'156',archetype:'Recours direct',publishedId:'T-156/25',usual:'Affaire de démonstration E',matter:'Droit de la concurrence'},
    {id:'DEMO-GU-014/26',jurisdiction:'Guichet Unique',year:'2026',order:'14',archetype:'Procédure à préciser',publishedId:'GU-14/26',usual:'Affaire de démonstration F',matter:'Matière non précisée'}
  ];
  const TERM_POOLS = {
    indicateurs:["Droit de l'Union européenne",'Recours en annulation','Recevabilité','Intérêt à agir','Renvoi préjudiciel','Compétence juridictionnelle','Interprétation','Principe de proportionnalité','Délai de recours',"Obligation de motivation",'Protection juridictionnelle effective','Contrôle juridictionnel','Liberté de prestation de services','Droits fondamentaux',"Application du droit de l'Union",'Champ d’application du règlement','Conditions de recevabilité','Décision attaquée','Juridiction de renvoi','Marché intérieur','Mesures provisoires','Contrôle de légalité','Responsabilité des États membres'],
    descripteurs:["Droit de l'Union européenne",'Annulation','Conditions de recevabilité','Intérêt à agir','Acte attaqué','Moyens du recours','Examen des moyens','Contrôle juridictionnel','Proportionnalité','Compétence','Sécurité juridique','Égalité de traitement','Protection des données','Application du règlement','Règles de preuve','Droits de la défense','Légalité de la décision','Effet direct','Procédure devant le Tribunal'],
    mots:["Droit de l'Union européenne",'Renvoi préjudiciel','Interprétation','Marché intérieur','Libre circulation','Droit de la concurrence','Protection du consommateur','Propriété intellectuelle',"Marque de l'Union européenne",'Procédure juridictionnelle','Recevabilité','Contrôle juridictionnel','Motivation de la décision','Recours','Droit de l’environnement']
  };
  const AI_TERMS = ['Nouvelle articulation des moyens *','Contrôle spécifique des conséquences juridiques *','Qualification inédite de la procédure *','Nouvelle approche de recevabilité *','Critère juridique complémentaire proposé *'];
  const LINK_FOLLOW = {
    'Recours en annulation':['Recevabilité','Intérêt à agir','Délai de recours'],
    'Recevabilité':['Intérêt à agir','Conditions de recevabilité','Compétence juridictionnelle'],
    'Annulation':['Conditions de recevabilité','Examen des moyens','Intérêt à agir'],
    'Renvoi préjudiciel':['Interprétation',"Droit de l'Union européenne",'Juridiction de renvoi'],
    'Contrôle juridictionnel':['Proportionnalité','Obligation de motivation','Droits fondamentaux'],
    'Interprétation':['Application du règlement','Effet direct','Champ d’application du règlement']
  };
  const REFERENCE_CHAINS = [
    ["Droit de l'Union européenne",'Recours en annulation','Recevabilité'],
    ['Renvoi préjudiciel','Interprétation','Compétence juridictionnelle'],
    ['Acte attaqué','Annulation','Examen des moyens'],
    ['Marché intérieur','Libre circulation','Proportionnalité'],
    ['Contrôle juridictionnel','Obligation de motivation','Droits fondamentaux'],
    ['Protection des données','Droits de la défense','Contrôle de légalité']
  ];
  const HISTORICAL_CHAINS = [
    ['Recours en annulation','Recevabilité','Intérêt à agir'],
    ["Droit de l'Union européenne",'Renvoi préjudiciel','Interprétation'],
    ['Acte attaqué','Moyens du recours','Contrôle juridictionnel'],
    ['Marché intérieur','Proportionnalité','Sécurité juridique'],
    ['Protection juridictionnelle effective','Conditions de recevabilité','Délai de recours'],
    ['Libre circulation','Application du règlement','Droits fondamentaux']
  ];
  function dayLocal() {
    const d=new Date();const n=x=>String(x).padStart(2,'0');
    return `${d.getFullYear()}-${n(d.getMonth()+1)}-${n(d.getDate())}`;
  }
  function defaultData(){return {format:'terms',lines:[[]],activeLine:0};}
  function newState(){return {step:0,maxStep:1,kind:'new',indexationType:'',workLanguage:'Français',jurisdiction:'',documentType:'',documentLanguage:'',affaire:'',fileName:'',date:dayLocal(),year:'',order:'',archetype:'',publishedId:'',usual:'',matter:'',indexation:defaultData(),status:'',seed:Math.floor(Math.random()*99999)};}
  let state=newState();
  // Historique local des modifications de l'éditeur, indépendant des brouillons MDM.
  const undoStack=[], redoStack=[];
  let typingSnapshot=null;
  function historySnapshot(){
    const data=state.indexation;
    return JSON.stringify(data.format==='text'
      ? {format:'text',text:data.text||''}
      : {format:'terms',lines:(data.lines||[]).map(line=>[...line])});
  }
  function updateHistoryButtons(){
    const undo=$('[data-action="history-undo"]'),redo=$('[data-action="history-redo"]');
    if(undo)undo.disabled=!undoStack.length && (typingSnapshot===null || typingSnapshot===historySnapshot());
    if(redo)redo.disabled=!redoStack.length;
  }
  function saveHistory(before){
    if(before===historySnapshot())return;
    if(undoStack[undoStack.length-1]!==before)undoStack.push(before);
    if(undoStack.length>60)undoStack.shift();
    redoStack.length=0;
    updateHistoryButtons();
  }
  function startTyping(){if(typingSnapshot===null)typingSnapshot=historySnapshot();}
  function finishTyping(){const previous=typingSnapshot;typingSnapshot=null;if(previous!==null)saveHistory(previous);}
  function beforeEdit(){
    finishTyping();
    const current=historySnapshot();
    if(undoStack[undoStack.length-1]!==current)undoStack.push(current);
    if(undoStack.length>60)undoStack.shift();
    redoStack.length=0;
    updateHistoryButtons();
  }
  function resetEditHistory(){typingSnapshot=null;undoStack.length=0;redoStack.length=0;updateHistoryButtons();}
  function restoreHistory(snapshot){
    const data=JSON.parse(snapshot);
    const currentLine=state.indexation.activeLine||0;
    state.indexation=data.format==='text'
      ? {format:'text',text:data.text||''}
      : {format:'terms',lines:data.lines,activeLine:Math.min(currentLine,Math.max(0,data.lines.length-1))};
    renderEditorPage();
  }
  function historyUndo(){
    finishTyping();
    if(!undoStack.length)return;
    const current=historySnapshot(), previous=undoStack.pop();
    redoStack.push(current);restoreHistory(previous);
  }
  function historyRedo(){
    finishTyping();
    if(!redoStack.length)return;
    const current=historySnapshot(),next=redoStack.pop();
    undoStack.push(current);restoreHistory(next);
  }

  let toastTimer=null;
  let dragInfo=null;
  let modalAction=null;

  const view=$('#view'), footer=$('#footerActions'), fileInput=$('#fileInput'), dialog=$('#confirmationDialog');
  function toast(message){const el=$('#toast');clearTimeout(toastTimer);el.textContent=message;el.classList.add('visible');toastTimer=setTimeout(()=>el.classList.remove('visible'),3600);}
  function currentCase(){return AFFAIRES.find(a=>a.id===state.affaire);}
  function possibleCases(){return AFFAIRES.filter(a=>!state.jurisdiction||a.jurisdiction===state.jurisdiction);}
  function hasMatter(){return MATIERE_TYPES.has(state.indexationType);}
  function canMultipleLines(){return MULTILINE_TYPES.has(state.indexationType);}
  function isFreeText(){return state.indexationType===INDEXATION_TYPES[3];}
  function allowedDocs(){return FORCED_DOCUMENT.has(state.indexationType)?[FORCED_DOCUMENT.get(state.indexationType)]:RESTRICTED_DOCUMENT.get(state.indexationType)||DOCUMENT_TYPES;}
  function docLocked(){return !!state.indexationType && !!FORCED_DOCUMENT.has(state.indexationType);}
  function poolKind(){return state.indexationType.startsWith('Descripteurs')?'descripteurs':state.indexationType.includes('Mots-clés')||state.indexationType.startsWith('Chaine')?'mots':'indicateurs';}
  function pool(){return TERM_POOLS[poolKind()];}
  function getLine(line){return state.indexation.lines[line]||[];}
  function activeLine(){return getLine(state.indexation.activeLine||0);}
  function hashText(value){let h=11;for(const c of String(value))h=(h*31+c.charCodeAt(0))>>>0;return h;}
  function rotate(a,offset){return a.length?[...a.slice(offset%a.length),...a.slice(0,offset%a.length)]:[];}
  function updateCase(){const a=currentCase();Object.assign(state,{
    year:a?.year||'',order:a?.order||'',archetype:a?.archetype||'',publishedId:a?.publishedId||'',usual:a?.usual||'',matter:a?.matter||''
  });}
  function updateType(){resetEditHistory();const allowed=allowedDocs();if(!allowed.includes(state.documentType))state.documentType=docLocked()?allowed[0]:'';state.indexation=isFreeText()?{format:'text',text:''}:defaultData();state.seed=Math.floor(Math.random()*99999);}
  function clearFile(){state.fileName='';fileInput.value='';}
  function clearWork(){resetEditHistory();state=newState();clearFile();dialog.hidden=true;render();view.scrollTop=0;}
  function saveSnapshot(status){
    try {
      const previous=JSON.parse(localStorage.getItem('mdm-poc2-work-snapshots-v1')||'[]');
      const copy=JSON.parse(JSON.stringify({...state,status,savedAt:new Date().toISOString()}));
      const rows=Array.isArray(previous)?previous:[];
      rows.unshift(copy);localStorage.setItem('mdm-poc2-work-snapshots-v1',JSON.stringify(rows.slice(0,15)));
      return true;
    }catch(e){toast('Stockage local indisponible. Aucun enregistrement MDM.');return false;}
  }
  function showModal(title,detail,callback){$('#confirmationTitle').textContent=title;$('#confirmationMessage').textContent=detail;modalAction=callback||null;dialog.hidden=false;$('#confirmationOk').focus();}
  $('#confirmationOk').addEventListener('click',()=>{dialog.hidden=true;const f=modalAction;modalAction=null;if(f)f();});
  function startWork(){clearWork();state.step=1;render();view.scrollTop=0;}
  function navigate(target){
    if(target===0){state.step=0;render();view.scrollTop=0;return;}
    if(target===1&&state.step===0){startWork();return;}
    if(target<1||target>state.maxStep)return;
    state.step=target;render();view.scrollTop=0;
  }
  function checkMeta(){
    if(!state.indexationType){toast("Sélectionnez le type d'indexation.");return false;}
    if(!state.jurisdiction){toast('Sélectionnez une juridiction.');return false;}
    if(!state.documentType){toast('Sélectionnez le type de document.');return false;}
    if(!allowedDocs().includes(state.documentType)){toast('Ce type de document ne correspond pas au type d’indexation.');return false;}
    return true;
  }
  function advanceTo(target){if(target===2&&!checkMeta())return;if(target===3&&!resultText()){toast("Saisissez le résultat d'indexation avant la révision.");return;}if(target===3)normalizeBeforeReview();state.maxStep=Math.max(state.maxStep,target);state.step=target;render();view.scrollTop=0;}
  function renderChrome(){
    const crumbs=[{label:"Travail d'indexation",step:0}];
    if(state.step>=1)crumbs.push({label:'Nouvelle indexation',step:1});
    if(state.step>=2)crumbs.push({label:'Indexation',step:2});
    if(state.step>=3)crumbs.push({label:'Révision',step:3});
    $('#breadcrumbs').innerHTML=crumbs.map((o,i)=>(i?'<span class="crumb-sep">›</span>':'')+`<button type="button" class="crumb-link ${o.step===state.step?'crumb-current':''}" data-nav-step="${o.step}" ${o.step===state.step?'aria-current="step"':''}>${esc(o.label)}</button>`).join('');
    $$('.numbered-step').forEach(b=>{const n=Number(b.dataset.step);b.disabled=state.step===0||n>state.maxStep;b.classList.toggle('active',n===state.step);b.classList.toggle('disabled',b.disabled);});
    $('.menu-choice:not(:disabled)')?.classList.toggle('active',state.step===1);
  }
  function actionButton(label,act,primary=false){return `<button type="button" class="${primary?'primary-btn':'plain-btn'}" data-action="${act}">${label}</button>`;}
  function footerSet(left,mid,right){footer.classList.add('spaced');footer.innerHTML=`<div class="left-actions">${left||''}</div><div class="middle-actions">${mid||''}</div><div class="right-actions">${right||''}</div>`;}
  function render(){renderChrome();if(state.step===0)renderHome();else if(state.step===1)renderForm();else if(state.step===2)renderEditorPage();else renderReview();}
  function renderHome(){
    view.innerHTML=`<div class="page-head"><h1>Travail d'indexation</h1><p>Choisissez une opération.</p></div>
      <div class="home-choice-grid">
        <button class="home-tile" data-action="new-work" type="button"><span class="home-illustration">＋</span><strong>Nouvelle indexation</strong><p>Créer un nouveau travail d'indexation et renseigner les métadonnées.</p></button>
        <button class="home-tile" type="button" disabled title="Non disponible dans la PoC"><span class="home-illustration">✎</span><strong>Modifier une indexation</strong><p>Fonctionnalité prévue, pas encore développée.</p></button>
      </div>`;
    footer.classList.remove('spaced');footer.innerHTML='';
  }
  const metaRow=(label,id,field,extra='')=>`<label for="${id}">${label}</label>${field}${extra}`;
  function caseSection(){
    const data=[['Année','year'],['Ordre','order'],['Archétype procédural','archetype'],['Id Publié','publishedId'],['Nom usuel','usual']];
    if(hasMatter())data.push(['Matière','matter']);
    return data.map(([label,key])=>metaRow(label,'case-'+key,`<input id="case-${key}" value="${esc(state[key])}" readonly placeholder="Complété après sélection de l'affaire">`)).join('');
  }
  function renderForm(){
    const c=allowedDocs();
    view.innerHTML=`<div class="page-head"><h1>Travail d'indexation</h1><p>Renseignez les métadonnées, puis sélectionnez le document.</p></div>
      <div class="work-layout">
        <div class="work-column">
          <section class="card"><div class="card-head">Métadonnées du travail d'indexation</div><div class="card-body"><div class="form-grid">
            ${metaRow("Type d'indexation <span class='required'>*</span>",'indexationType',`<select id="indexationType" data-meta="indexationType">${choose(INDEXATION_TYPES,state.indexationType)}</select>`)}
            ${metaRow("Langue du travail d'indexation",'workLanguage',`<select id="workLanguage" data-meta="workLanguage">${choose(LANGUAGES,state.workLanguage)}</select>`)}
            ${metaRow("Juridiction <span class='required'>*</span>",'jurisdiction',`<select id="jurisdiction" data-meta="jurisdiction">${choose(JURIDICTIONS,state.jurisdiction)}</select>`)}
          </div></div></section>
          <section class="card"><div class="card-head">Métadonnées du document</div><div class="card-body"><div class="form-grid">
            ${metaRow("Type de document <span class='required'>*</span>",'documentType',`<select id="documentType" data-meta="documentType" ${docLocked()?'disabled':''}>${choose(c,state.documentType)}</select>`)}
            ${metaRow('Langue du document','documentLanguage',`<select id="documentLanguage" data-meta="documentLanguage">${choose(LANGUAGES,state.documentLanguage)}</select>`)}
          </div>${state.indexationType&&c.length<9?'<p class="case-help">Le choix du document est limité par le type d’indexation sélectionné.</p>':''}</div></section>
        </div>
        <section class="card"><div class="card-head">Métadonnées de l'affaire</div><div class="card-body"><div class="form-grid">
          ${metaRow('Affaire','affaire',`<select id="affaire" data-meta="affaire">${choose(possibleCases().map(a=>a.id),state.affaire)}</select>`)}
          ${caseSection()}
        </div></div></section>
      </div>
      <section class="card work-file-card"><div class="card-head">Document</div><div class="card-body">
        <div class="file-row" id="fileDropZone"><button type="button" class="outline-btn" data-action="attach-file">📎 &nbsp;Sélectionner le fichier…</button>
        <div class="file-name ${state.fileName?'':'empty'}"><span>${esc(state.fileName||'Aucun fichier sélectionné')}</span>${state.fileName?'<button type="button" class="tiny-icon-btn" data-action="remove-file" aria-label="Retirer le fichier">×</button>':''}</div></div>
      </div></section>`;
    footerSet(actionButton('Annuler','cancel'),'',actionButton('Suivant','next-form',true));
  }
  function summaryCards(){
    const kv=(rows)=>`<dl class="facts">${rows.filter(x=>x[1]!==undefined).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v||'—')}</dd>`).join('')}</dl>`;
    return `<section class="card"><div class="card-head">Travail d'indexation</div>${kv([["Type d'indexation",state.indexationType],["Langue du travail d'indexation",state.workLanguage]])}</section>
      <section class="card"><div class="card-head">Document</div>${kv([['Type de document',state.documentType],['Langue du document',state.documentLanguage],['Fichier',state.fileName]])}</section>
      <section class="card"><div class="card-head">Affaire</div>${kv([['Juridiction',state.jurisdiction],['Affaire',state.affaire],['Année',state.year],['Ordre',state.order],['Archétype procédural',state.archetype],['Id Publié',state.publishedId],['Nom usuel',state.usual],...(hasMatter()?[['Matière',state.matter]]:[])])}</section>`;
  }

  // Vocabulaire DE DÉMONSTRATION. Ne pas confondre avec le référentiel MDM.
  const DEMO_TERM_SET=new Set([
    ...Object.values(TERM_POOLS).flat(),...REFERENCE_CHAINS.flat(),...HISTORICAL_CHAINS.flat()
  ].map(norm));
  function termKind(term){
    if(!String(term||'').trim())return '';
    if(/\*\s*$/.test(term))return 'ia';
    return DEMO_TERM_SET.has(norm(term))?'demo':'new';
  }
  function termKindLabel(kind){
    return kind==='ia'?'Suggestion intelligente (*) : simulée'
      :kind==='demo'?'Terme présent dans les exemples de la PoC (non vérifié dans MDM)'
      :'Nouveau terme à vérifier (référentiel MDM non connecté)';
  }
  function approxDistance(a,b,limit=2){
    if(Math.abs(a.length-b.length)>limit)return limit+1;
    let prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      const next=[i];let min=i;
      for(let j=1;j<=b.length;j++){
        const cost=a[i-1]===b[j-1]?0:1;
        const value=Math.min(prev[j]+1,next[j-1]+1,prev[j-1]+cost);
        next[j]=value;min=Math.min(min,value);
      }
      if(min>limit)return limit+1;
      prev=next;
    }
    return prev[b.length];
  }
  function demoSearch(query){
    const q=norm(query);
    if(!q)return nextTerms().map(term=>({term,approx:false}));
    const candidates=unique([...pool(),...REFERENCE_CHAINS.flat(),...HISTORICAL_CHAINS.flat(),...AI_TERMS]);
    const ranked=candidates.map((term,index)=>{
      const target=norm(term.replace(/\s*\*$/,''));
      let rank=target===q?0:target.startsWith(q)?1:target.includes(q)?2:99;
      if(rank===99&&q.length>=4){
        const limit=q.length>8?2:1;
        const words=target.split(/[\s'’\-]+/).filter(Boolean);
        const distance=Math.min(approxDistance(q,target,limit),...words.map(word=>approxDistance(q,word,limit)));
        if(distance<=limit)rank=3+distance;
      }
      return {term,rank,index,approx:rank>=3&&rank<99};
    }).filter(item=>item.rank!==99);
    return ranked.sort((a,b)=>a.rank-b.rank||a.index-b.index).slice(0,3);
  }


  // Correcteur orthographique natif. Aucun texte transmis à un service externe.
  const SPELLING_LANG = {
    'Allemand':'de','Anglais':'en','Bulgare':'bg','Croate':'hr','Danois':'da',
    'Espagnol':'es','Estonien':'et','Finnois':'fi','Français':'fr','Grec':'el',
    'Hongrois':'hu','Irlandais':'ga','Italien':'it','Letton':'lv','Lituanien':'lt',
    'Maltais':'mt','Néerlandais':'nl','Polonais':'pl','Portugais':'pt',
    'Roumain':'ro','Slovaque':'sk','Slovène':'sl','Suédois':'sv','Tchèque':'cs'
  };
  function spellingLanguage(){return SPELLING_LANG[state.workLanguage]||'fr';}
  // Majuscule de la première lettre de chaque maillon; ne modifie pas le reste.
  function capitalizeMaillon(value){
    return String(value??'').replace(/^(\s*["'«“‘(\[]*\s*)(\p{L})/u,
      (_,before,letter)=>before+letter.toLocaleUpperCase(spellingLanguage()));
  }
  function normalizeBeforeReview(){
    if(isFreeText())return;
    const normalized=state.indexation.lines.map(line=>line.map(capitalizeMaillon));
    if(JSON.stringify(normalized)===JSON.stringify(state.indexation.lines))return;
    beforeEdit();
    state.indexation.lines=normalized;
  }

  function termChip(line,index,value,isEmpty=false){
    return `<div class="term-wrap" data-drag-line="${line}" data-drag-index="${index}">
      ${index?'<span class="term-divider">-</span>':''}
      <div class="term-chip ${isEmpty?'input-empty':'term-kind-'+termKind(value)}" title="${esc(isEmpty?'':termKindLabel(termKind(value)))}">
        ${isEmpty?'':`<button type="button" class="drag-handle" draggable="true" aria-label="Déplacer le maillon ${index+1}" title="Cliquer-glisser pour réordonner">⠿</button>`}
        <textarea rows="2" data-term-line="${line}" data-term-index="${index}" aria-label="Ligne ${line+1}, maillon ${index+1}" autocomplete="off" spellcheck="true" lang="${esc(spellingLanguage())}" autocapitalize="sentences" title="Orthographe : clic droit pour les corrections du navigateur" placeholder="${isEmpty?'Terme suivant…':''}">${esc(value)}</textarea>
        ${isEmpty?'':`<button type="button" class="remove-term" data-action="remove-term" data-line="${line}" data-index="${index}" title="Supprimer ce terme" aria-label="Supprimer le terme">×</button>`}
      </div><div class="dropdown" hidden></div></div>`;
  }
  function renderLine(lineIndex,terms){
    const title=canMultipleLines()?`<div class="editor-line-head"><span class="line-number">Ligne ${lineIndex+1}</span><div class="line-actions">${lineIndex>0?`<button type="button" data-action="remove-line" data-line="${lineIndex}">Supprimer la ligne</button>`:''}</div></div>`:'';
    return `<div class="editor-line" data-line="${lineIndex}">${title}<div class="chip-list">${terms.map((t,i)=>termChip(lineIndex,i,t)).join('')}${termChip(lineIndex,terms.length,'',true)}</div></div>`;
  }
  function renderMiddle(){
    const data=state.indexation;
    const body=data.format==='text'
      ? `<textarea class="free-text" id="freeText" data-free-text spellcheck="true" lang="${esc(spellingLanguage())}" autocapitalize="sentences" placeholder="Saisissez l'objet ou choisissez une proposition de texte…">${esc(data.text)}</textarea><p class="editor-hint">Texte libre : une seule réponse finale.</p>`
      : `<div>${data.lines.map((line,i)=>renderLine(i,line)).join('')}${canMultipleLines()?'<button type="button" class="line-add" data-action="add-line">+ Ajouter une ligne</button>':''}<p class="editor-hint"><kbd>Tab</kbd> ou <kbd>Entrée</kbd> crée le maillon suivant. Déplacez les maillons par cliquer-glisser. Le résultat peut être long.</p><div class="term-legend"><span class="legend-demo">Exemple PoC</span><span class="legend-new">Nouveau terme</span><span class="legend-ia">Suggestion IA *</span><small>Statuts indicatifs : aucun référentiel MDM connecté.</small></div></div>`;
    return `<section class="card type-editor type-editor-active"><div class="card-head type-editor-head"><span>${esc(state.indexationType)} <small class="editing-badge">En cours</small></span><div class="edit-header-actions"><button class="plain-btn history-btn" type="button" data-action="history-undo" title="Annuler (Ctrl+Z)" ${undoStack.length?'':'disabled'}>↶ Annuler</button><button class="plain-btn history-btn" type="button" data-action="history-redo" title="Rétablir (Ctrl+Y)" ${redoStack.length?'':'disabled'}>↷ Rétablir</button><button class="tiny-icon-btn" type="button" data-action="clear-result" title="Effacer l'indexation">×</button></div></div><div class="editor-area">${body}</div></section>`;
  }
  function nextTerms(line=state.indexation.activeLine,position=null){
    const arr=getLine(line).filter(x=>x.trim());const idx=position===null?arr.length:position;
    const last=arr[Math.max(0,idx-1)]||'';
    const known=arr.map(norm);const source=pool();
    const offset=hashText(`${state.indexationType}|${state.affaire}|${state.seed}|${line}|${idx}|${last}`);
    const first=(LINK_FOLLOW[last]||[]).filter(x=>source.includes(x)&&!known.includes(norm(x)));
    const rest=rotate(source,offset%source.length).filter(x=>!known.includes(norm(x)));
    const ai=AI_TERMS[(offset+idx)%AI_TERMS.length];
    return unique([...first,...rest].slice(0,2).concat([ai])).slice(0,3);
  }
  function chainSamples(bank){
    const shift=hashText(`${state.indexationType}|${state.affaire}|${state.seed}|${state.indexation.activeLine}`);
    return rotate(bank,shift%bank.length).slice(0,3).map(arr=>arr.join(' - '));
  }
  function renderSuggestions(){
    const data=state.indexation;
    const ctx=`<div class="suggest-context">Type : <strong>${esc(state.indexationType)}</strong><br><small>Exemples simulés, sans moteur d'IA connecté</small></div>`;
    const renderBtns=(values,action,source='')=>values.map(text=>`<button class="suggestion ${text.endsWith('*')?'ai-suggestion':''}" type="button" data-action="${action}" data-source="${esc(source)}" data-value="${esc(text)}">${esc(text)}</button>`).join('');
    if(data.format==='text'){
      const texts=["Objet de la demande relatif à l'interprétation du droit de l'Union.","Examen de la recevabilité du recours dans le contexte de l'affaire.","Question concernant le champ d'application d'un acte de l'Union."];
      const phrases=['Recevabilité du recours','Interprétation du droit de l’Union','Approche complémentaire suggérée par l’IA *'];
      return `<div class="suggest-body">${ctx}<h3>Terme</h3>${renderBtns(phrases,'add-suggested-term')}
        <div class="suggest-sep"></div><h3>Chaîne de référence</h3><p class="muted-hint">Non applicable au champ Objet (texte libre).</p>
        <div class="suggest-sep"></div><h3>Chaîne d'indexation</h3>${renderBtns(texts,'apply-text')}
        <p class="muted-hint">* Suggestion intelligente (IA), à vérifier.</p></div>`;
    }
    return `<div class="suggest-body">${ctx}<h3>Terme</h3>${renderBtns(nextTerms(),'add-suggested-term')}<div class="suggest-sep"></div><h3>Chaîne de référence</h3>${renderBtns(chainSamples(REFERENCE_CHAINS),'apply-chain','Chaîne de référence')}<div class="suggest-sep"></div><h3>Chaîne d'indexation</h3>${renderBtns(chainSamples(HISTORICAL_CHAINS),'apply-chain',"Chaîne d'indexation")}<p class="muted-hint">* Suggestion intelligente (IA). Les nouveaux termes nécessitent une vérification.</p></div>`;
  }
  function renderEditorPage(){
    view.innerHTML=`<div class="page-head"><h1>Indexation</h1><p>Construisez le résultat terme par terme, ou choisissez une suggestion.</p></div>
    <div class="edit-grid suggestions-below"><aside class="edit-left">${summaryCards()}</aside><div class="edit-main">${renderMiddle()}</div>
    <aside class="edit-right"><section class="card"><div class="card-head">Suggestions</div><div id="recommendationsContent">${renderSuggestions()}</div></section></aside></div>`;
    positionSuggestionColumns();
    footerSet(actionButton('Précédent','previous'),actionButton('Sauvegarder (brouillon)','save-draft'),actionButton('Suivant','next-review',true));
    resizeTerms();updateHistoryButtons();
  }
  function resultLines(){if(isFreeText())return [state.indexation.text.trim()].filter(Boolean);return state.indexation.lines.map(arr=>arr.map(x=>x.trim()).filter(Boolean).join(' - ')).filter(Boolean);}
  function resultText(){return resultLines().join('\n');}
  function hasAi(){return resultText().split('\n').some(x=>x.includes('*'));}
  function newTerms(){if(isFreeText())return [];return unique(state.indexation.lines.flat().map(x=>x.trim()).filter(x=>termKind(x)==='new'));}

  // Les listes sont repliées par défaut et référencent un maillon précis.
  function reviewEntries(kind){
    if(isFreeText()){
      return kind==='ia' && hasAi() ? [{term:state.indexation.text.trim(),line:0,index:-1}] : [];
    }
    return state.indexation.lines.flatMap((terms,line)=>
      terms.map((term,index)=>({term,line,index})).filter(item=>termKind(item.term)===kind));
  }
  function reviewCheck(kind,items){
    const isNew=kind==='new';
    const heading=isNew?'Nouveau terme':'Suggestion intelligente (*)';
    const count=items.length;
    const small=isNew?(count?count+' à vérifier':'Aucun terme nouveau')
      :(count?count+' suggestion'+(count>1?'s':'')+' IA':'Aucune suggestion IA');
    const empty=isNew?'Aucun nouveau terme détecté dans les exemples de la PoC.'
      :'Aucune suggestion IA retenue dans le résultat.';
    const list=count?items.map(item=>{
      const location=item.index<0?'Texte libre':canMultipleLines()
        ?'Ligne '+(item.line+1)+' · Maillon '+(item.index+1):'Maillon '+(item.index+1);
      return '<div class="review-check-term">' +
        '<div class="review-check-term-copy"><span class="review-check-term-text" title="'+esc(item.term)+'">'+esc(item.term)+'</span>' +
        '<small>'+location+'</small></div>' +
        '<button type="button" class="review-edit-term" data-action="review-edit-term" data-line="'+item.line+
        '" data-index="'+item.index+'" aria-label="Modifier le maillon : '+esc(item.term)+
        '" title="Revenir au maillon et le modifier">✎ Modifier</button></div>';
    }).join(''):'<p class="review-no-terms">'+empty+'</p>';
    return '<details class="review-check-detail">' +
      '<summary class="review-check-row" aria-label="'+heading+' : afficher les détails">' +
        '<span class="check-dot '+(count?'review-caution':'')+'">'+(count?'!':'✓')+'</span>' +
        '<span class="review-check-copy"><strong>'+heading+'</strong><small>'+small+'</small></span>' +
        '<span class="review-check-state '+(count?'needs-review':'')+'">'+(count?'À vérifier':'OK')+'</span>' +
        '<span class="review-check-chevron" aria-hidden="true">⌄</span>' +
      '</summary><div class="review-check-expanded">'+list+'</div></details>';
  }
  function editTermFromReview(line,index){
    if(state.step!==3)return;
    const free=isFreeText();
    if(!free && (!Number.isInteger(line)||!Number.isInteger(index)||line<0||index<0||!getLine(line)[index]))return;
    state.indexation.activeLine=free?0:line;
    navigate(2);
    const input=free?$('[data-free-text]'):
      $('[data-term-line="'+line+'"][data-term-index="'+index+'"]');
    if(!input)return;
    input.focus();
    input.select();
    input.closest('.term-chip')?.classList.add('review-focus-highlight');
    input.scrollIntoView?.({block:'center',inline:'nearest'});
  }

  function renderReview(){
    const freshEntries=reviewEntries('new');const aiEntries=reviewEntries('ia');const lines=resultLines();
    const caseRows=[
      ['Juridiction',state.jurisdiction],['Affaire',state.affaire],['Année',state.year],
      ['Ordre',state.order],['Archétype procédural',state.archetype],
      ['Id Publié',state.publishedId],['Nom usuel',state.usual],
      ...(hasMatter()?[['Matière',state.matter]]:[])
    ];
    const caseDetails=caseRows.map(([label,value])=>`<div class="review-affaire-field"><span class="review-affaire-label">${esc(label)}</span><strong class="review-affaire-value" title="${esc(value||'—')}">${esc(value||'—')}</strong></div>`).join('');
    view.innerHTML=`<div class="review-screen">
      <div class="page-head review-heading"><h1>Révision</h1><p>Contrôlez le résultat avant la sauvegarde.</p></div>
      <div class="review-summary-strip">
        <section class="card review-summary-card">
          <div class="card-head">Travail d'indexation</div>
          <div class="review-summary-content"><div class="review-summary-value" title="${esc(state.indexationType)}">${esc(state.indexationType||'—')}</div>
          <div class="review-summary-minor">${esc(state.workLanguage||'Français')}</div></div>
        </section>
        <section class="card review-summary-card">
          <div class="card-head">Document</div>
          <div class="review-summary-content"><div class="review-summary-value" title="${esc(state.fileName)}">${esc(state.fileName||'Aucun fichier')}</div>
          <div class="review-summary-minor" title="${esc(state.documentType)}">${esc(state.documentType||'—')} · ${esc(state.documentLanguage||'—')}</div></div>
        </section>
      </div>
      <section class="card review-affaire-card" aria-label="Métadonnées de l'affaire">
        <div class="card-head">Métadonnées de l'affaire</div>
        <div class="review-affaire-fields">${caseDetails}</div>
      </section>
      <div class="review-main-grid">
        <section class="card review-result-card">
          <div class="card-head review-main-heading"><span>Résultat d'indexation</span><span class="review-small-count">${lines.length} ${lines.length===1?'ligne':'lignes'}</span></div>
          <div class="review-output-body">
          ${lines.length?lines.map((line,i)=>`<div class="review-output-line">${canMultipleLines()?`<span class="review-line-number">${i+1}</span>`:''}<div class="review-line-text">${esc(line)}</div></div>`).join(''):'<p class="review-empty">Aucun résultat renseigné.</p>'}
          </div>
        </section>
        <section class="card review-checks-card">
          <div class="card-head">Vérifications</div>
          <div class="review-checks-body">
            ${reviewCheck('new',freshEntries)}
            ${reviewCheck('ia',aiEntries)}
          </div>
          <div class="review-check-footnote">Contrôles sur vocabulaire fictif. Référentiel MDM non connecté.</div>
        </section>
      </div>
    </div>`;
    footerSet(actionButton('Précédent','previous'),actionButton('Sauvegarder','final-save',true),'');
  }
  // Présentation uniquement : les trois familles de suggestions sous la chaîne.
  // Les boutons gardent exactement les actions déjà utilisées par la PoC.
  function positionSuggestionColumns(){
    const body=$('#recommendationsContent .suggest-body');
    if(!body)return;
    const nodes=[...body.children];
    const context=nodes.find(node=>node.classList.contains('suggest-context'));
    const names=['Terme','Chaîne de référence',"Chaîne d'indexation"];
    const groups=names.map(name=>{
      const section=document.createElement('section');
      section.className='suggestion-column';
      section.setAttribute('aria-label',name);
      return section;
    });
    let current=-1;
    for(const node of nodes){
      if(node===context||node.classList.contains('suggest-sep'))continue;
      if(node.tagName==='H3')current+=1;
      if(current>=0&&current<groups.length)groups[current].appendChild(node);
    }
    const grid=document.createElement('div');
    grid.className='suggestion-columns';
    groups.forEach(group=>grid.appendChild(group));
    body.replaceChildren();
    body.classList.add('suggestions-horizontal');
    if(context)body.appendChild(context);
    body.appendChild(grid);
  }
  function refreshSuggestions(){const e=$('#recommendationsContent');if(e){e.innerHTML=renderSuggestions();positionSuggestionColumns();}}
  function sizeTerm(input){if(!input)return;const chip=input.closest('.term-chip');if(!chip)return;const lines=String(input.value||'').split('\n');const n=Math.max(...lines.map(x=>x.length),11);chip.style.width=Math.min(355,Math.max(150,100+n*5.2))+'px';input.style.height='auto';input.style.height=Math.max(48,input.scrollHeight+4)+'px';}
  function resizeTerms(){$$('textarea[data-term-line]').forEach(sizeTerm);}
  function focusTerm(line,index){const input=$(`[data-term-line="${line}"][data-term-index="${index}"]`);if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length);}}
  function showDropdown(input){const wrap=input.closest('.term-wrap');if(!wrap)return;$$('.dropdown').forEach(x=>{if(x!==$('.dropdown',wrap))x.hidden=true;});const drop=$('.dropdown',wrap);if(!drop)return;
    const line=Number(input.dataset.termLine), idx=Number(input.dataset.termIndex), typed=norm(input.value);
    const matches=typed?demoSearch(input.value):nextTerms(line,idx).map(term=>({term,approx:false}));
    const terms=matches.map(item=>item.term);
    drop.innerHTML=matches.map(({term,approx})=>`<button type="button" class="${term.endsWith('*')?'ai-option':''}" data-action="insert-term" data-line="${line}" data-index="${idx}" data-value="${esc(term)}">${esc(term)}${approx?'<small class="approx-hint">≈ Correction proposée</small>':''}</button>`).join('');
    drop.hidden=!matches.length;
    sizeTerm(input);
    // Un menu de prédiction flottant reste accessible sans agrandir la chaîne.
    if(terms.length && window.matchMedia('(min-width:811px) and (min-height:510px)').matches){
      const r=input.getBoundingClientRect();
      const width=Math.min(330,Math.max(235,drop.scrollWidth));
      const left=Math.max(8,Math.min(r.left,window.innerWidth-width-9));
      const menuHeight=Math.min(drop.scrollHeight,265);
      const below=window.innerHeight-40-r.bottom;
      const above=r.top-72;
      const top=(below<menuHeight+7 && above>below) ? Math.max(73,r.top-menuHeight-5) : r.bottom+5;
      drop.style.left=left+'px';
      drop.style.top=top+'px';
      drop.style.width=width+'px';
    } else {
      drop.style.left='';drop.style.top='';drop.style.width='';
    }
  }
  function commitTerm(line,index,value){const d=state.indexation;const arr=getLine(line);if(!value.trim())return;finishTyping();if(arr[index]!==value.trim())beforeEdit();arr[index]=value.trim();d.activeLine=line;renderEditorPage();focusTerm(line,index+1);}
  function insertSuggestion(text){beforeEdit();if(isFreeText()){state.indexation.text=(state.indexation.text+' '+text).trim();renderEditorPage();return;}
    const d=state.indexation;const arr=activeLine();arr.push(text);renderEditorPage();focusTerm(d.activeLine,arr.length);}
  function replaceLineFromChain(text){beforeEdit();if(isFreeText()){state.indexation.text=text;}else{const i=state.indexation.activeLine;state.indexation.lines[i]=text.split(/\s+-\s+/).filter(Boolean);}renderEditorPage();toast('Proposition insérée. Elle reste modifiable.');}
  function setMeta(key,value){
    if(!['indexationType','workLanguage','jurisdiction','documentType','documentLanguage','affaire'].includes(key))return;
    if(key==='indexationType'){state[key]=value;updateType();}
    else if(key==='jurisdiction'){state[key]=value;if(!possibleCases().some(a=>a.id===state.affaire)){state.affaire='';updateCase();}}
    else if(key==='affaire'){state.affaire=value;updateCase();}
    else state[key]=value;
    render();
  }
  function attachFile(file){if(!file)return;state.fileName=file.name;render();toast('Fichier sélectionné pour la démonstration. Il ne sera pas lu ni transmis.');}
  function saveDraft(){if(saveSnapshot('brouillon')){state.status='brouillon';showModal('Brouillon sauvegardé',"Le travail d’indexation est enregistré dans ce navigateur à titre de démonstration. Il reste en attente de validation et n'est pas actif. La fonction « Modifier une indexation » n’est pas encore disponible.");}}
  function saveFinal(){if(!resultText()){toast('Résultat vide. Revenez à Indexation.');return;}if(saveSnapshot('sauvegardé')){const flagged=hasAi()||newTerms().length>0;showModal('Travail sauvegardé',flagged?"Le travail a été sauvegardé dans cette démonstration. Des nouveaux termes ou suggestions IA sont à vérifier avant une validation métier et une éventuelle activation. Aucun transfert au MDM.":"Le travail d’indexation a été sauvegardé dans cette démonstration. La validation métier et l'activation dans MDM ne sont pas simulées. Vous allez revenir à l’accueil.",()=>clearWork());}}

  // Navigation et actions d'édition.
  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-nav-step]');if(nav){navigate(Number(nav.dataset.navStep));return;}
    const step=event.target.closest('button[data-step]');if(step){navigate(Number(step.dataset.step));return;}
    const element=event.target.closest('[data-action]');if(!element){if(!event.target.closest('.term-wrap'))$$('.dropdown').forEach(d=>d.hidden=true);return;}
    const act=element.dataset.action;const l=Number(element.dataset.line),idx=Number(element.dataset.index);const value=element.dataset.value;
    if(state.step===2)finishTyping();
    switch(act){
      case 'home':navigate(0);break;
      case 'new-work':startWork();break;
      case 'cancel':clearWork();break;
      case 'next-form':advanceTo(2);break;
      case 'previous':navigate(state.step-1);break;
      case 'next-review':advanceTo(3);break;
      case 'review-edit-term':editTermFromReview(l,idx);break;
      case 'attach-file':fileInput.click();break;
      case 'remove-file':clearFile();render();toast('Fichier retiré. Les métadonnées restent inchangées.');break;
      case 'save-draft':saveDraft();break;
      case 'final-save':saveFinal();break;
      case 'history-undo':historyUndo();break;
      case 'history-redo':historyRedo();break;
      case 'clear-result':beforeEdit();state.indexation=isFreeText()?{format:'text',text:''}:defaultData();renderEditorPage();break;
      case 'add-line':if(canMultipleLines()){beforeEdit();state.indexation.lines.push([]);state.indexation.activeLine=state.indexation.lines.length-1;renderEditorPage();focusTerm(state.indexation.activeLine,0);}break;
      case 'remove-line':if(canMultipleLines()&&state.indexation.lines.length>1){beforeEdit();state.indexation.lines.splice(l,1);state.indexation.activeLine=Math.max(0,Math.min(state.indexation.activeLine,state.indexation.lines.length-1));renderEditorPage();}break;
      case 'remove-term':{beforeEdit();const terms=getLine(l);terms.splice(idx,1);state.indexation.activeLine=l;renderEditorPage();break;}
      case 'insert-term':{beforeEdit();const terms=getLine(l);terms[idx]=value;state.indexation.activeLine=l;renderEditorPage();focusTerm(l,idx+1);break;}
      case 'add-suggested-term':insertSuggestion(value);break;
      case 'apply-chain':replaceLineFromChain(value);break;
      case 'apply-text':replaceLineFromChain(value);break;
    }
  });
  document.addEventListener('change',event=>{if(event.target.dataset.meta)setMeta(event.target.dataset.meta,event.target.value);});
  document.addEventListener('input',event=>{
    const e=event.target;
    if(e.dataset.termLine!==undefined){startTyping();const line=Number(e.dataset.termLine),i=Number(e.dataset.termIndex);getLine(line)[i]=e.value;state.indexation.activeLine=line;showDropdown(e);refreshSuggestions();updateHistoryButtons();}
    if(e.matches('[data-free-text]')){startTyping();state.indexation.text=e.value;updateHistoryButtons();}
  });
  document.addEventListener('focusin',event=>{const e=event.target;if(e.dataset.termLine!==undefined){state.indexation.activeLine=Number(e.dataset.termLine);startTyping();showDropdown(e);refreshSuggestions();}if(e.matches('[data-free-text]'))startTyping();});
  document.addEventListener('focusout',event=>{const e=event.target;if(e.dataset.termLine!==undefined||e.matches('[data-free-text]'))finishTyping();});
  document.addEventListener('keydown',event=>{
    if(state.step===2&&(event.ctrlKey||event.metaKey)&&!event.altKey){
      const key=event.key.toLowerCase();
      if(key==='z'||key==='y'){
        event.preventDefault();
        if(key==='y'||event.shiftKey)historyRedo();else historyUndo();
        return;
      }
    }
    const e=event.target;
    if(e.dataset.termLine!==undefined){
      const l=Number(e.dataset.termLine),i=Number(e.dataset.termIndex);
      if(event.key==='Escape')$$('.dropdown').forEach(d=>d.hidden=true);
      if(event.key==='Enter'||event.key==='Tab'){event.preventDefault();if(e.value.trim())commitTerm(l,i,e.value);else focusTerm(l,i+1);}
      if(event.key==='Backspace'&&!e.value&&i===getLine(l).length&&i>0){event.preventDefault();beforeEdit();getLine(l).splice(i-1,1);renderEditorPage();focusTerm(l,i-1);}
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&state.step===2){event.preventDefault();saveDraft();}
  });
  fileInput.addEventListener('change',e=>{const file=e.target.files?.[0];attachFile(file);fileInput.value='';});
  document.addEventListener('dragover',e=>{if(e.target.closest('#fileDropZone')||e.target.closest('.term-wrap[data-drag-index]')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
  document.addEventListener('drop',e=>{
    if(e.target.closest('#fileDropZone')){e.preventDefault();attachFile(e.dataTransfer?.files?.[0]);return;}
    const item=e.target.closest('.term-wrap[data-drag-index]');if(!item||!dragInfo)return;
    e.preventDefault();const destLine=Number(item.dataset.dragLine),destIndex=Number(item.dataset.dragIndex);
    if(destLine===dragInfo.line&&destIndex!==dragInfo.index){beforeEdit();const arr=getLine(destLine);const [moved]=arr.splice(dragInfo.index,1);arr.splice(Math.min(destIndex,arr.length),0,moved);state.indexation.activeLine=destLine;renderEditorPage();toast('Ordre des maillons mis à jour.');}
    dragInfo=null;$$('.drop-target').forEach(n=>n.classList.remove('drop-target'));
  });
  document.addEventListener('dragstart',e=>{
    const handle=e.target.closest('.drag-handle');if(!handle)return;
    const wrap=handle.closest('.term-wrap');dragInfo={line:Number(wrap.dataset.dragLine),index:Number(wrap.dataset.dragIndex)};
    e.dataTransfer.setData('text/plain',`${dragInfo.line}:${dragInfo.index}`);e.dataTransfer.effectAllowed='move';
  });
  document.addEventListener('dragenter',e=>{if(dragInfo){const wrap=e.target.closest('.term-wrap[data-drag-index]');if(wrap&&Number(wrap.dataset.dragLine)===dragInfo.line)wrap.classList.add('drop-target');}});
  document.addEventListener('dragleave',e=>{const wrap=e.target.closest('.term-wrap.drop-target');if(wrap&&!wrap.contains(e.relatedTarget))wrap.classList.remove('drop-target');});
  document.addEventListener('dragend',()=>{dragInfo=null;$$('.drop-target').forEach(n=>n.classList.remove('drop-target'));});
  // Le menu flottant n'est pas laissé à une ancienne position si un panneau défile.
  document.addEventListener('scroll',e=>{
    if(e.target.closest?.('.edit-grid.suggestions-below')){
      $$('.dropdown').forEach(d=>d.hidden=true);
    }
  },true);
  render();
})();