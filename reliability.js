/* Local reliability and accessibility helpers. No database migration required. */
const dialogIds = ['gallery-archive', 'lightbox', 'all-poems-overlay', 'poem-reader-overlay', 'pw-modal', 'admin-modal', 'hifi-overlay'];
const dialogClosers = { 'gallery-archive':closeGalleryArchive, lightbox:closeLightbox, 'all-poems-overlay':closeAllPoems, 'poem-reader-overlay':closePoemReader, 'pw-modal':closePwModal, 'admin-modal':closeAdmin, 'hifi-overlay':closeHifiPanel };
const dialogStack = [];
const returnFocus = new Map();
let dialogsReady = false;
function syncDialogs() {
  if (!dialogsReady) return;
  for (const id of dialogIds) {
    const el = document.getElementById(id);
    const pos = dialogStack.indexOf(id);
    if (el.classList.contains('open') && pos < 0) {
      returnFocus.set(id, document.activeElement);
      dialogStack.push(id);
      el.inert = false;
      const initialFocus = id === 'pw-modal' ? el.querySelector('#pw-input') : el.querySelector('button, input, [tabindex="0"]');
      initialFocus?.focus();
    } else if (!el.classList.contains('open') && pos >= 0) {
      dialogStack.splice(pos, 1);
      const opener = returnFocus.get(id);
      returnFocus.delete(id);
      if (opener?.isConnected) queueMicrotask(() => opener.focus());
    }
  }
  const top = dialogStack.at(-1);
  document.body.style.overflow = top ? 'hidden' : '';
  document.getElementById('panel-stack').inert = Boolean(top);
  document.getElementById('music-player').inert = Boolean(top);
  for (const id of dialogIds) {
    const el = document.getElementById(id);
    const open = el.classList.contains('open');
    el.inert = !open || id !== top;
    el.setAttribute('aria-hidden', String(!open));
    el.style.zIndex = String(12000 + Math.max(0, dialogStack.indexOf(id)));
  }
}
function initDialogManager() {
  for (const id of dialogIds) {
    const el = document.getElementById(id);
    document.body.appendChild(el);
    el.setAttribute('role','dialog');
    el.setAttribute('aria-modal','true');
    el.setAttribute('aria-label', {lightbox:'Memory viewer','pw-modal':'Admin sign in','admin-modal':'Site administration','hifi-overlay':'Music player'}[id] || id.replaceAll('-',' '));
    new MutationObserver(syncDialogs).observe(el,{attributes:true,attributeFilter:['class']});
  }
  dialogsReady = true; syncDialogs();
  document.addEventListener('keydown', e => {
    const top = dialogStack.at(-1);
    if (!top) return;
    if (e.key === 'Escape') { e.preventDefault(); dialogClosers[top](); syncDialogs(); return; }
    if (e.key !== 'Tab') return;
    const el = document.getElementById(top);
    const controls = [...el.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter(n => !n.disabled && n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden');
    if (!controls.length) { e.preventDefault(); return; }
    const first = controls[0], last = controls.at(-1);
    if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
}
function initAccessibleControls() {
  document.getElementById('seek-slider').setAttribute('aria-label','Song progress');
  document.getElementById('volume-slider').setAttribute('aria-label','Volume');
  document.getElementById('pw-input').setAttribute('autocomplete','current-password');
  document.getElementById('pw-input').setAttribute('aria-label','Admin password');
  document.getElementById('pw-email').setAttribute('aria-label','Admin email');
  document.querySelectorAll('.af label').forEach(label => {
    const field = label.parentElement.querySelector('input, textarea');
    if (field?.id) label.htmlFor = field.id;
  });
  document.getElementById('letter-body').tabIndex = 0;
  document.getElementById('letter-body').setAttribute('aria-label','Letter');
  ['volume','bass','treble','balance'].forEach(name => {
    const knob = document.getElementById('knob-'+name);
    knob.tabIndex = 0; knob.setAttribute('role','slider');
    knob.setAttribute('aria-label',name); knob.setAttribute('aria-valuemin',name === 'volume' ? '0' : '-10');
    knob.setAttribute('aria-valuemax',name === 'volume' ? '100' : '10');
    const readValue = () => name === 'volume' ? document.getElementById('bg-audio').volume * 100 : name === 'bass' ? currentBassGain : name === 'treble' ? currentTrebleGain : currentBalancePan * 10;
    const sync = () => knob.setAttribute('aria-valuenow',String(Math.round(readValue())));
    new MutationObserver(sync).observe(knob,{attributes:true,attributeFilter:['style']}); sync();
    knob.addEventListener('keydown',e => {
      if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
      e.preventDefault();
      const min = name === 'volume' ? 0 : -10, max = name === 'volume' ? 100 : 10;
      const step = name === 'volume' ? 5 : 1;
      let value = e.key === 'Home' ? min : e.key === 'End' ? max : readValue() + (['ArrowUp','ArrowRight'].includes(e.key) ? step : -step);
      value = Math.max(min,Math.min(max,value));
      if (name === 'volume') {
        const slider=document.getElementById('volume-slider'); slider.value=value; slider.dispatchEvent(new Event('input'));
      } else if (name === 'bass') { currentBassGain=value; if(bassFilter)bassFilter.gain.value=value; }
      else if (name === 'treble') { currentTrebleGain=value; if(trebleFilter)trebleFilter.gain.value=value; }
      else { currentBalancePan=value/10; if(pannerNode)pannerNode.pan.value=value/10; }
      knob.style.setProperty('--rot',`${-135+(value-min)/(max-min)*270}deg`); sync();
    });
  });
}
async function persistOrder(table, items) {
  // Serialized writes prevent overlapping clicks. This is not a DB transaction.
  for (let i=0;i<items.length;i++) {
    const {error}=await supabaseClient.from(table).update({sort_order:i}).eq('id',items[i].id);
    if(error)throw error;
  }
}
const cleanupKey='saptaparna_pending_cleanup_v1';
function readCleanup() { try { return JSON.parse(localStorage.getItem(cleanupKey)||'[]'); } catch { return []; } }
function writeCleanup(items) { try { localStorage.setItem(cleanupKey,JSON.stringify(items)); } catch {} }
async function removeStoredFile(bucket,path) {
  if (!path || /^(https?:|data:|assets\/)/.test(path)) return true;
  let failed=false;
  try { const {error}=await supabaseClient.storage.from(bucket).remove([path]); failed=Boolean(error); } catch { failed=true; }
  const pending=readCleanup().filter(item=>!(item.bucket===bucket&&item.path===path));
  if(failed)pending.push({bucket,path});
  writeCleanup(pending);return !failed;
}
async function retryFileCleanup() {
  for(const item of readCleanup())await removeStoredFile(item.bucket,item.path);
  showAdminToast(readCleanup().length ? 'Some files could not be removed. Sign in and retry.' : 'File cleanup complete');
}
// One admin write at a time, with controls restored even on thrown errors.
let adminWriteBusy=false;
for(const name of ['checkPw','signOutAdmin','publishPoem','updatePoem','deletePoem','saveLetter','saveGalleryImage','deleteGalleryImage','moveGalleryItem','moveMusicTrack','removeTrack','addMusicToPlaylist','addMusicTrackRow','retryFileCleanup']) {
  const action=window[name];
  window[name]=async function(...args) {
    if(adminWriteBusy)return;
    if(!supabaseClient){showAdminToast('Connection unavailable. Reload and try again.');return;}
    adminWriteBusy=true;
    const controls=[...document.querySelectorAll('#admin-modal button, #pw-modal button')].map(el=>({el,disabled:el.disabled,text:el.textContent}));
    controls.forEach(({el})=>el.disabled=true);
    try { return await action.apply(this,args); }
    catch(error){showDataError('Save',error);}
    finally {
      adminWriteBusy=false;
      controls.forEach(({el,disabled,text})=>{el.disabled=disabled;if(el.textContent==='Uploading...'||el.textContent==='Optimizing Image...')el.textContent=text;});
    }
  };
}
