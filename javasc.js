
/* || nav bar*/ 
const navbar = document.getElementById('navbar')
function openSidebar(){
navbar.classList.add('show')
}
function closeSidebar(){
    navbar.classList.remove('show')
}

/* || Log In and Sign Up setup (uses api.js) */
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');

async function showFormErrors(container, errors){
  const errEl = container.querySelector('.error-message') || container.querySelector('#error-message');
  if (errEl) errEl.innerText = errors.join('. ');
}

// Protect navigation and pages when not authenticated
function protectClick(e){
  if (!api.getAuthToken()){
    e.preventDefault();
    alert('Please log in to access this page.');
  }
}

function injectProtectedNavStyles(){
  if (document.getElementById('protected-nav-style')) return;
  const s = document.createElement('style');
  s.id = 'protected-nav-style';
  s.innerHTML = '.disabled-protected{opacity:0.5;pointer-events:none;cursor:not-allowed;}';
  document.head.appendChild(s);
}

function setNavAccess(){
  injectProtectedNavStyles();
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const links = nav.querySelectorAll('a');
  const token = api.getAuthToken();
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    // treat home as public
    if (href.endsWith('home.html') || href === '' || href === '#') return;
    if (!token){
      a.classList.add('disabled-protected');
      a.addEventListener('click', protectClick);
    }else{
      a.classList.remove('disabled-protected');
      a.removeEventListener('click', protectClick);
    }
  });
}

if (signupForm){
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstname = signupForm.querySelector('.firstname-input').value.trim();
    const password = signupForm.querySelector('.password-input').value;
    const wrapper = document.getElementById('signupForm');

    const errors = [];
    if (!firstname) errors.push('Firstname is required');
    if (!password) errors.push('Password is required');
    if (password && password.length < 8) errors.push('Password must be at least 8 characters');
    if (errors.length){
      await showFormErrors(wrapper, errors);
      return;
    }

    try{
      // register expects username, password, role
      const res = await api.register({username: firstname, password, role: 'user'});
      if (res && res.token){
        api.setAuthToken(res.token);
        setNavAccess();
        updateAuthUI();
        if (location.pathname.split('/').pop() !== 'majors.html') location.href = 'majors.html';
      }
      await showFormErrors(wrapper, ['Sign up successful']);
    }catch(err){
      await showFormErrors(wrapper, [err.message || 'Sign up failed']);
    }
  });
}

if (loginForm){
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstname = loginForm.querySelector('.firstname-input').value.trim();
    const password = loginForm.querySelector('.password-input').value;
    const wrapper = document.getElementById('loginForm');

    const errors = [];
    if (!firstname) errors.push('Firstname is required');
    if (!password) errors.push('Password is required');
    if (errors.length){
      await showFormErrors(wrapper, errors);
      return;
    }

    try{
      const res = await api.login({username: firstname, password});
      if (res && res.token){
        api.setAuthToken(res.token);
        setNavAccess();
        updateAuthUI();
        await showFormErrors(wrapper, ['Logged in successfully']);
        if (location.pathname.split('/').pop() !== 'majors.html') location.href = 'majors.html';
      }else{
        await showFormErrors(wrapper, ['Login succeeded']);
      }
    }catch(err){
      await showFormErrors(wrapper, [err.message || 'Login failed']);
    }
  });
}
/*const form = document.getElementById('form')
const firstname_input = document.getElementById('firstname-input')
const password_input = document.getElementById('password-input')
const error_message = document.getElementById('error-message')
if (form){
form.addEventListener('submit',(e) =>{
  let errors = []
  errors=getSignupFormErrors(firstname_input.value,password_input.value)
 if (errors.length>0){
  e.preventDefault()
  error_message.innerText = errors.join(". ")
 }
})

 function getSignupFormErrors(firstname, password){
  let errors = []
  if (firstname==='' || firstname==null){
    errors.push('Firstname is required')
    firstname_input.parentElement.classList.add('incorrect')
  }
  if (password==='' || password==null){
    errors.push('Password is required')
    password_input.parentElement.classList.add('incorrect')
  }
  if (password.length<8){
    errors.push('Password must be at least 8 characters')
    password_input.parentElement.classList.add('incorrect')
  }
    
  return errors;
 }

 const allInputs = [firstname_input,password_input]
 allInputs.forEach(input => {
  input.addEventListener('input', () => {
    if (input.parentElement.classList.contains('incorrect')){
      input.parentElement.classList.remove('incorrect')
      error_message.innerText=''
    }
  })
 })}*/

 /* || Majors filter*/
const filterList = document.querySelector(".filter");

const STATUS_NUMBER_TO_CATEGORY = {
  0: 'liked',
  1: 'applyTo',
  2: 'inProgress',
  3: 'applied'
};

const STATUS_STRING_TO_CATEGORY = {
  liked: 'liked',
  applyto: 'applyTo',
  inprogress: 'inProgress',
  applied: 'applied'
};

