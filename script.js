/* script.js
   Handles:
   - Year updates for footer
   - Mobile nav toggle
   - Notes CRUD in localStorage
   - Register form validation & demo save
   - Contact form validation
   - Small UX utilities (search, filter, fill form for edit)
*/

(function(){
  // Utility: current year
  const yearEls = [...document.querySelectorAll('[id^="year"]')];
  yearEls.forEach(el => el.textContent = new Date().getFullYear());

  // NAV TOGGLE (mobile)
  function setupNav(toggleId, navId){
    const t = document.getElementById(toggleId);
    const nav = document.getElementById(navId);
    if(!t || !nav) return;
    t.addEventListener('click', () => {
      const expanded = t.getAttribute('aria-expanded') === 'true';
      t.setAttribute('aria-expanded', String(!expanded));
      nav.style.display = expanded ? '' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.gap = '.5rem';
    });
  }
  setupNav('nav-toggle','main-nav');
  setupNav('nav-toggle-2','main-nav-2');
  setupNav('nav-toggle-3','main-nav-3');
  setupNav('nav-toggle-4','main-nav-4');

  /* ===================== NOTES APP (localStorage) ===================== */
  const NOTES_KEY = 'notesapp_notes_v1';

  function readNotes(){
    try{
      const raw = localStorage.getItem(NOTES_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.error('Failed reading notes', e);
      return [];
    }
  }

  function saveNotes(notes){
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  // Only run notes logic on notes.html
  if(document.getElementById('note-form')){
    const form = document.getElementById('note-form');
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    const tagInput = document.getElementById('note-tag');
    const idInput = document.getElementById('note-id');
    const notesListEl = document.getElementById('notes-list');
    const searchInput = document.getElementById('search-input');
    const filterTag = document.getElementById('filter-tag');
    const clearBtn = document.getElementById('clear-form');

    let notes = readNotes();

    function renderTagsOptions(){
      const tags = Array.from(new Set(notes.filter(n=>n.tag).map(n=>n.tag)));
      filterTag.innerHTML = '<option value="">All tags</option>';
      tags.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        filterTag.appendChild(opt);
      });
    }

    function renderNotes(filterText = '', tag = ''){
      notesListEl.innerHTML = '';
      const q = filterText.trim().toLowerCase();
      const filtered = notes.filter(n => {
        const matchQ = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
        const matchTag = !tag || n.tag === tag;
        return matchQ && matchTag;
      }).sort((a,b)=>b.updated - a.updated);

      if(filtered.length === 0){
        const li = document.createElement('li');
        li.className = 'note-item';
        li.textContent = 'No notes yet. Create your first note!';
        notesListEl.appendChild(li);
        return;
      }

      filtered.forEach(n => {
        const li = document.createElement('li');
        li.className = 'note-item';
        li.innerHTML = `
          <div class="note-top">
            <strong>${escapeHtml(n.title)}</strong>
            <div class="note-actions">
              <button class="small-btn edit" data-id="${n.id}">Edit</button>
              <button class="small-btn delete" data-id="${n.id}">Delete</button>
            </div>
          </div>
          <div class="note-meta">${n.tag ? `<em>${escapeHtml(n.tag)}</em> • ` : ''}${new Date(n.updated).toLocaleString()}</div>
          <div class="note-body">${escapeHtml(n.content)}</div>
        `;
        notesListEl.appendChild(li);
      });
    }

    function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

    // create or update
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      const tag = tagInput.value.trim();

      if(!title || !content){
        alert('Please provide title and content for the note.');
        return;
      }

      const existingId = idInput.value;
      if(existingId){
        // update
        const idx = notes.findIndex(n => n.id === existingId);
        if(idx > -1){
          notes[idx].title = title;
          notes[idx].content = content;
          notes[idx].tag = tag;
          notes[idx].updated = Date.now();
        }
      } else {
        // create
        const note = {
          id: String(Date.now()) + Math.random().toString(36).slice(2,7),
          title, content, tag,
          created: Date.now(),
          updated: Date.now()
        };
        notes.push(note);
      }

      saveNotes(notes);
      renderNotes(searchInput.value, filterTag.value);
      renderTagsOptions();
      form.reset();
      idInput.value = '';
      titleInput.focus();
    });

    // clear button
    clearBtn.addEventListener('click', () => { form.reset(); idInput.value = ''; });

    // delegate edit/delete
    notesListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if(!btn) return;
      const id = btn.dataset.id;
      if(btn.classList.contains('edit')){
        const note = notes.find(n=>n.id===id);
        if(note){
          idInput.value = note.id;
          titleInput.value = note.title;
          contentInput.value = note.content;
          tagInput.value = note.tag || '';
          titleInput.focus();
        }
      } else if(btn.classList.contains('delete')){
        if(confirm('Delete this note?')) {
          notes = notes.filter(n=>n.id!==id);
          saveNotes(notes);
          renderNotes(searchInput.value, filterTag.value);
          renderTagsOptions();
        }
      }
    });

    // search & filter
    searchInput.addEventListener('input', () => renderNotes(searchInput.value, filterTag.value));
    filterTag.addEventListener('change', () => renderNotes(searchInput.value, filterTag.value));

    // initial render
    renderTagsOptions();
    renderNotes();
  } // END notes page logic

  /* ===================== REGISTER FORM ===================== */
  if(document.getElementById('register-form')){
    const regForm = document.getElementById('register-form');
    const feedback = document.getElementById('register-feedback');

    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = regForm['name'].value.trim();
      const email = regForm['email'].value.trim();
      const password = regForm['password'].value;
      const passConfirm = regForm['password_confirm'].value;

      if(password.length < 6){
        feedback.textContent = 'Password must be at least 6 characters.';
        feedback.style.color = 'red';
        return;
      }
      if(password !== passConfirm){
        feedback.textContent = 'Passwords do not match.';
        feedback.style.color = 'red';
        return;
      }

      // Save demo user to localStorage (NOT secure — demo only)
      const USERS_KEY = 'notesapp_users_v1';
      const raw = localStorage.getItem(USERS_KEY);
      const users = raw ? JSON.parse(raw) : [];
      if(users.find(u => u.email === email)){
        feedback.textContent = 'An account with this email already exists (demo).';
        feedback.style.color = 'red';
        return;
      }
      users.push({ id: Date.now(), name, email, password: password });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      feedback.textContent = 'Registration successful (demo). You can now go to Notes.';
      feedback.style.color = 'green';
      regForm.reset();
    });
  }

  /* ===================== CONTACT FORM ===================== */
  if(document.getElementById('contact-form')){
    const contactForm = document.getElementById('contact-form');
    const feedback = document.getElementById('contact-feedback');

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactForm['name'].value.trim();
      const email = contactForm['email'].value.trim();
      const message = contactForm['message'].value.trim();

      if(!name || !email || !message){
        feedback.textContent = 'Please fill all fields.';
        feedback.style.color = 'red';
        return;
      }
      // Demo: pretend we sent message
      feedback.textContent = 'Thank you! Your message has been received (demo).';
      feedback.style.color = 'green';
      contactForm.reset();
    });
  }

  /* ===================== SMALL UTILS ===================== */
  // Smooth scroll for in-page anchors (if any)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if(target) target.scrollIntoView({behavior:'smooth'});
    });
  });

})();
