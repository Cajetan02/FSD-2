const KEY = 'contacts_v1';
let contacts = [];
let editingId = null;
let dragSrc = null;

function load() {
  try { contacts = JSON.parse(localStorage.getItem(KEY)) || []; } catch(e) { contacts = []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(contacts)); } catch(e) {}
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase() || '?';
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function getVal(id) { return document.getElementById(id).value.trim(); }
function setVal(id, v) { document.getElementById(id).value = v; }
function setErr(id, msg) {
  const el = document.getElementById('e-' + id.replace('f-',''));
  if(el) el.textContent = msg;
  document.getElementById(id).classList.toggle('error', !!msg);
}
function clearErrors() {
  ['f-name','f-email','f-phone'].forEach(id => setErr(id, ''));
}

function validate() {
  let ok = true;
  const name = getVal('f-name'), email = getVal('f-email'), phone = getVal('f-phone');
  if(!name) { setErr('f-name', 'Name is required'); ok = false; }
  if(!email) { setErr('f-email', 'Email is required'); ok = false; }
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('f-email', 'Enter a valid email'); ok = false; }
  if(!phone) { setErr('f-phone', 'Phone is required'); ok = false; }
  else if(!/^[\d\s\+\-\(\)]{6,}$/.test(phone)) { setErr('f-phone', 'Enter a valid phone number'); ok = false; }
  return ok;
}

function resetForm() {
  ['f-name','f-email','f-phone'].forEach(id => setVal(id,''));
  clearErrors();
  editingId = null;
  document.getElementById('btn-submit').textContent = 'Add contact';
  document.getElementById('btn-cancel').style.display = 'none';
}

function render() {
  const q = document.getElementById('search').value.toLowerCase();
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  );
  const list = document.getElementById('contact-list');
  document.getElementById('count-badge').textContent = contacts.length;
  document.getElementById('list-label').textContent = q ? `Results for "${q}"` : 'Contacts';

  if(contacts.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="icon">&#128100;</div>No contacts yet. Add your first one above.</div>';
    return;
  }
  if(filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="icon">&#128269;</div>No contacts match your search.</div>';
    return;
  }

  list.innerHTML = filtered.map(c => `
    <div class="contact-item${c.id===editingId?' editing':''}" draggable="true" data-id="${c.id}">
      <span class="drag-handle" title="Drag to reorder">&#8942;&#8942;</span>
      <div class="avatar">${initials(c.name)}</div>
      <div class="contact-info">
        <div class="contact-name">${esc(c.name)}</div>
        <div class="contact-meta">
          <span>&#9993; ${esc(c.email)}</span>
          <span>&#9990; ${esc(c.phone)}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn-icon${c.id===editingId?' edit-active':''}" title="Edit" onclick="startEdit('${c.id}')">&#9998;</button>
        <button class="btn-icon danger" title="Delete" onclick="deleteContact('${c.id}')">&#10005;</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.contact-item').forEach(el => {
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    el.addEventListener('dragend', onDragEnd);
  });
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function startEdit(id) {
  if(editingId === id) { resetForm(); render(); return; }
  const c = contacts.find(x => x.id === id);
  if(!c) return;
  editingId = id;
  setVal('f-name', c.name);
  setVal('f-email', c.email);
  setVal('f-phone', c.phone);
  clearErrors();
  document.getElementById('btn-submit').textContent = 'Save changes';
  document.getElementById('btn-cancel').style.display = '';
  document.getElementById('f-name').focus();
  render();
}

function deleteContact(id) {
  contacts = contacts.filter(c => c.id !== id);
  if(editingId === id) resetForm();
  save(); render();
  toast('Contact removed');
}

document.getElementById('btn-submit').addEventListener('click', () => {
  clearErrors();
  if(!validate()) return;
  const name = getVal('f-name'), email = getVal('f-email'), phone = getVal('f-phone');
  if(editingId) {
    const idx = contacts.findIndex(c => c.id === editingId);
    if(idx !== -1) contacts[idx] = { ...contacts[idx], name, email, phone };
    toast('Contact updated');
  } else {
    contacts.unshift({ id: uid(), name, email, phone });
    toast('Contact added');
  }
  save(); resetForm(); render();
});

document.getElementById('btn-cancel').addEventListener('click', () => {
  resetForm(); render();
});

document.getElementById('search').addEventListener('input', render);

['f-name','f-email','f-phone'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if(e.key === 'Enter') document.getElementById('btn-submit').click();
    if(e.key === 'Escape') { resetForm(); render(); }
  });
  document.getElementById(id).addEventListener('input', () => { clearErrors(); });
});

function onDragStart(e) {
  dragSrc = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if(this !== dragSrc) this.classList.add('drag-over');
}
function onDragLeave() { this.classList.remove('drag-over'); }
function onDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  if(this === dragSrc) return;
  const srcId = dragSrc.dataset.id;
  const dstId = this.dataset.id;
  const q = document.getElementById('search').value.toLowerCase();
  if(q) return;
  const si = contacts.findIndex(c => c.id === srcId);
  const di = contacts.findIndex(c => c.id === dstId);
  if(si < 0 || di < 0) return;
  const [moved] = contacts.splice(si, 1);
  contacts.splice(di, 0, moved);
  save(); render();
}
function onDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('drag-over'));
  dragSrc = null;
}

load(); render();