const CATEGORY_TO_STATUS_STRING = {
  liked: 'Liked',
  applyTo: 'ApplyTo',
  inProgress: 'InProgress',
  applied: 'Applied'
};

const CATEGORY_TO_STATUS_NUMBER = {
  liked: 0,
  applyTo: 1,
  inProgress: 2,
  applied: 3
};

const CATEGORY_TO_STAGE_LABEL = {
  liked: 'Liked',
  applyTo: 'Apply To',
  inProgress: 'In Progress',
  applied: 'Applied'
};

function toDateTimeLocal(value){
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const offsetMs = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value){
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

function toIsoFromDateAndTime(dateValue, timeValue){
  const safeDate = String(dateValue || '').trim();
  const safeTime = String(timeValue || '').trim();
  if (!safeDate || !safeTime) return null;

  const timeMatch = safeTime.match(/^([01][0-9]|2[0-3]):([0-5][0-9])$/);
  if (!timeMatch) return null;

  return `${safeDate}T${safeTime}:00`;
}

function formatDateTime(value){
  if (!value) return 'No date';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dt);
}

function escapeHtml(value){
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sameText(a, b){
  return String(a || '').trim() === String(b || '').trim();
}

function majorMatchesDraft(major, draft){
  if (!major || !draft) return false;
  return sameText(major.name, draft.name)
    && sameText(major.universityName, draft.universityName)
    && sameText(major.address, draft.address)
    && sameText(major.duration, draft.duration)
    && sameText(major.language, draft.language)
    && sameText(major.gradingSystem, draft.gradingSystem)
    && sameText(major.notes, draft.notes);
}

function getCheckedNumericValues(container){
  if (!container) return [];
  return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
    .map(input => Number(input.value))
    .filter(value => Number.isFinite(value) && value > 0);
}

function statusToCategory(status){
  if (status === null || status === undefined) return '';
  if (typeof status === 'number') return STATUS_NUMBER_TO_CATEGORY[status] || '';
  const normalized = String(status).trim().toLowerCase();
  return STATUS_STRING_TO_CATEGORY[normalized] || '';
}

function statusToDisplayLabel(status){
  const category = statusToCategory(status);
  return CATEGORY_TO_STAGE_LABEL[category] || '';
}

function getCurrentFilter(){
  if (!filterList) return 'all';
  const active = filterList.querySelector('.filter-btn.active');
  return active ? (active.getAttribute('data-filter') || 'all') : 'all';
}

if (filterList){
const filterButtons = filterList.querySelectorAll(".filter-btn");

filterButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    const clickedButton = e.currentTarget;
    let majorCategory = clickedButton.getAttribute("data-filter");
    if (!document.startViewTransition) {
      updateActiveButton(clickedButton);
      filterEvents(majorCategory);
      return;
    }

    document.startViewTransition(() => {
      updateActiveButton(clickedButton);
      filterEvents(majorCategory);
    });
  });
});}

function updateActiveButton(newButton){
  filterList.querySelector(".active").classList.remove("active");
  newButton.classList.add("active");
}

function filterEvents(filter){
  const majors = document.querySelectorAll('.majors .major');
  majors.forEach((major) => {
    if (major.classList.contains('add-major')){
      major.removeAttribute("hidden");
      return;
    }
    let majorCategory = major.getAttribute("data-category");

    if(filter==="all" || filter=== majorCategory){
      major.removeAttribute("hidden");
    }else{
      major.setAttribute("hidden", "");
    }
  });
}

/* || Show AddMajor */
const openBtn = document.getElementById('openM');
const modal_container = document.getElementById('modal_container');
const closeBtn = document.getElementById('closeM');

async function loadExistingExamsForMajorForm(){
  const examsContainer = document.getElementById('majorExistingExams');
  if (!examsContainer) return;

  examsContainer.innerHTML = '<p>Loading exams...</p>';
  try{
    const exams = await api.getExams();
    const list = Array.isArray(exams) ? exams : [];
    if (!list.length){
      examsContainer.innerHTML = '<p>No exams available</p>';
      return;
    }

    examsContainer.innerHTML = '';
    list.forEach(exam => {
      const label = document.createElement('label');
      label.className = 'exam-checkbox-item';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'existingExamId';
      checkbox.value = String(exam.id || '');
      const text = document.createElement('span');
      text.textContent = `${exam.testName || 'Exam'} (${formatDateTime(exam.date)})`;
      label.append(checkbox, text);
      examsContainer.appendChild(label);
    });
  }catch(err){
    console.error('Failed to load existing exams for major form', err);
    examsContainer.innerHTML = '<p>No exams available</p>';
  }
}

if(modal_container){
openBtn.addEventListener('click', () => {
  loadExistingExamsForMajorForm();
  modal_container.classList.add('active');
  
});

closeBtn.addEventListener('click', () => {
  modal_container.classList.remove('active');  
});}

