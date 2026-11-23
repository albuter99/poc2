/* MDM - Démonstration autonome des trois écrans d'indexation.
   Aucune donnée n'est envoyée à un serveur. Le fichier choisi n'est pas lu.
   Les recommandations et les métadonnées automatiques sont simulées. */
(() => {
  'use strict';

  const STORAGE_KEY = 'mdm-poc2-draft-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const optionsHtml = (values, selected) => values.map(v => `<option value="${escapeHtml(v)}" ${v === selected ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');

  const PROCEDURES = {
    'Renvoi préjudiciel': ['Préexamen', 'DDP', 'Rapport préalable', "Conclusions de l'AG", 'Arrêt / Ordonnance', 'Sommaire', 'Résumé'],
    'Recours direct': ['AII', 'Rapport préalable', "Conclusions de l'AG", 'Arrêt / Ordonnance', 'Sommaire', 'Résumé'],
    'Pourvoi': ['Analyse de premier contrôle', "Demande d'admission", 'Requête en pourvoi', 'Rapport préalable', "Conclusions de l'AG", 'Arrêt / Ordonnance', 'Sommaire', 'Résumé']
  };
  // Correspondances de démonstration, à vérifier avec les règles métiers définitives.
  const INDEXATION_RULES = {
    'Préexamen': ['Indicateurs', 'Descripteurs'],
    'DDP': ['Mots-clés', 'Objet'],
    'AII': ['Mots-clés', 'Objet'],
    'Analyse de premier contrôle': ['Indicateurs'],
    "Demande d'admission": ['Descripteurs'],
    'Requête en pourvoi': ['Mots-clés', 'Objet'],
    'Rapport préalable': ['Indicateurs'],
    "Conclusions de l'AG": ['Indicateurs'],
    'Arrêt / Ordonnance': ['Indicateurs'],
    'Sommaire': ['Mots-clés', 'Cotes bulletin'],
    'Résumé': ['Mots-clés', 'Cotes bulletin']
  };
  const FREE_TEXT_TYPES = new Set(['Objet']);
  const SAMPLES = [
    {jurisdiction:'Cour', procedure:'Renvoi préjudiciel', documentType:'Préexamen', reference:'C-123/25', lang:'Français'},
    {jurisdiction:'Cour', procedure:'Renvoi préjudiciel', documentType:'DDP', reference:'C-318/24', lang:'Français'},
    {jurisdiction:'Tribunal', procedure:'Recours direct', documentType:'AII', reference:'T-204/25', lang:'Français'},
    {jurisdiction:'Cour', procedure:'Pourvoi', documentType:'Requête en pourvoi', reference:'C-476/25 P', lang:'Français'},
    {jurisdiction:'Cour', procedure:'Pourvoi', documentType:'Analyse de premier contrôle', reference:'C-149/25 P', lang:'Français'},
    {jurisdiction:'Tribunal', procedure:'Recours direct', documentType:'Arrêt / Ordonnance', reference:'T-89/24', lang:'Français'},
    {jurisdiction:'Cour', procedure:'Renvoi préjudiciel', documentType:'Sommaire', reference:'C-232/24', lang:'Français'}
  ];
  const CATALOGUE = {
    'Indicateurs': {
      chains: [
        ["Droit de l'Union", 'Recours en annulation', 'Recevabilité'],
        ["Droit de l'Union", 'Recours en annulation', 'Intérêt à agir'],
        ["Droit de l'Union", 'Contrôle juridictionnel', 'Proportionnalité']
      ],
      next: ['Intérêt à agir', 'Principe de proportionnalité', 'Contrôle spécifique *', 'Compétence', 'Conditions de recevabilité']
    },
    'Descripteurs': {
      chains: [
        ["Droit de l'Union", 'Annulation', 'Conditions de recevabilité'],
        ["Droit de l'Union", 'Annulation', 'Intérêt à agir'],
        ['Procédure juridictionnelle', 'Recevabilité', 'Contrôle spécifique *']
      ],
      next: ['Intérêt à agir', 'Conditions de recevabilité', 'Principe de proportionnalité', 'Contrôle spécifique *']
    },
    'Mots-clés': {
      chains: [
        ['Renvoi préjudiciel', 'Interprétation', "Droit de l'Union"],
        ['Recours direct', 'Recevabilité', 'Intérêt à agir'],
        ["Droit de l'Union", 'Contrôle juridictionnel', 'Principe de proportionnalité']
      ],
      next: ['Interprétation', 'Recevabilité', 'Intérêt à agir', 'Nouvelle notion juridique *']
    },
    'Cotes bulletin': {
      chains: [
        ["Droit de l'Union", 'Procédure'],
        ['Recours', 'Recevabilité'],
        ['Contrôle juridictionnel', 'Proportionnalité']
      ],
      next: ['Procédure', 'Recevabilité', 'Jurisprudence', 'Nouvelle rubrique *']
    },
    'Objet': {
      texts: [
        "Demande de décision préjudicielle relative à l'interprétation du droit de l'Union.",
        "Recevabilité d'un recours en annulation et appréciation de l'intérêt à agir.",
        "Examen des conditions de recevabilité du recours dans le cadre du droit de l'Union."
      ],
      next: ['Concernant la recevabilité du recours', "Sur l'interprétation du droit de l'Union", 'Sous réserve de nouvelles précisions *']
    }
  };
  const sampleTerms = {
    'Indicateurs': ["Droit de l'Union", 'Recours en annulation', 'Recevabilité'],
    'Descripteurs': ["Droit de l'Union", 'Annulation', 'Conditions de recevabilité'],
    'Mots-clés': ['Renvoi préjudiciel', 'Interprétation'],
    'Cotes bulletin': ['Procédure', 'Recevabilité']
  };
  const emptyState = () => ({
    step: 1, maxStep: 1, validated: false, fileName: '', jurisdiction: 'Cour',
    procedure: 'Renvoi préjudiciel', documentType: 'Préexamen', date: '2025-01-15',
    reference: 'C-123/25', lang: 'Français', activeType: 'Indicateurs', indexations: {},
    lastSaved: null
  });
  let state = emptyState();
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored && typeof stored === 'object') {
      state = {...emptyState(), ...stored};
      state.step = Math.min(3, Math.max(1, Number(state.step) || 1));
      state.maxStep = Math.min(3, Math.max(1, Number(state.maxStep) || 1));
    }
  } catch (_) { /* Le stockage local reste facultatif. */ }

  const view = $('#view');
  const footerActions = $('#footerActions');
  const fileInput = $('#fileInput');
  let toastTimeout = null;
  let focusedType = null;
  let focusedIndex = null;

  function getTypes() { return INDEXATION_RULES[state.documentType] || ['Indicateurs']; }
  function initIndexations() {
    if (!state.indexations || typeof state.indexations !== 'object') state.indexations = {};
    for (const type of getTypes()) {
      if (!state.indexations[type]) {
        state.indexations[type] = FREE_TEXT_TYPES.has(type)
          ? {format:'text', text: ''}
          : {format:'terms', terms:[...(sampleTerms[type] || [])]};
      }
      if (!FREE_TEXT_TYPES.has(type) && !Array.isArray(state.indexations[type].terms)) state.indexations[type] = {format:'terms', terms:[]};
      if (FREE_TEXT_TYPES.has(type) && typeof state.indexations[type].text !== 'string') state.indexations[type] = {format:'text', text:''};
    }
    if (!getTypes().includes(state.activeType)) state.activeType = getTypes()[0];
  }
  initIndexations();

  function saveState(showMessage = false) {
    state.lastSaved = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (_) { if (showMessage) notify('Le stockage local est indisponible.'); return; }
    if (showMessage) notify('Brouillon enregistré dans ce navigateur.');
  }
  function notify(message) {
    const toast = $('#toast');
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3600);
  }
  function goToStep(step) {
    if (step > state.maxStep) return;
    state.step = step;
    render();
    window.scrollTo({top:0, behavior:'auto'});
  }
  function advanceTo(step) {
    state.maxStep = Math.max(state.maxStep, step);
    state.step = step;
    saveState();
    render();
    window.scrollTo({top:0, behavior:'auto'});
  }
  function metaLine() { return [state.jurisdiction, state.procedure, state.documentType, humanDate(), state.lang].join(' · '); }
  function humanDate() {
    const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(state.date || '');
    return match ? `${match[3]}/${match[2]}/${match[1]}` : state.date;
  }
  function renderChrome() {
    const crumbs = ['Nouveau document', "Édition de l'indexation", 'Révision finale'];
    $('#breadcrumbs').innerHTML = `<span>Dossiers</span><span class="crumb-sep">›</span><span>${escapeHtml(state.reference)}</span><span class="crumb-sep">›</span><span>${escapeHtml(state.documentType)}</span><span class="crumb-sep">›</span><strong>${crumbs[state.step - 1]}</strong>`;
    $$('.step').forEach(button => {
      const step = Number(button.dataset.step);
      button.classList.toggle('active', state.step === step);
      button.classList.toggle('disabled', step > state.maxStep);
      button.disabled = step > state.maxStep;
      button.setAttribute('aria-current', state.step === step ? 'step' : 'false');
    });
  }
  const button = (label, action, primary=false) => `<button type="button" class="${primary ? 'primary-btn' : 'plain-btn'}" data-action="${action}">${label}</button>`;
  function render() {
    initIndexations();
    renderChrome();
    if (state.step === 1) renderStep1();
    else if (state.step === 2) renderStep2();
    else renderStep3();
  }
  function renderStep1() {
    view.innerHTML = `
      <div class="page-head"><h1>Nouveau document</h1><p>Joindre un fichier et vérifier les données du document.</p></div>
      <div class="intro-grid">
        <div class="intro-left">
          <section class="card"><div class="card-head">Document</div><div class="card-body">
            <div class="file-row" id="fileDropZone">
              <button type="button" class="outline-btn" data-action="attach-file">♧ &nbsp;Joindre un document…</button>
              <div class="file-name ${state.fileName ? '' : 'empty'}"><span title="${escapeHtml(state.fileName)}">${escapeHtml(state.fileName || 'Aucun fichier sélectionné')}</span>${state.fileName ? '<button type="button" class="tiny-icon-btn" data-action="remove-file" aria-label="Retirer le fichier">×</button>' : ''}</div>
            </div>
          </div></section>
          <section class="card"><div class="card-head">Métadonnées du document</div><div class="card-body"><div class="form-grid">
            <label for="jurisdiction">Juridiction</label><select id="jurisdiction" data-meta="jurisdiction">${optionsHtml(['Cour', 'Tribunal'], state.jurisdiction)}</select>
            <label for="procedure">Catégorie de procédure</label><select id="procedure" data-meta="procedure">${optionsHtml(Object.keys(PROCEDURES), state.procedure)}</select>
            <label for="documentType">Type de document</label><select id="documentType" data-meta="documentType">${optionsHtml(PROCEDURES[state.procedure] || PROCEDURES['Renvoi préjudiciel'], state.documentType)}</select>
            <label for="date">Date</label><input id="date" data-meta="date" type="date" value="${escapeHtml(state.date)}">
            <label for="reference">Référence de l'affaire</label><input id="reference" data-meta="reference" type="text" value="${escapeHtml(state.reference)}" maxlength="60">
            <label for="lang">Langue</label><select id="lang" data-meta="lang">${optionsHtml(['Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Néerlandais', 'Portugais'], state.lang)}</select>
          </div></div></section>
        </div>
        <section class="card index-types"><div class="card-head">Types d'indexation requis</div><div class="card-body">
          ${getTypes().map(type => `<div class="type-item"><span class="check-dot">✓</span><span>${escapeHtml(type)}</span></div>`).join('')}
          <p class="tiny-note">Champs générés d'après la juridiction, la catégorie de procédure et le type de document. Correspondances simulées pour cette PoC.</p>
        </div></section>
      </div>
      <div class="inline-message">Après avoir joint un fichier, les métadonnées sont renseignées avec des exemples aléatoires. Elles restent modifiables. Le fichier n'est ni analysé ni envoyé.</div>`;
    footerActions.innerHTML = `${button('Réinitialiser', 'reset')}${button('Continuer', 'continue', true)}`;
  }
  function getDocPreview() {
    const snippets = {
      'Préexamen': "La demande de décision préjudicielle concerne l'interprétation du droit de l'Union et les conditions de recevabilité… La juridiction de renvoi interroge la Cour sur les conséquences de la procédure…",
      'DDP': "Les questions préjudicielles portent sur l'interprétation d'un acte de l'Union et sur les droits des parties intéressées…",
      'AII': "Le recours porte sur l'annulation de l'acte contesté. Les moyens concernent notamment la recevabilité et le principe de proportionnalité…",
      'Requête en pourvoi': "Le pourvoi conteste les conclusions retenues dans l'arrêt attaqué et soulève des questions de recevabilité…"
    };
    return snippets[state.documentType] || "Le document présente un litige relatif au droit de l'Union et aux conditions de la procédure applicable…";
  }
  function renderTermEditor(type) {
    const d = state.indexations[type];
    const parts = (d.terms || []).map((term, index) => `
      <div class="term-wrap">
        ${index ? '<span class="term-divider">-</span>' : ''}
        <div class="term-chip"><input aria-label="${escapeHtml(type)}, terme ${index+1}" data-term-type="${escapeHtml(type)}" data-term-index="${index}" value="${escapeHtml(term)}" autocomplete="off" spellcheck="false"><button type="button" class="remove-term" data-action="remove-term" data-type="${escapeHtml(type)}" data-index="${index}" aria-label="Supprimer ce terme">×</button></div>
        <div class="dropdown" hidden></div>
      </div>`).join('');
    return `<div class="chip-list">${parts}<div class="term-wrap">${d.terms.length ? '<span class="term-divider">-</span>' : ''}<div class="term-chip input-empty"><input aria-label="${escapeHtml(type)}, terme suivant" data-term-type="${escapeHtml(type)}" data-term-index="${d.terms.length}" value="" placeholder="…" autocomplete="off" spellcheck="false"></div><div class="dropdown" hidden></div></div></div><p class="editor-hint"><kbd>Tab</kbd> ou <kbd>Entrée</kbd> crée la case suivante. La longueur est libre.</p>`;
  }
  function renderEditor(type, index) {
    const d = state.indexations[type];
    return `<section class="card type-editor" data-editor="${escapeHtml(type)}"><div class="card-head type-editor-head"><span>${index+1}. ${escapeHtml(type)}</span><button class="tiny-icon-btn" type="button" data-action="clear-type" data-type="${escapeHtml(type)}" title="Effacer cette indexation" aria-label="Effacer ${escapeHtml(type)}">↶</button></div><div class="editor-area" data-area-type="${escapeHtml(type)}">${d.format === 'text'
      ? `<textarea class="free-text" data-free-type="${escapeHtml(type)}" aria-label="Texte libre, ${escapeHtml(type)}" placeholder="Rédigez une phrase ou choisissez une proposition…">${escapeHtml(d.text)}</textarea><p class="editor-hint">Texte libre : une seule réponse finale, sans découpage en termes.</p>`
      : renderTermEditor(type)}</div></section>`;
  }
  function currentCatalog(type) { return CATALOGUE[type] || CATALOGUE['Indicateurs']; }
  function getNextOptions(type) {
    const catalog = currentCatalog(type);
    const d = state.indexations[type];
    const known = d?.format === 'terms' ? d.terms : [];
    const next = [...catalog.next];
    if (known.includes('Recevabilité') && !next.includes('Intérêt à agir')) next.unshift('Intérêt à agir');
    return [...new Set(next)];
  }
  function renderRecommendationContent() {
    const type = state.activeType;
    const catalog = currentCatalog(type);
    const isText = FREE_TEXT_TYPES.has(type);
    const proposals = isText ? catalog.texts : catalog.chains.map(chain => chain.join(' - '));
    return `<div class="suggest-body"><h3>${isText ? 'Textes complets' : 'Chaînes complètes'}</h3>
      ${proposals.map(text => `<button class="suggestion" type="button" data-action="apply-full" data-type="${escapeHtml(type)}" data-value="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join('')}
      <div class="suggest-sep"></div><h3>${isText ? 'Suite du texte' : 'Terme suivant'}</h3>
      ${getNextOptions(type).slice(0, 4).map(text => `<button type="button" class="suggestion ${text.endsWith('*') ? 'ai-suggestion' : ''}" data-action="apply-next" data-type="${escapeHtml(type)}" data-value="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join('')}
      <p class="muted-hint">* Proposition nouvelle de l'IA, à faire valider.</p>
      <p class="muted-hint">Suggestions d'exemple, sans modèle d'IA réel.</p></div>`;
  }
  function refreshRecommendations() {
    const panel = $('#recommendationsContent');
    if (panel) panel.innerHTML = renderRecommendationContent();
  }
  function renderStep2() {
    view.innerHTML = `<div class="page-head"><h1>Édition de l'indexation</h1><p>Choisissez une proposition complète ou construisez l'indexation terme par terme.</p></div>
      <div class="edit-grid">
        <aside class="edit-left">
          <section class="card"><div class="card-head">Vue du document</div><div class="document-preview"><strong>${escapeHtml(state.documentType)}</strong><span>Affaire ${escapeHtml(state.reference)}</span><p>${escapeHtml(getDocPreview())}</p><span class="doc-note">Extrait fictif : le fichier joint n'est pas analysé.</span></div></section>
          <section class="card"><div class="card-head">Données de l'affaire</div><dl class="facts"><dt>Document</dt><dd>${escapeHtml(state.documentType)}</dd><dt>Référence</dt><dd>${escapeHtml(state.reference)}</dd><dt>Date</dt><dd>${escapeHtml(humanDate())}</dd><dt>Langue</dt><dd>${escapeHtml(state.lang)}</dd></dl></section>
        </aside>
        <div class="edit-main">${getTypes().map((type, i) => renderEditor(type, i)).join('')}</div>
        <aside class="edit-right"><section class="card"><div class="card-head">Recommandations <span style="font-weight:normal;color:#63829d">(${escapeHtml(state.activeType)})</span></div><div id="recommendationsContent">${renderRecommendationContent()}</div></section></aside>
      </div>`;
    footerActions.innerHTML = `${button('Retour', 'back')}${button('Enregistrer', 'save')}${button("Réviser l'indexation", 'review', true)}`;
  }
  function resultText(type) {
    const data = state.indexations[type];
    return data?.format === 'text' ? data.text.trim() : (data?.terms || []).map(v => v.trim()).filter(Boolean).join(' - ');
  }
  function hasAiProposals() { return getTypes().some(type => resultText(type).includes('*')); }
  function validateResults() {
    const missing = getTypes().filter(type => !resultText(type));
    if (missing.length) { notify(`Veuillez compléter : ${missing.join(', ')}.`); return false; }
    return true;
  }
  function renderStep3() {
    const newTerm = hasAiProposals();
    view.innerHTML = `<div class="page-head"><h1>Révision finale</h1><p>Vérifiez les résultats avant de les enregistrer comme définitifs.</p></div>
      <div class="review-grid">
        <div class="review-left">
          <section class="card"><div class="card-head">Document</div><div class="file-summary"><div class="pdf-badge">${escapeHtml((state.fileName.split('.').pop() || 'PDF').slice(0, 4).toUpperCase())}</div><div><div class="name">${escapeHtml(state.fileName || 'Document de démonstration')}</div><div class="meta">${escapeHtml(metaLine())}</div></div></div></section>
          <section class="card"><div class="card-head">Résultats finaux de l'indexation</div><div class="result-list">
            ${getTypes().map((type,i) => `<div class="result-item"><div class="result-heading">${i+1}. ${escapeHtml(type)}</div><div class="result-value">${escapeHtml(resultText(type) || 'Non renseigné')}</div></div>`).join('')}
            <p class="validation-note">Un seul résultat final par type. Les nouveaux termes nécessitent une validation spécifique.</p>
          </div></section>
          ${state.validated ? '<div class="finish-banner">✓ Indexation validée dans cette démonstration. Aucun enregistrement sur un serveur.</div>' : ''}
        </div>
        <section class="card"><div class="card-head">Vérifications</div><div class="checks">
          ${[
            ['Types d\'indexation requis identifiés', true],
            ['Un résultat par type', getTypes().every(type => !!resultText(type))],
            ['Ordre des termes conservé', true],
            ['Séparateurs normalisés', true],
            [newTerm ? 'Proposition IA * : validation métier requise' : 'Aucun nouveau terme non validé', !newTerm]
          ].map(([name, good]) => `<div class="check-item ${good ? '' : 'warning'}"><span class="check-dot" style="background:${good ? '#16834d' : '#c28b28'}">${good ? '✓' : '!'}</span><span class="text">${escapeHtml(name)}</span><span class="check-pill">${good ? 'OK' : 'À vérifier'}</span></div>`).join('')}
        </div></section>
      </div>`;
    footerActions.innerHTML = `${button('Retour', 'back')}${button('Enregistrer', 'save')}${button('Valider', 'validate', true)}`;
  }
  function renderDropdown(input) {
    const type = input.dataset.termType;
    const wrap = input.closest('.term-wrap');
    if (!wrap) return;
    $$('.dropdown').forEach(drop => { if (drop !== $('.dropdown', wrap)) drop.hidden = true; });
    const dropdown = $('.dropdown', wrap);
    const term = input.value.trim().toLocaleLowerCase('fr');
    const results = getNextOptions(type).filter(text => !term || text.toLocaleLowerCase('fr').includes(term)).slice(0, 5);
    dropdown.innerHTML = results.map(text => `<button type="button" class="${text.endsWith('*') ? 'ai-option' : ''}" data-action="insert-term" data-type="${escapeHtml(type)}" data-index="${escapeHtml(input.dataset.termIndex)}" data-value="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join('');
    dropdown.hidden = results.length === 0;
  }
  function setFocus(type, index) {
    const el = $$('input[data-term-type]').find(node => node.dataset.termType === type && Number(node.dataset.termIndex) === index);
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }
  function insertTerm(type, index, term) {
    const d = state.indexations[type];
    if (!d || d.format !== 'terms') return;
    const clean = term.trim();
    if (!clean) return;
    d.terms[index] = clean;
    state.activeType = type;
    state.validated = false;
    renderStep2();
    setFocus(type, index + 1);
  }
  function acceptNext(type, term) {
    state.activeType = type;
    const d = state.indexations[type];
    if (d.format === 'text') {
      d.text = `${d.text.trim()}${d.text.trim() ? ' ' : ''}${term}`;
      renderStep2();
      const field = $(`[data-free-type="${CSS.escape(type)}"]`);
      if (field) field.focus();
    } else {
      insertTerm(type, d.terms.length, term);
    }
  }
  function applyFull(type, value) {
    const d = state.indexations[type];
    if (d.format === 'text') d.text = value;
    else d.terms = value.split(/\s-\s/).map(t=>t.trim()).filter(Boolean);
    state.activeType = type;
    state.validated = false;
    renderStep2();
    notify('Proposition insérée. Vous pouvez la modifier.');
  }
  function setMeta(key, value) {
    if (!['jurisdiction','procedure','documentType','date','reference','lang'].includes(key)) return;
    state[key] = value;
    if (key === 'procedure') {
      state.documentType = PROCEDURES[value][0];
      state.indexations = {};
    }
    if (key === 'documentType') state.indexations = {};
    state.validated = false;
    render();
  }
  function randomDate() {
    const year = [2023,2024,2025,2026][Math.floor(Math.random() * 4)];
    const month = String(1+Math.floor(Math.random()*12)).padStart(2,'0');
    const day = String(1+Math.floor(Math.random()*28)).padStart(2,'0');
    return `${year}-${month}-${day}`;
  }
  function attachFile(file) {
    if (!file) return;
    const sample = SAMPLES[Math.floor(Math.random()*SAMPLES.length)];
    Object.assign(state, sample);
    state.date = randomDate();
    state.fileName = file.name;
    state.indexations = {};
    state.validated = false;
    initIndexations();
    saveState();
    render();
    notify('Métadonnées fictives renseignées. Vous pouvez les modifier.');
  }
  document.addEventListener('click', event => {
    const stepButton = event.target.closest('button[data-step]');
    if (stepButton && !stepButton.disabled) { goToStep(Number(stepButton.dataset.step)); return; }
    const target = event.target.closest('[data-action]');
    if (!target) { if (!event.target.closest('.term-wrap')) $$('.dropdown').forEach(d => d.hidden = true); return; }
    const action = target.dataset.action;
    const type = target.dataset.type;
    const value = target.dataset.value;
    switch (action) {
      case 'attach-file': fileInput.click(); break;
      case 'remove-file': state.fileName=''; fileInput.value=''; render(); break;
      case 'reset': state = emptyState(); initIndexations(); try { localStorage.removeItem(STORAGE_KEY); } catch (_) {} fileInput.value=''; render(); notify('Démonstration réinitialisée.'); break;
      case 'continue': advanceTo(2); break;
      case 'back': goToStep(Math.max(1,state.step-1)); break;
      case 'save': saveState(true); break;
      case 'review': if (validateResults()) advanceTo(3); break;
      case 'validate':
        if (!validateResults()) { goToStep(2); break; }
        if (hasAiProposals()) notify('Propositions * conservées : validation métier nécessaire.');
        state.validated=true; saveState(); render(); notify('Indexation validée pour la démonstration.'); break;
      case 'remove-term': {
        const d=state.indexations[type]; if (!d || d.format !== 'terms') break;
        d.terms.splice(Number(target.dataset.index),1);
        state.activeType=type; state.validated=false; renderStep2(); break;
      }
      case 'clear-type':
        if (state.indexations[type].format==='terms') state.indexations[type].terms=[];
        else state.indexations[type].text='';
        state.activeType=type; state.validated=false; renderStep2(); break;
      case 'insert-term': insertTerm(type, Number(target.dataset.index), value); break;
      case 'apply-next': acceptNext(type,value); break;
      case 'apply-full': applyFull(type,value); break;
    }
  });
  fileInput.addEventListener('change', event => attachFile(event.target.files?.[0]));
  document.addEventListener('change', event => {
    const meta = event.target.dataset.meta;
    if (meta) setMeta(meta,event.target.value);
  });
  document.addEventListener('input', event => {
    const target = event.target;
    if (target.matches('input[data-meta="reference"]')) { state.reference=target.value; return; }
    if (target.dataset.termType) {
      const type=target.dataset.termType;
      const idx=Number(target.dataset.termIndex);
      state.indexations[type].terms[idx]=target.value;
      state.activeType=type; state.validated=false;
      refreshRecommendations(); renderDropdown(target);
    }
    if (target.dataset.freeType) {
      state.indexations[target.dataset.freeType].text=target.value;
      state.activeType=target.dataset.freeType; state.validated=false;
      refreshRecommendations();
    }
  });
  document.addEventListener('focusin', event => {
    const target=event.target;
    if (target.dataset.termType) {
      state.activeType=target.dataset.termType;
      focusedType=target.dataset.termType;
      focusedIndex=Number(target.dataset.termIndex);
      refreshRecommendations();renderDropdown(target);
    }
    if (target.dataset.freeType) { state.activeType=target.dataset.freeType;refreshRecommendations(); }
  });
  document.addEventListener('keydown', event => {
    const input=event.target;
    if (input.dataset.termType) {
      if (event.key==='Enter' || event.key==='Tab') {
        event.preventDefault();
        const type=input.dataset.termType;
        const idx=Number(input.dataset.termIndex);
        const value=input.value.trim();
        if (value) {
          state.indexations[type].terms[idx]=value;
          state.activeType=type;
          renderStep2();setFocus(type,idx+1);
        } else {
          const next=$$(`input[data-term-type="${CSS.escape(type)}"]`).find(el=>Number(el.dataset.termIndex)===idx+1);
          if (next) next.focus();
        }
      }
      if (event.key==='Escape') $$('.dropdown').forEach(d => d.hidden = true);
      if (event.key==='Backspace' && !input.value && Number(input.dataset.termIndex)>0) {
        const type=input.dataset.termType, idx=Number(input.dataset.termIndex);
        if (idx===state.indexations[type].terms.length) {
          event.preventDefault();
          state.indexations[type].terms.splice(idx-1,1);
          renderStep2();setFocus(type,idx-1);
        }
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='s') { event.preventDefault();saveState(true); }
  });
  document.addEventListener('dragover', event => { if (event.target.closest('#fileDropZone')) event.preventDefault(); });
  document.addEventListener('drop', event => {
    if (event.target.closest('#fileDropZone')) { event.preventDefault();attachFile(event.dataTransfer?.files?.[0]); }
  });
  // La référence est mise à jour lorsqu'on quitte le champ, sans perturber la frappe.
  document.addEventListener('focusout', event => {
    if (event.target.dataset.meta==='reference') { state.reference=event.target.value; renderChrome(); }
  });
  render();
})();