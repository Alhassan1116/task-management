/* ── State ── */
let tasks = [];
let activeFilter = 'all';
let pendingDeleteId = null;

/* ── DOM refs ── */
const taskForm      = document.getElementById('task-form');
const titleInput    = document.getElementById('title');
const descInput     = document.getElementById('description');
const statusInput   = document.getElementById('status');
const dueDateInput  = document.getElementById('due-date');
const editIdInput   = document.getElementById('edit-id');
const formTitle     = document.getElementById('form-title');
const submitBtn     = document.getElementById('submit-btn');
const cancelBtn     = document.getElementById('cancel-btn');
const formError     = document.getElementById('form-error');
const taskList      = document.getElementById('task-list');
const loadingEl     = document.getElementById('loading');
const taskCount     = document.getElementById('task-count');
const deleteModal   = document.getElementById('delete-modal');
const confirmDelBtn = document.getElementById('confirm-delete-btn');
const cancelDelBtn  = document.getElementById('cancel-delete-btn');

/* ── API helpers ── */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

/* ── Fetch & render ── */
async function loadTasks() {
  try {
    tasks = await apiFetch('/api/tasks');
    render();
  } catch (err) {
    loadingEl.textContent = `Failed to load tasks: ${err.message}`;
  }
}

function filteredTasks() {
  if (activeFilter === 'all') return tasks;
  return tasks.filter(t => t.status === activeFilter);
}

function render() {
  const visible = filteredTasks();
  taskCount.textContent = `${visible.length} task${visible.length !== 1 ? 's' : ''}`;

  if (visible.length === 0) {
    taskList.innerHTML = `<div class="empty-state">No tasks found. Add one above!</div>`;
    return;
  }

  taskList.innerHTML = visible.map(taskCard).join('');

  taskList.querySelectorAll('[data-edit]').forEach(btn =>
    btn.addEventListener('click', () => startEdit(Number(btn.dataset.edit)))
  );
  taskList.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => openDeleteModal(Number(btn.dataset.delete)))
  );
}

function taskCard(task) {
  const badgeClass = `badge-${task.status}`;
  const cardClass  = task.status === 'completed' ? 'task-card completed' : 'task-card';
  const desc = task.description
    ? `<p class="task-desc">${escHtml(task.description)}</p>`
    : '';
  const due = task.due_date
    ? `<span>Due: ${formatDate(task.due_date)}</span>`
    : '';
  const created = `<span>Created: ${formatDateTime(task.created_at)}</span>`;

  return `
    <div class="${cardClass}" data-id="${task.id}">
      <div class="task-body">
        <div class="task-header">
          <span class="task-title">${escHtml(task.title)}</span>
          <span class="badge ${badgeClass}">${task.status}</span>
        </div>
        ${desc}
        <div class="task-meta">${due}${created}</div>
      </div>
      <div class="task-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${task.id}" title="Edit">Edit</button>
        <button class="btn btn-danger btn-sm" data-delete="${task.id}" title="Delete">Delete</button>
      </div>
    </div>`;
}

/* ── Form: create / update ── */
taskForm.addEventListener('submit', async e => {
  e.preventDefault();
  hideError();

  const payload = {
    title:       titleInput.value.trim(),
    description: descInput.value.trim(),
    status:      statusInput.value,
    due_date:    dueDateInput.value || null,
  };

  if (!payload.title) {
    showError('Title is required.');
    titleInput.focus();
    return;
  }

  const id = editIdInput.value;
  try {
    if (id) {
      const updated = await apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      tasks = tasks.map(t => (t.id === updated.id ? updated : t));
    } else {
      const created = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
      tasks.unshift(created);
    }
    resetForm();
    render();
  } catch (err) {
    showError(err.message);
  }
});

function startEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editIdInput.value    = task.id;
  titleInput.value     = task.title;
  descInput.value      = task.description || '';
  statusInput.value    = task.status;
  dueDateInput.value   = task.due_date || '';
  formTitle.textContent = 'Edit Task';
  submitBtn.textContent = 'Save Changes';
  cancelBtn.hidden = false;
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  editIdInput.value     = '';
  taskForm.reset();
  formTitle.textContent  = 'Add New Task';
  submitBtn.textContent  = 'Add Task';
  cancelBtn.hidden = true;
  hideError();
}

/* ── Delete modal ── */
function openDeleteModal(id) {
  pendingDeleteId = id;
  deleteModal.hidden = false;
}

confirmDelBtn.addEventListener('click', async () => {
  if (pendingDeleteId === null) return;
  try {
    await apiFetch(`/api/tasks/${pendingDeleteId}`, { method: 'DELETE' });
    tasks = tasks.filter(t => t.id !== pendingDeleteId);
    render();
  } catch (err) {
    alert(`Delete failed: ${err.message}`);
  } finally {
    closeDeleteModal();
  }
});

cancelDelBtn.addEventListener('click', closeDeleteModal);
deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

function closeDeleteModal() {
  pendingDeleteId = null;
  deleteModal.hidden = true;
}

/* ── Filter buttons ── */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.status;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

/* ── Keyboard: close modal on Escape ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !deleteModal.hidden) closeDeleteModal();
});

/* ── Helpers ── */
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}/${y}`;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function showError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}

function hideError() {
  formError.hidden = true;
  formError.textContent = '';
}

/* ── Bootstrap ── */
loadTasks();