/* || Majors: fetch from API and handle add major */
const majorsContainer = document.querySelector('.majors');
async function renderMajors(){
  if (!majorsContainer) return;
  try{
    const majors = await api.getMajors();
    // clear existing non-modal items
    majorsContainer.innerHTML = '';
    if (Array.isArray(majors)){
      majors.forEach(m => {
        const div = document.createElement('div');
        div.className = 'major';

        const category = statusToCategory(m.status);
        if (category) div.setAttribute('data-category', category);
        
        // attach the major data for viewer
        div._major = m;
        div._majorId = m.id;
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'major-delete-btn';
        deleteBtn.type = 'button';
        deleteBtn.title = 'Delete';
        deleteBtn.textContent = '×';
        // Use available fields safely
        const title = document.createElement('h3');
        title.innerText = m.name || m.universityName || 'Major';
        const ul = document.createElement('ul');
        ul.className = 'major-info';
        const liUniversity = document.createElement('li'); liUniversity.innerHTML = `<span>University:</span> ${m.universityName || ''}`;
        const liCity = document.createElement('li'); liCity.innerHTML = `<span>City:</span> ${m.address || ''}`;
        const liDuration = document.createElement('li'); liDuration.innerHTML = `<span>Duration:</span> ${m.duration || ''}`;
        const liFee = document.createElement('li'); liFee.innerHTML = `<span>Fee:</span> ${m.gradingSystem || ''}`;
        ul.append(liUniversity, liCity, liDuration, liFee);
        div.append(deleteBtn, title, ul);
        majorsContainer.appendChild(div);
      });
    }
    // add the add-major button
    const addDiv = document.createElement('div');
    addDiv.className = 'add-major major';
    addDiv.innerHTML = '<button id="openM">+ Add major</button>';
    majorsContainer.appendChild(addDiv);
    // rebind openM
    const newOpen = document.getElementById('openM');
    if (newOpen) newOpen.addEventListener('click', () => {
      loadExistingExamsForMajorForm();
      modal_container.classList.add('active');
    });
    attachMajorViewerHandlers();
    filterEvents(getCurrentFilter());
  }catch(e){
    console.error('Failed to load majors', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setNavAccess();
  // redirect to home if trying to open protected pages while unauthenticated
  const token = api.getAuthToken();
  const path = location.pathname.split('/').pop();
  if (!token && path && path !== '' && path !== 'home.html' && path !== 'index.html'){
    // allow visiting home; otherwise redirect to home
    alert('Please log in to access that page.');
    window.location.href = 'home.html';
    return;
  }
  renderMajors();
  renderExamsPage();
  // Also attach handlers for static majors that might not be replaced by renderMajors
  setTimeout(() => attachMajorViewerHandlers(), 100);
});

// Show major details in viewer modal when clicked
function attachMajorViewerHandlers(){
  const container = document.querySelector('.majors');
  if (!container) return;
  if (container._viewerHandlersAttached) return;
  container._viewerHandlersAttached = true;

  container.addEventListener('click', (e) => {
    // Handle delete button click
    if (e.target.closest('.major-delete-btn')) {
      e.stopPropagation();
      const majorEl = e.target.closest('.major');
      if (majorEl && majorEl._majorId) {
        deleteMajor(majorEl._majorId, majorEl);
      }
      return;
    }
    
    const majorEl = e.target.closest('.major');
    if (!majorEl) return;
    if (majorEl.classList.contains('add-major')) return;
    
    // Try to get data from API (_major property)
    let data = majorEl._major;
    
    // If no API data, extract from static HTML
    if (!data) {
      const title = majorEl.querySelector('h3');
      const infoItems = majorEl.querySelectorAll('.major-info li');
      
      if (title && infoItems.length > 0) {
        data = {
          universityName: '',
          name: title.innerText,
          address: '',
          duration: '',
          gradingSystem: '',
          notes: '',
          language: '',
          status: ''
        };
        
        // Parse info items
        infoItems.forEach(item => {
          const text = item.innerText || item.textContent;
          if (text.includes('University')) {
            data.universityName = text.replace(/University:\s*/i, '').trim();
          } else if (text.includes('City')) {
            data.address = text.replace(/City:\s*/i, '').trim();
          } else if (text.includes('Duration')) {
            data.duration = text.replace(/Duration:\s*/i, '').trim();
          } else if (text.includes('Fee')) {
            data.gradingSystem = text.replace(/Fee:\s*/i, '').trim();
          }
        });

        const staticCategory = majorEl.getAttribute('data-category') || '';
        if (staticCategory) data.status = CATEGORY_TO_STATUS_STRING[staticCategory] || staticCategory;
      }
    }
    
    if (data) showMajorViewer(data);
  });

  // close viewer when clicking outside or pressing Escape
  const viewer = document.getElementById('viewer_modal');
  if (viewer){
    viewer.addEventListener('click', (e) => {
      if (e.target === viewer) closeMajorViewer();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMajorViewer(); });
  }
}

function showMajorViewer(m){
  const vm = document.getElementById('viewer_modal');
  if (!vm) return;

  vm._majorData = m;
  vm._linkedExamIds = [];
  vm.querySelector('.viewer-title').innerText = m.name || m.universityName || 'Major';
  vm.querySelector('.viewer-name').value = m.name || '';
  vm.querySelector('.viewer-university').value = m.universityName || '';
  vm.querySelector('.viewer-city').value = m.address || '';
  vm.querySelector('.viewer-duration').value = m.duration || '';
  vm.querySelector('.viewer-language').value = m.language || '';
  vm.querySelector('.viewer-fee').value = m.gradingSystem || '';
  vm.querySelector('.viewer-stage').value = statusToCategory(m.status) || 'liked';
  vm.querySelector('.viewer-notes').value = m.notes || m.requiredDocuments || '';

  const editButton = vm.querySelector('#editViewer');
  if (editButton) editButton.disabled = !m.id;
  setActiveViewerTab('details');
  loadMajorExams(m).catch(err => console.error('Failed to load major exams', err));
  setViewerEditing(false);
  vm.classList.add('active');
}

function setViewerEditing(isEditing){
  const vm = document.getElementById('viewer_modal');
  if (!vm) return;
  const fields = vm.querySelectorAll('.viewer-input, .viewer-select, .viewer-textarea');
  fields.forEach(field => { field.disabled = !isEditing; });

  const editBtn = vm.querySelector('#editViewer');
  const saveBtn = vm.querySelector('#saveViewer');
  const cancelBtn = vm.querySelector('#cancelViewer');
  if (editBtn) editBtn.hidden = isEditing;
  if (saveBtn) saveBtn.hidden = !isEditing;
  if (cancelBtn) cancelBtn.hidden = !isEditing;
}

function closeMajorViewer(){
  const vm = document.getElementById('viewer_modal');
  if (!vm) return;
  setViewerEditing(false);
  vm.classList.remove('active');
}

function setActiveViewerTab(tabName){
  const vm = document.getElementById('viewer_modal');
  if (!vm) return;
  vm.querySelectorAll('.viewer-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-viewer-tab') === tabName);
  });
  vm.querySelectorAll('.viewer-panel').forEach(panel => {
    panel.classList.toggle('active', panel.getAttribute('data-viewer-panel') === tabName);
  });
}

function getMajorExamIds(majorRaw){
  const majorExams = Array.isArray(majorRaw?.majorExams)
    ? majorRaw.majorExams
    : (Array.isArray(majorRaw?.MajorExams) ? majorRaw.MajorExams : []);
  return Array.from(new Set(
    majorExams
      .map(mx => Number(mx?.examId))
      .filter(id => Number.isFinite(id) && id > 0)
  ));
}

function majorStatusToDtoString(status){
  const category = statusToCategory(status);
  return CATEGORY_TO_STATUS_STRING[category] || String(status || 'Liked');
}

async function updateMajorExamIds(majorId, extraExamIds){
  const fullMajor = await api.getMajor(majorId);
  const currentExamIds = getMajorExamIds(fullMajor);
  const mergedExamIds = Array.from(new Set([
    ...currentExamIds,
    ...((extraExamIds || []).map(v => Number(v)).filter(v => Number.isFinite(v) && v > 0))
  ]));

  const payload = {
    id: Number(fullMajor.id || majorId),
    name: fullMajor.name || '',
    universityName: fullMajor.universityName || '',
    address: fullMajor.address || '',
    duration: fullMajor.duration || '',
    language: fullMajor.language || '',
    gradingSystem: fullMajor.gradingSystem || '',
    notes: fullMajor.notes || fullMajor.requiredDocuments || '',
    status: majorStatusToDtoString(fullMajor.status),
    examIds: mergedExamIds
  };

  await api.updateMajor(majorId, payload);
  return mergedExamIds;
}

async function loadMajorExams(major){
  const vm = document.getElementById('viewer_modal');
  if (!vm || !major || !major.id) return;

  const examsList = vm.querySelector('.viewer-exams-list');
  const viewerExamBoxes = vm.querySelector('.viewer-exam-checkboxes');
  if (!examsList || !viewerExamBoxes) return;

  examsList.innerHTML = '<li>Loading exams...</li>';
  viewerExamBoxes.innerHTML = '';

  const [majorRaw, examsRaw] = await Promise.all([api.getMajor(major.id), api.getExams()]);
  const exams = Array.isArray(examsRaw) ? examsRaw : [];

  const linkedIds = new Set(getMajorExamIds(majorRaw));

  const linkedExams = exams.filter(ex => linkedIds.has(ex.id));
  vm._linkedExamIds = linkedExams.map(ex => ex.id);

  const isEditing = vm.querySelector('#saveViewer')?.hidden === false;
  const examsToRender = isEditing ? exams : linkedExams;
  if (!examsToRender.length){
    viewerExamBoxes.innerHTML = '<p>No exams selected.</p>';
  }else{
    examsToRender.forEach(exam => {
      const label = document.createElement('label');
      label.className = 'exam-checkbox-item';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'viewer-exam-checkbox';
      checkbox.value = String(exam.id || '');
      checkbox.checked = linkedIds.has(exam.id);
      checkbox.disabled = !isEditing;
      const text = document.createElement('span');
      text.textContent = `${exam.testName || 'Exam'} (${formatDateTime(exam.date)})`;
      label.append(checkbox, text);
      viewerExamBoxes.appendChild(label);
    });
  }

  if (!linkedExams.length) examsList.innerHTML = '<li>No exams linked to this major yet.</li>';
  else {
    examsList.innerHTML = linkedExams.map(ex => {
      return `<li>${escapeHtml(ex.testName || 'Exam')} · ${escapeHtml(formatDateTime(ex.date))}${ex.address ? ` · ${escapeHtml(ex.address)}` : ''}</li>`;
    }).join('');
  }

}

// Delete major function
async function deleteMajor(majorId, majorElement) {
  if (!confirm('Are you sure you want to delete this major?')) {
    return;
  }
  
  try {
    await api.deleteMajor(majorId);
    // Remove the element smoothly
    majorElement.style.opacity = '0';
    majorElement.style.transform = 'scale(0.95)';
    majorElement.style.transition = 'all 200ms ease';
    setTimeout(() => {
      majorElement.remove();
      // Refresh the majors list to sync with API
      renderMajors();
    }, 200);
  } catch (err) {
    console.error('Failed to delete major', err);
    let errorMsg = err.message || 'Failed to delete major';
    
    // Handle specific error codes
    if (err.message && err.message.includes('403')) {
      errorMsg = 'You do not have permission to delete this major. Only the creator can delete it.';
    } else if (err.message && err.message.includes('404')) {
      errorMsg = 'Major not found. It may have already been deleted.';
    } else if (err.message && err.message.includes('401')) {
      errorMsg = 'Your session has expired. Please log in again.';
    }
    
    alert(errorMsg);
  }
}

// wire close button
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('#closeViewer');
  if (btn){
    closeMajorViewer();
  }
});

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest && e.target.closest('.viewer-tab');
  if (!tabBtn) return;
  const tabName = tabBtn.getAttribute('data-viewer-tab');
  if (!tabName) return;
  setActiveViewerTab(tabName);
});

document.addEventListener('click', (e) => {
  const editBtn = e.target.closest && e.target.closest('#editViewer');
  if (editBtn){
    setViewerEditing(true);
    const vm = document.getElementById('viewer_modal');
    if (vm && vm._majorData) loadMajorExams(vm._majorData).catch(err => console.error('Failed to refresh exams in edit mode', err));
  }
});

document.addEventListener('click', (e) => {
  const cancelBtn = e.target.closest && e.target.closest('#cancelViewer');
  if (cancelBtn){
    const vm = document.getElementById('viewer_modal');
    if (vm && vm._majorData) showMajorViewer(vm._majorData);
  }
});

document.addEventListener('click', async (e) => {
  const saveBtn = e.target.closest && e.target.closest('#saveViewer');
  if (saveBtn){
    const vm = document.getElementById('viewer_modal');
    if (!vm || !vm._majorData || !vm._majorData.id) return;

    const statusCategory = vm.querySelector('.viewer-stage').value;
    const selectedExamIds = getCheckedNumericValues(vm.querySelector('.viewer-exam-checkboxes'));
    const currentlyLinked = Array.isArray(vm._linkedExamIds) ? vm._linkedExamIds : [];
    try{
      const mergedExamIds = Array.from(new Set([
        ...currentlyLinked,
        ...selectedExamIds
      ]));

      const updatedMajor = {
        id: Number(vm._majorData.id),
        name: vm.querySelector('.viewer-name').value.trim(),
        universityName: vm.querySelector('.viewer-university').value.trim(),
        address: vm.querySelector('.viewer-city').value.trim(),
        duration: vm.querySelector('.viewer-duration').value.trim(),
        language: vm.querySelector('.viewer-language').value.trim(),
        gradingSystem: vm.querySelector('.viewer-fee').value.trim(),
        notes: vm.querySelector('.viewer-notes').value.trim(),
        status: CATEGORY_TO_STATUS_STRING[statusCategory] || 'Liked',
        examIds: mergedExamIds
      };

      await api.updateMajor(vm._majorData.id, updatedMajor);

      const refreshedMajor = await api.getMajor(vm._majorData.id);

      if (!majorMatchesDraft(refreshedMajor, updatedMajor)){
        alert('Update request was accepted, but data did not change on the server. Please check backend update mapping.');
        return;
      }

      const refreshedExamIds = getMajorExamIds(refreshedMajor);
      const missingExamIds = selectedExamIds.filter(examId => !refreshedExamIds.includes(examId));
      if (missingExamIds.length){
        alert('Major text was saved, but selected exams were not linked by the server.');
        return;
      }

      closeMajorViewer();
      await renderMajors();
    }catch(err){
      console.error('Failed to update major', err);
      alert('Failed to update major: ' + (err.message || err));
    }
  }
});

async function renderExamsPage(){
  const list = document.getElementById('examsPageList');
  if (!list) return;

  try{
    const exams = await api.getExams();
    const safeList = Array.isArray(exams) ? exams : [];
    if (!safeList.length){
      list.innerHTML = '<li>No exams yet.</li>';
      return;
    }

    list.innerHTML = safeList.map(ex => {
      const name = escapeHtml(ex.testName || 'Exam');
      const date = escapeHtml(formatDateTime(ex.date));
      const address = ex.address ? ` · ${escapeHtml(ex.address)}` : '';
      return `<li><span><strong>${name}</strong> · ${date}${address}</span><div class="exam-row-actions"><button class="exam-edit-btn" data-exam-id="${ex.id}" type="button">Edit</button><button class="exam-delete-btn" data-exam-id="${ex.id}" type="button">Delete</button></div></li>`;
    }).join('');
  }catch(err){
    console.error('Failed to load exams page', err);
    list.innerHTML = '<li>Failed to load exams.</li>';
  }
}

const examPageForm = document.getElementById('examPageForm');
if (examPageForm){
  examPageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(examPageForm);
    const examDate = (fd.get('examDate') || '').toString().trim();
    const examTime = (fd.get('examTime') || '').toString().trim();
    const payload = {
      testName: (fd.get('testName') || '').toString().trim(),
      date: toIsoFromDateAndTime(examDate, examTime),
      address: (fd.get('address') || '').toString().trim()
    };

    if (!payload.testName || !payload.date){
      alert('Exam name, date, and 24-hour time (HH:mm) are required.');
      return;
    }

    try{
      await api.createExam(payload);
      examPageForm.reset();
      await renderExamsPage();
    }catch(err){
      console.error('Create exam failed', err);
      alert('Failed to create exam: ' + (err.message || err));
    }
  });
}

async function editExam(examId){
  if (!examId) return;
  try{
    const exam = await api.getExam(examId);
    if (!exam || typeof exam !== 'object'){
      alert('Exam not found.');
      return;
    }
    showExamViewer(exam);
  }catch(err){
    console.error('Edit exam failed', err);
    alert('Failed to edit exam: ' + (err.message || err));
  }
}

function showExamViewer(exam){
  const vm = document.getElementById('exam_viewer_modal');
  if (!vm) return;

  const dateTimeLocal = toDateTimeLocal(exam.date);
  const [datePart, timePartRaw] = dateTimeLocal.includes('T')
    ? dateTimeLocal.split('T')
    : ['', ''];
  const timePart = (timePartRaw || '').slice(0, 5);

  vm._examData = exam;
  vm.querySelector('.viewer-title').innerText = exam.testName || 'Exam';
  vm.querySelector('.viewer-exam-name').value = exam.testName || '';
  vm.querySelector('.viewer-exam-date').value = datePart || '';
  vm.querySelector('.viewer-exam-time').value = timePart || '';
  vm.querySelector('.viewer-exam-address').value = exam.address || '';

  setExamViewerEditing(false);
  vm.classList.add('active');
}

function setExamViewerEditing(isEditing){
  const vm = document.getElementById('exam_viewer_modal');
  if (!vm) return;

  const fields = vm.querySelectorAll('.viewer-input');
  fields.forEach(field => { field.disabled = !isEditing; });

  const editBtn = vm.querySelector('#editExamViewer');
  const saveBtn = vm.querySelector('#saveExamViewer');
  const cancelBtn = vm.querySelector('#cancelExamViewer');
  if (editBtn) editBtn.hidden = isEditing;
  if (saveBtn) saveBtn.hidden = !isEditing;
  if (cancelBtn) cancelBtn.hidden = !isEditing;
}

function closeExamViewer(){
  const vm = document.getElementById('exam_viewer_modal');
  if (!vm) return;
  setExamViewerEditing(false);
  vm.classList.remove('active');
}

async function resolveExamClient(examData){
  if (examData?.client && typeof examData.client === 'object') return examData.client;

  const fallbackClientId = Number(getUserIdFromToken());
  const resolvedClientId = Number(examData?.clientId || examData?.client?.id || fallbackClientId);
  if (!Number.isFinite(resolvedClientId) || resolvedClientId <= 0) return null;

  try{
    const fetchedClient = await api.getClient(resolvedClientId);
    if (fetchedClient && typeof fetchedClient === 'object') return fetchedClient;
  }catch(err){
    console.warn('Could not fetch client for exam update payload', err);
  }

  return { id: resolvedClientId };
}

document.addEventListener('click', async (e) => {
  const editBtn = e.target.closest && e.target.closest('.exam-edit-btn');
  if (!editBtn) return;

  const examId = Number(editBtn.getAttribute('data-exam-id'));
  if (!examId) return;

  await editExam(examId);
});

document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest && e.target.closest('#closeExamViewer');
  if (closeBtn) closeExamViewer();
});

document.addEventListener('click', (e) => {
  const editBtn = e.target.closest && e.target.closest('#editExamViewer');
  if (!editBtn) return;
  const vm = document.getElementById('exam_viewer_modal');
  if (!vm || !vm._examData) return;
  setExamViewerEditing(true);
});

document.addEventListener('click', (e) => {
  const cancelBtn = e.target.closest && e.target.closest('#cancelExamViewer');
  if (!cancelBtn) return;
  const vm = document.getElementById('exam_viewer_modal');
  if (!vm || !vm._examData) return;
  showExamViewer(vm._examData);
});

document.addEventListener('click', async (e) => {
  const saveBtn = e.target.closest && e.target.closest('#saveExamViewer');
  if (!saveBtn) return;

  const vm = document.getElementById('exam_viewer_modal');
  if (!vm || !vm._examData || !vm._examData.id) return;

  const name = vm.querySelector('.viewer-exam-name').value.trim();
  const dateValue = vm.querySelector('.viewer-exam-date').value.trim();
  const timeValue = vm.querySelector('.viewer-exam-time').value.trim();
  const address = vm.querySelector('.viewer-exam-address').value.trim();
  const isoDate = toIsoFromDateAndTime(dateValue, timeValue);

  if (!name || !isoDate){
    alert('Exam name, valid date, and 24-hour time (HH:mm) are required.');
    return;
  }

  try{
    const resolvedClient = await resolveExamClient(vm._examData);
    const payload = {
      id: Number(vm._examData.id),
      testName: name,
      date: isoDate,
      address
    };

    const resolvedClientId = Number(resolvedClient?.id || vm._examData.clientId || getUserIdFromToken());
    if (Number.isFinite(resolvedClientId) && resolvedClientId > 0) payload.clientId = resolvedClientId;
    if (resolvedClient) payload.client = resolvedClient;

    if (!payload.client){
      alert('Unable to resolve required Client for this exam update. Please sign in again and retry.');
      return;
    }

    await api.updateExam(vm._examData.id, payload);
    closeExamViewer();
    await renderExamsPage();
  }catch(err){
    console.error('Failed to update exam', err);
    alert('Failed to update exam: ' + (err.message || err));
  }
});

document.addEventListener('click', (e) => {
  const vm = document.getElementById('exam_viewer_modal');
  if (!vm) return;
  if (e.target === vm) closeExamViewer();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  closeExamViewer();
});

document.addEventListener('click', async (e) => {
  const deleteBtn = e.target.closest && e.target.closest('.exam-delete-btn');
  if (!deleteBtn) return;

  const examId = Number(deleteBtn.getAttribute('data-exam-id'));
  if (!examId) return;
  if (!confirm('Delete this exam?')) return;

  try{
    await api.deleteExam(examId);
    await renderExamsPage();
  }catch(err){
    console.error('Delete exam failed', err);
    alert('Failed to delete exam: ' + (err.message || err));
  }
});

// Account menu handling: show/hide menu and account actions
function closeAccountMenu(){
  const panel = document.getElementById('accountMenuPanel');
  const toggle = document.getElementById('accountMenuToggle');
  if (panel) panel.classList.add('hidden');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function toggleAccountMenu(){
  const panel = document.getElementById('accountMenuPanel');
  const toggle = document.getElementById('accountMenuToggle');
  if (!panel) return;
  panel.classList.toggle('hidden');
  if (toggle) toggle.setAttribute('aria-expanded', panel.classList.contains('hidden') ? 'false' : 'true');
}

function updateAccountMenu(){
  const menu = document.getElementById('accountMenu');
  if (!menu) return;
  if (api.getAuthToken()) menu.classList.remove('hidden');
  else {
    menu.classList.add('hidden');
    closeAccountMenu();
  }
}

async function deleteCurrentUser(){
  const userId = Number(getUserIdFromToken());
  if (!Number.isFinite(userId) || userId <= 0){
    alert('Could not determine current user id from token. Please sign in again.');
    return;
  }

  const requiredText = 'DELETE';
  const typed = prompt(`Type ${requiredText} to permanently delete your account:`);
  if (typed === null) return;
  if (String(typed).trim().toUpperCase() !== requiredText){
    alert('Account deletion cancelled. Confirmation text did not match.');
    return;
  }

  try{
    await api.deleteClient(userId);
    signOut();
  }catch(err){
    console.error('Delete account failed', err);
    alert('Failed to delete account: ' + (err.message || err));
  }
}

function signOut(){
  api.setAuthToken(null);
  api.setMockMode(false);
  updateAccountMenu();
  setNavAccess();
  updateAuthUI();
  // return to home
  if (location.pathname.split('/').pop() !== 'home.html') location.href = 'home.html';
}

document.addEventListener('click', (e) => {
  const toggleBtn = e.target.closest && e.target.closest('#accountMenuToggle');
  if (toggleBtn){
    e.preventDefault();
    e.stopPropagation();
    toggleAccountMenu();
    return;
  }

  const signoutBtn = e.target.closest && e.target.closest('#accountSignout');
  if (signoutBtn) {
    e.preventDefault();
    signOut();
    return;
  }

  const deleteBtn = e.target.closest && e.target.closest('#accountDelete');
  if (deleteBtn){
    e.preventDefault();
    deleteCurrentUser();
    return;
  }

  const panel = document.getElementById('accountMenuPanel');
  const menu = document.getElementById('accountMenu');
  if (panel && menu && !panel.classList.contains('hidden') && !menu.contains(e.target)){
    closeAccountMenu();
  }
});

// update account menu visibility on load and when auth changes
setTimeout(updateAccountMenu, 50);

// Hide/show auth UI for logged-in state
function updateAuthUI(){
  const auth = document.querySelector('.auth-container');
  if (!auth) return;
  if (api.getAuthToken()) auth.style.display = 'none';
  else auth.style.display = '';
}

setTimeout(updateAuthUI, 50);

// Set API base to the provided server and print quick test instructions
try{
  api.setBaseUrl('https://azapptf2oro3bv6ahg.azurewebsites.net');
  console.info('API base set to https://azapptf2oro3bv6ahg.azurewebsites.net — run `apiTest.majors()` or `apiTest.apps()` in the console to test.');
}catch(e){
  console.warn('api not available yet', e);
}

const majorForm = document.getElementById('majorForm');
if (majorForm){
  majorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data using FormData API
    const formData = new FormData(majorForm);
    
    // Extract values with fallbacks
    const name = formData.get('name')?.trim() || '';
    const university = formData.get('university')?.trim() || '';
    const city = formData.get('city')?.trim() || '';
    const fee = formData.get('fee')?.trim() || '';
    const duration = formData.get('duration')?.trim() || '';
    const language = formData.get('language')?.trim() || '';
    const status = formData.get('status') || '';
    const notes = formData.get('notes')?.trim() || '';
    const existingExamIds = getCheckedNumericValues(document.getElementById('majorExistingExams'));
    
    const payload = {
      name: name,
      universityName: university,
      address: city,
      duration: duration,
      language: language,
      gradingSystem: fee,
      notes: notes,
      status: status
    };

    try{
      const createdMajor = await api.createMajor(payload);

      if (createdMajor && createdMajor.id && existingExamIds.length){
        await updateMajorExamIds(createdMajor.id, existingExamIds);
      }

      modal_container.classList.remove('active');
      majorForm.reset();
      await renderMajors();
    }catch(err){
      console.error('Add major failed', err);
      alert('Failed to add major: ' + (err.message || err));
    }
  });
}

// Quick console helpers to test API connectivity
window.apiTest = {
  apps: async () => { try{ console.log('Applications:', await api.getApplications()); }catch(e){ console.error(e); } },
  exams: async () => { try{ console.log('Exams:', await api.getExams()); }catch(e){ console.error(e); } },
  clients: async () => { try{ console.log('Clients:', await api.getClients()); }catch(e){ console.error(e); } },
  majors: async () => { try{ console.log('Majors:', await api.getMajors()); }catch(e){ console.error(e); } }
};

// Helper: extract user id from JWT stored by api.getAuthToken()
function getUserIdFromToken(){
  const rawToken = api.getAuthToken();
  if (!rawToken) return null;
  try{
    const normalized = String(rawToken)
      .replace(/^Bearer\s+/i, '')
      .replace(/^"|"$/g, '')
      .trim();
    const tokenParts = normalized.split('.');
    if (tokenParts.length < 2) return null;
    const payload = tokenParts[1];
    const padded = payload.padEnd(Math.ceil(payload.length/4)*4, '=');
    const json = JSON.parse(atob(padded.replace(/-/g,'+').replace(/_/g,'/')));
    return json['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      || json['http://schemas.microsoft.com/ws/2005/05/identity/claims/nameidentifier']
      || json['nameidentifier']
      || json['nameid']
      || json['sub']
      || null;
  }catch(e){
    return null;
  }
}

/* || Show and hide Sign up and Log in */
const wrapperLoginForm = document.getElementById("loginForm");
const wrapperSignupForm = document.getElementById("signupForm");

const showSignupBtn = document.getElementById("showSignup");
if (showSignupBtn && wrapperLoginForm && wrapperSignupForm) {
  showSignupBtn.addEventListener("click", () => {
    wrapperLoginForm.classList.remove("active");
    wrapperSignupForm.classList.add("active");
  });
}

const showLoginBtn = document.getElementById("showLogin");
if (showLoginBtn && wrapperLoginForm && wrapperSignupForm) {
  showLoginBtn.addEventListener("click", () => {
    wrapperSignupForm.classList.remove("active");
    wrapperLoginForm.classList.add("active");
  });
}