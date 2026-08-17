// Main Application Controller for Doto (TickTick clone)
import { ApiClient } from './api.js';
import { store } from './store.js';
import { audio } from './audio.js';
import { renderSidebar } from './components/sidebar.js';
import { renderTopbar } from './components/topbar.js';
import { renderTaskList } from './components/taskList.js';
import { renderTaskDetail } from './components/taskDetail.js';
import { renderKanbanView } from './components/kanbanView.js';
import { renderCalendarView, getCalendarState, setCalendarState } from './components/calendarView.js';
import { renderHabitsView } from './components/habitsView.js';
import { renderFocusView } from './components/focusView.js';
import { renderStatsView } from './components/statsView.js';
import { renderModals } from './components/modals.js';

let timerInterval = null;
let currentStatsData = null;

// Toast Helper
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Data Fetching Helpers
async function loadUserData() {
  try {
    const user = await ApiClient.auth.me();
    store.setUser(user);
    audio.setSoundEnabled(user.sound_enabled ?? true);
    
    // Load lists, tags, habits, tasks
    await Promise.all([
      fetchLists(),
      fetchTags(),
      fetchHabits(),
      fetchTasks(),
      fetchStats(),
    ]);
  } catch (err) {
    console.error('Failed to load user data:', err);
    store.openModal('auth');
  }
}

async function fetchTasks() {
  const state = store.getState();
  const activeView = state.activeView;

  try {
    let params = {};
    if (activeView === 'inbox' || activeView === 'today' || activeView === 'next7days' || activeView === 'completed' || activeView === 'trash') {
      params.view = activeView;
    } else if (activeView.startsWith('list_')) {
      params.list_id = parseInt(activeView.replace('list_', ''), 10);
    } else if (activeView.startsWith('tag_')) {
      params.tag_id = parseInt(activeView.replace('tag_', ''), 10);
    }

    const tasks = await ApiClient.tasks.getAll(params);
    store.setTasks(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
  }
}

async function fetchLists() {
  try {
    const lists = await ApiClient.lists.getAll();
    store.setState({ lists });
  } catch (err) {
    console.error('Error fetching lists:', err);
  }
}

async function fetchTags() {
  try {
    const tags = await ApiClient.tags.getAll();
    store.setState({ tags });
  } catch (err) {
    console.error('Error fetching tags:', err);
  }
}

async function fetchHabits() {
  try {
    const habits = await ApiClient.habits.getAll();
    store.setState({ habits });
  } catch (err) {
    console.error('Error fetching habits:', err);
  }
}

async function fetchStats() {
  try {
    currentStatsData = await ApiClient.stats.getSummary();
    const karmaValEl = document.getElementById('sidebar-karma-val');
    if (karmaValEl && currentStatsData) {
      karmaValEl.innerText = `${currentStatsData.karma_score} карма`;
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

// Master Render Function
function renderApp() {
  const state = store.getState();
  const appEl = document.getElementById('app');
  if (!appEl) return;

  const activeView = state.activeView;
  const viewMode = state.viewMode;

  let mainViewHtml = '';
  if (activeView === 'calendar') {
    mainViewHtml = renderCalendarView();
  } else if (activeView === 'habits') {
    mainViewHtml = renderHabitsView();
  } else if (activeView === 'focus') {
    mainViewHtml = renderFocusView();
  } else if (activeView === 'stats') {
    mainViewHtml = renderStatsView(currentStatsData);
  } else {
    // Task-based views (inbox, today, next7days, lists, tags, etc.)
    if (viewMode === 'kanban') {
      mainViewHtml = renderKanbanView();
    } else {
      mainViewHtml = renderTaskList();
    }
  }

  appEl.innerHTML = `
    <!-- Sidebar -->
    <aside class="sidebar ${state.sidebarCollapsed ? 'collapsed' : ''}" id="app-sidebar">
      ${renderSidebar()}
    </aside>

    <!-- Main Workspace -->
    <main class="main-content">
      <header class="topbar">
        ${renderTopbar()}
      </header>

      <div class="viewport-body">
        <div class="view-container" id="view-container">
          ${mainViewHtml}
        </div>
        ${renderTaskDetail()}
      </div>
    </main>

    <!-- Modals Container -->
    <div id="modals-root">
      ${renderModals()}
    </div>
  `;

  attachEventListeners();
}

// Attach Event Listeners to Interactive Elements
function attachEventListeners() {
  const state = store.getState();

  // 1. Sidebar Nav Item Clicks
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const viewKey = el.getAttribute('data-view');
      if (!viewKey) return;
      const listId = el.getAttribute('data-list-id');
      const tagId = el.getAttribute('data-tag-id');
      store.setActiveView(viewKey, listId, tagId);
      fetchTasks();
    });
  });

  // 2. Sidebar Toggle
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const s = store.getState();
      const sidebarEl = document.getElementById('app-sidebar');
      if (sidebarEl) {
        sidebarEl.classList.toggle('hidden');
      }
    });
  }

  // 3. View Switcher (List vs Kanban)
  document.querySelectorAll('.view-switcher-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      store.setViewMode(mode);
    });
  });

  // 4. Quick Add Buttons
  const sidebarQuickAdd = document.getElementById('btn-sidebar-quick-add');
  if (sidebarQuickAdd) {
    sidebarQuickAdd.addEventListener('click', () => store.openModal('quickAdd'));
  }

  // 5. Open Modal buttons (Lists, Tags, Habits, Settings)
  const addListBtn = document.getElementById('btn-add-list');
  if (addListBtn) addListBtn.addEventListener('click', () => store.openModal('createList'));

  const addTagBtn = document.getElementById('btn-add-tag');
  if (addTagBtn) addTagBtn.addEventListener('click', () => store.openModal('createTag'));

  const addHabitBtn = document.getElementById('btn-create-habit-modal');
  if (addHabitBtn) addHabitBtn.addEventListener('click', () => store.openModal('createHabit'));

  const emptyHabitBtn = document.getElementById('btn-empty-create-habit');
  if (emptyHabitBtn) emptyHabitBtn.addEventListener('click', () => store.openModal('createHabit'));

  const settingsBtn = document.getElementById('btn-open-settings');
  if (settingsBtn) settingsBtn.addEventListener('click', () => store.openModal('settings'));

  const quickThemeBtn = document.getElementById('btn-quick-theme');
  if (quickThemeBtn) {
    quickThemeBtn.addEventListener('click', () => {
      const themes = ['dark', 'light', 'forest', 'sunset', 'cyber'];
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextIdx = (themes.indexOf(current) + 1) % themes.length;
      const nextTheme = themes[nextIdx];
      document.documentElement.setAttribute('data-theme', nextTheme);
      ApiClient.users.updateProfile({ theme: nextTheme }).catch(() => {});
    });
  }

  // 6. Inline Task Input Submission
  const inlineInput = document.getElementById('inline-task-input');
  const inlineSubmit = document.getElementById('btn-submit-inline-task');
  const handleInlineSubmit = async () => {
    if (!inlineInput || !inlineInput.value.trim()) return;
    const title = inlineInput.value.trim();
    inlineInput.value = '';

    const curState = store.getState();
    let listId = null;
    if (curState.activeView.startsWith('list_')) {
      listId = parseInt(curState.activeView.replace('list_', ''), 10);
    }

    try {
      const newTask = await ApiClient.tasks.create({ title, list_id: listId }, true);
      audio.playCheckSound();
      showToast('Задача добавлена 🚀', 'success');
      await fetchTasks();
      await fetchLists();
    } catch (err) {
      showToast(err.message || 'Ошибка создания задачи', 'error');
    }
  };

  if (inlineInput) {
    inlineInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleInlineSubmit();
      }
    });
  }
  if (inlineSubmit) {
    inlineSubmit.addEventListener('click', handleInlineSubmit);
  }

  // 7. Global Search Input
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.setState({ searchQuery: e.target.value });
    });
  }

  // 8. Task Actions: Toggle complete, open detail, delete
  document.querySelectorAll('[data-action="toggle-task"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const taskId = parseInt(btn.getAttribute('data-task-id'), 10);
      audio.playCheckSound();
      try {
        const updated = await ApiClient.tasks.toggle(taskId);
        store.updateTask(updated);
        fetchStats();
        fetchLists();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="open-detail"]').forEach(el => {
    el.addEventListener('click', async () => {
      const taskId = parseInt(el.getAttribute('data-task-id'), 10);
      try {
        const fullTask = await ApiClient.tasks.getOne(taskId);
        store.setSelectedTask(fullTask);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="delete-task"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const taskId = parseInt(btn.getAttribute('data-task-id'), 10);
      try {
        await ApiClient.tasks.delete(taskId);
        store.removeTask(taskId);
        showToast('Задача перемещена в корзину', 'info');
        fetchLists();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="quick-focus"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = parseInt(btn.getAttribute('data-task-id'), 10);
      store.setState({
        activeView: 'focus',
        pomo: { ...store.getState().pomo, activeTaskId: taskId }
      });
    });
  });

  // 9. Habit Toggle Action
  document.querySelectorAll('[data-action="toggle-habit"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const habitId = parseInt(btn.getAttribute('data-habit-id'), 10);
      const dateStr = btn.getAttribute('data-date');
      const isDone = btn.getAttribute('data-is-done') === 'true';

      audio.playCheckSound();
      try {
        if (isDone) {
          await ApiClient.habits.uncheck(habitId, dateStr);
        } else {
          await ApiClient.habits.checkin(habitId, dateStr);
        }
        await fetchHabits();
        fetchStats();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // 10. Pomodoro Controls
  const togglePomoBtn = document.getElementById('btn-toggle-pomo');
  if (togglePomoBtn) {
    togglePomoBtn.addEventListener('click', () => {
      const p = store.getState().pomo;
      const isRunning = !p.isRunning;
      store.setState({ pomo: { ...p, isRunning } });
      handleTimerState(isRunning);
    });
  }

  const resetPomoBtn = document.getElementById('btn-reset-pomo');
  if (resetPomoBtn) {
    resetPomoBtn.addEventListener('click', () => {
      const p = store.getState().pomo;
      clearInterval(timerInterval);
      const dur = p.mode === 'work' ? 25 * 60 : (p.mode === 'short_break' ? 5 * 60 : 15 * 60);
      store.setState({ pomo: { ...p, isRunning: false, timeRemaining: dur, totalDuration: dur } });
    });
  }

  const skipPomoBtn = document.getElementById('btn-skip-pomo');
  if (skipPomoBtn) {
    skipPomoBtn.addEventListener('click', () => {
      finishPomodoroSession();
    });
  }

  document.querySelectorAll('[data-action="set-pomo-mode"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      clearInterval(timerInterval);
      const dur = mode === 'work' ? 25 * 60 : (mode === 'short_break' ? 5 * 60 : 15 * 60);
      store.setState({
        pomo: { ...store.getState().pomo, mode, isRunning: false, timeRemaining: dur, totalDuration: dur }
      });
    });
  });

  document.querySelectorAll('[data-action="set-ambient"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sound = btn.getAttribute('data-sound');
      audio.toggleAmbient(sound);
      store.setState({ pomo: { ...store.getState().pomo, ambientSound: sound } });
    });
  });

  const topbarPomoWidget = document.getElementById('topbar-pomo-widget');
  if (topbarPomoWidget) {
    topbarPomoWidget.addEventListener('click', () => {
      store.setActiveView('focus');
    });
  }

  // 11. Task Detail Panel Listeners
  attachTaskDetailListeners();

  // 12. Modal Event Handlers
  attachModalListeners();

  // 13. Calendar Specific & Drag-and-Drop Listeners
  if (state.activeView === 'calendar') {
    attachCalendarListeners();
  }
}

function attachCalendarListeners() {
  const calState = getCalendarState();

  // 1. Calendar Navigation (Month / Week)
  const prevBtn = document.getElementById('cal-btn-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const cur = getCalendarState().currentDate;
      if (getCalendarState().viewType === 'week') {
        const prevDate = new Date(cur);
        prevDate.setDate(cur.getDate() - 7);
        setCalendarState({ currentDate: prevDate });
      } else {
        const prevDate = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
        setCalendarState({ currentDate: prevDate });
      }
      renderApp();
    });
  }

  const nextBtn = document.getElementById('cal-btn-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const cur = getCalendarState().currentDate;
      if (getCalendarState().viewType === 'week') {
        const nextDate = new Date(cur);
        nextDate.setDate(cur.getDate() + 7);
        setCalendarState({ currentDate: nextDate });
      } else {
        const nextDate = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        setCalendarState({ currentDate: nextDate });
      }
      renderApp();
    });
  }

  const todayBtn = document.getElementById('cal-btn-today');
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      setCalendarState({ currentDate: new Date() });
      renderApp();
    });
  }

  // 2. View Type Switcher (Month vs Week)
  document.querySelectorAll('[data-action="set-cal-view-type"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewType = btn.getAttribute('data-type');
      setCalendarState({ viewType });
      renderApp();
    });
  });

  // 3. Toggle Tray
  const toggleTrayBtn = document.getElementById('cal-btn-toggle-tray');
  if (toggleTrayBtn) {
    toggleTrayBtn.addEventListener('click', () => {
      const s = getCalendarState();
      setCalendarState({ trayCollapsed: !s.trayCollapsed });
      renderApp();
    });
  }

  // 4. Tray Sub-Tabs click (Списки, Теги, Без даты)
  document.querySelectorAll('[data-action="set-tray-tab"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      setCalendarState({ trayActiveTab: tab });
      renderApp();
    });
  });

  // 5. Tray List Multi-Select Chips
  document.querySelectorAll('[data-action="toggle-list-filter"]').forEach(chip => {
    chip.addEventListener('click', () => {
      const listIdRaw = chip.getAttribute('data-list-id');
      const curListIds = [...getCalendarState().selectedListIds];

      if (listIdRaw === 'all') {
        setCalendarState({ selectedListIds: [] });
      } else {
        const val = listIdRaw === 'inbox' ? 'inbox' : parseInt(listIdRaw, 10);
        const idx = curListIds.indexOf(val);
        if (idx > -1) {
          curListIds.splice(idx, 1);
        } else {
          curListIds.push(val);
        }
        setCalendarState({ selectedListIds: curListIds });
      }
      renderApp();
    });
  });

  // 6. Tray Tag Multi-Select Chips
  document.querySelectorAll('[data-action="toggle-tag-filter"]').forEach(chip => {
    chip.addEventListener('click', () => {
      const tagIdRaw = chip.getAttribute('data-tag-id');
      const curTagIds = [...getCalendarState().selectedTagIds];

      if (tagIdRaw === 'all') {
        setCalendarState({ selectedTagIds: [] });
      } else {
        const tagId = parseInt(tagIdRaw, 10);
        const idx = curTagIds.indexOf(tagId);
        if (idx > -1) {
          curTagIds.splice(idx, 1);
        } else {
          curTagIds.push(tagId);
        }
        setCalendarState({ selectedTagIds: curTagIds });
      }
      renderApp();
    });
  });

  // 7. Tray Priority filter
  const prioSelect = document.getElementById('tray-priority-select');
  if (prioSelect) {
    prioSelect.addEventListener('change', (e) => {
      setCalendarState({ trayPriorityFilter: e.target.value });
      renderApp();
    });
  }

  // 8. Tray Search input
  const traySearchInput = document.getElementById('tray-search-input');
  if (traySearchInput) {
    traySearchInput.addEventListener('input', (e) => {
      setCalendarState({ traySearch: e.target.value });
      renderApp();
      const freshInput = document.getElementById('tray-search-input');
      if (freshInput) {
        freshInput.focus();
        freshInput.selectionStart = freshInput.selectionEnd = freshInput.value.length;
      }
    });
  }

  // 9. Drag and Drop: Drag Sources (Tray task cards, Calendar day chips, Week task blocks)
  document.querySelectorAll('.tray-task-card, .calendar-task-chip, .week-task-block').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      const taskId = el.getAttribute('data-task-id');
      if (!taskId) return;
      e.dataTransfer.setData('text/plain', taskId);
      e.dataTransfer.effectAllowed = 'move';
      el.style.opacity = '0.4';
    });

    el.addEventListener('dragend', () => {
      el.style.opacity = '1';
    });
  });

  // 10. Drop Target: Full Day / All-Day Cells
  document.querySelectorAll('[data-action="cal-drop-zone"]').forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const taskIdStr = e.dataTransfer.getData('text/plain');
      const targetDate = zone.getAttribute('data-date');
      if (!taskIdStr || !targetDate) return;

      const taskId = parseInt(taskIdStr, 10);
      const existingTask = (store.getState().tasks || []).find(t => t.id === taskId);
      const duration = (existingTask && existingTask.duration_minutes) ? existingTask.duration_minutes : 30;

      try {
        audio.playCheckSound();
        const updated = await ApiClient.tasks.update(taskId, {
          due_date: targetDate,
          duration_minutes: duration,
        });
        store.updateTask(updated);
        showToast(`Задача перенесена на ${targetDate} 📅`, 'success');
        fetchStats();
      } catch (err) {
        showToast(err.message || 'Ошибка планирования задачи', 'error');
      }
    });
  });

  // 11. Drop Target: Week Hourly Time Slots
  document.querySelectorAll('[data-action="cal-time-drop-zone"]').forEach(slot => {
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', async (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      const taskIdStr = e.dataTransfer.getData('text/plain');
      const targetDate = slot.getAttribute('data-date');
      const targetHour = slot.getAttribute('data-hour'); // e.g. "10:00"
      if (!taskIdStr || !targetDate) return;

      const taskId = parseInt(taskIdStr, 10);
      const existingTask = (store.getState().tasks || []).find(t => t.id === taskId);
      const duration = (existingTask && existingTask.duration_minutes) ? existingTask.duration_minutes : 30;

      try {
        audio.playCheckSound();
        const updated = await ApiClient.tasks.update(taskId, {
          due_date: targetDate,
          due_time: targetHour,
          has_time: true,
          all_day: false,
          duration_minutes: duration,
        });
        store.updateTask(updated);
        showToast(`Задача запланирована на ${targetDate} в ${targetHour} (${duration} мин) ⏱️`, 'success');
        fetchStats();
      } catch (err) {
        showToast(err.message || 'Ошибка планирования задачи', 'error');
      }
    });
  });

  // 12. Bottom Resize Interaction (Pull task bottom to increase/decrease duration)
  initTaskBottomResizing();
}

function initTaskBottomResizing() {
  document.querySelectorAll('[data-action="resize-task-bottom"]').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const taskId = parseInt(handle.getAttribute('data-task-id'), 10);
      const startDuration = parseInt(handle.getAttribute('data-duration') || 30, 10);
      const startTimeStr = handle.getAttribute('data-start-time') || '09:00';
      const taskEl = document.getElementById(`week-task-${taskId}`);
      if (!taskEl) return;

      const startY = e.clientY;
      const pixelsPerHour = 52;
      const pixelsPerMin = pixelsPerHour / 60;
      const startHeight = taskEl.offsetHeight;
      let currentDuration = startDuration;

      // Floating resize tooltip indicator
      const badge = document.createElement('div');
      badge.className = 'resize-indicator-badge';
      badge.innerText = `⏱️ ${startDuration} мин`;
      badge.style.left = `${e.clientX + 15}px`;
      badge.style.top = `${e.clientY - 10}px`;
      document.body.appendChild(badge);

      const onMouseMove = (moveEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const deltaMinutes = Math.round(deltaY / pixelsPerMin / 15) * 15; // 15 min snap
        currentDuration = Math.max(15, Math.min(480, startDuration + deltaMinutes));

        // Update live height
        const newHeightPx = Math.max(26, currentDuration * pixelsPerMin);
        taskEl.style.height = `${newHeightPx}px`;

        // Update badge position and text
        const timeParts = startTimeStr.split(':');
        const sH = parseInt(timeParts[0], 10);
        const sM = parseInt(timeParts[1] || 0, 10);
        const totalM = sH * 60 + sM + currentDuration;
        const eH = Math.floor(totalM / 60) % 24;
        const eM = totalM % 60;
        const endStr = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;

        badge.innerText = `⏱️ ${currentDuration} мин (${startTimeStr} - ${endStr})`;
        badge.style.left = `${moveEvent.clientX + 15}px`;
        badge.style.top = `${moveEvent.clientY - 10}px`;
      };

      const onMouseUp = async () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        badge.remove();

        if (currentDuration !== startDuration) {
          try {
            audio.playCheckSound();
            const updated = await ApiClient.tasks.update(taskId, { duration_minutes: currentDuration });
            store.updateTask(updated);
            showToast(`Длительность изменена: ${currentDuration} мин ⏱️`, 'success');
          } catch (err) {
            showToast(err.message || 'Ошибка изменения длительности', 'error');
            renderApp();
          }
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  });
}

function handleTimerState(isRunning) {
  if (isRunning) {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const p = store.getState().pomo;
      if (p.timeRemaining > 0) {
        store.setState({ pomo: { ...p, timeRemaining: p.timeRemaining - 1 } });
      } else {
        finishPomodoroSession();
      }
    }, 1000);
  } else {
    clearInterval(timerInterval);
  }
}

async function finishPomodoroSession() {
  clearInterval(timerInterval);
  audio.playTimerFinishSound();
  showToast('🍅 Сессия фокуса завершена! Отличная работа!', 'success');

  const p = store.getState().pomo;
  if (p.mode === 'work') {
    const started = new Date(Date.now() - (p.totalDuration * 1000)).toISOString();
    const ended = new Date().toISOString();
    try {
      await ApiClient.focus.createSession({
        duration_minutes: Math.round(p.totalDuration / 60),
        session_type: 'pomodoro',
        task_id: p.activeTaskId,
        started_at: started,
        ended_at: ended,
      });
      fetchStats();
    } catch (e) {}
  }

  // Switch to break mode
  const nextMode = p.mode === 'work' ? 'short_break' : 'work';
  const nextDur = nextMode === 'work' ? 25 * 60 : 5 * 60;
  store.setState({
    pomo: {
      ...p,
      mode: nextMode,
      isRunning: false,
      timeRemaining: nextDur,
      totalDuration: nextDur,
      completedSessionsCount: p.completedSessionsCount + 1,
    }
  });
}

function attachTaskDetailListeners() {
  const task = store.getState().selectedTask;
  if (!task) return;

  const closeBtn = document.getElementById('detail-btn-close');
  if (closeBtn) closeBtn.addEventListener('click', () => store.setSelectedTask(null));

  const toggleBtn = document.getElementById('detail-toggle-complete');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', async () => {
      audio.playCheckSound();
      const updated = await ApiClient.tasks.toggle(task.id);
      store.updateTask(updated);
      fetchStats();
      fetchLists();
    });
  }

  const titleInput = document.getElementById('detail-title-input');
  if (titleInput) {
    titleInput.addEventListener('change', async () => {
      if (titleInput.value.trim()) {
        const updated = await ApiClient.tasks.update(task.id, { title: titleInput.value.trim() });
        store.updateTask(updated);
      }
    });
  }

  const descInput = document.getElementById('detail-description-input');
  if (descInput) {
    descInput.addEventListener('change', async () => {
      const updated = await ApiClient.tasks.update(task.id, { description: descInput.value });
      store.updateTask(updated);
    });
  }

  const dueDateInput = document.getElementById('detail-due-date');
  if (dueDateInput) {
    dueDateInput.addEventListener('change', async () => {
      const updated = await ApiClient.tasks.update(task.id, { due_date: dueDateInput.value || null });
      store.updateTask(updated);
    });
  }

  const dueTimeInput = document.getElementById('detail-due-time');
  if (dueTimeInput) {
    dueTimeInput.addEventListener('change', async () => {
      const val = dueTimeInput.value || null;
      const updated = await ApiClient.tasks.update(task.id, {
        due_time: val,
        has_time: !!val,
        all_day: !val,
      });
      store.updateTask(updated);
    });
  }

  const durationInput = document.getElementById('detail-duration');
  if (durationInput) {
    durationInput.addEventListener('change', async () => {
      const val = parseInt(durationInput.value, 10) || 30;
      const updated = await ApiClient.tasks.update(task.id, { duration_minutes: val });
      store.updateTask(updated);
    });
  }

  const recurSelect = document.getElementById('detail-recurrence');
  if (recurSelect) {
    recurSelect.addEventListener('change', async () => {
      const updated = await ApiClient.tasks.update(task.id, { recurrence_rule: recurSelect.value || null });
      store.updateTask(updated);
    });
  }

  const prioSelect = document.getElementById('detail-priority');
  if (prioSelect) {
    prioSelect.addEventListener('change', async () => {
      const updated = await ApiClient.tasks.update(task.id, { priority: parseInt(prioSelect.value, 10) });
      store.updateTask(updated);
    });
  }

  const listSelect = document.getElementById('detail-list-id');
  if (listSelect) {
    listSelect.addEventListener('change', async () => {
      const listId = listSelect.value ? parseInt(listSelect.value, 10) : null;
      const updated = await ApiClient.tasks.update(task.id, { list_id: listId });
      store.updateTask(updated);
      fetchLists();
    });
  }

  const quadSelect = document.getElementById('detail-quadrant');
  if (quadSelect) {
    quadSelect.addEventListener('change', async () => {
      const updated = await ApiClient.tasks.update(task.id, { eisenhower_quadrant: parseInt(quadSelect.value, 10) });
      store.updateTask(updated);
    });
  }

  const deleteBtn = document.getElementById('detail-btn-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      await ApiClient.tasks.delete(task.id);
      store.removeTask(task.id);
      showToast('Задача удалена', 'info');
      fetchLists();
    });
  }

  const pinBtn = document.getElementById('detail-btn-pin');
  if (pinBtn) {
    pinBtn.addEventListener('click', async () => {
      const updated = await ApiClient.tasks.update(task.id, { is_pinned: !task.is_pinned });
      store.updateTask(updated);
    });
  }

  // Subtasks
  const newSubtaskInput = document.getElementById('detail-new-subtask-input');
  if (newSubtaskInput) {
    newSubtaskInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && newSubtaskInput.value.trim()) {
        e.preventDefault();
        const title = newSubtaskInput.value.trim();
        newSubtaskInput.value = '';
        await ApiClient.tasks.createSubtask(task.id, { title });
        const refreshed = await ApiClient.tasks.getOne(task.id);
        store.updateTask(refreshed);
      }
    });
  }

  document.querySelectorAll('[data-action="toggle-subtask"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const subtaskId = parseInt(btn.getAttribute('data-subtask-id'), 10);
      const st = task.subtasks.find(s => s.id === subtaskId);
      if (st) {
        audio.playCheckSound();
        await ApiClient.tasks.updateSubtask(task.id, subtaskId, { is_completed: !st.is_completed });
        const refreshed = await ApiClient.tasks.getOne(task.id);
        store.updateTask(refreshed);
      }
    });
  });

  document.querySelectorAll('[data-action="delete-subtask"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const subtaskId = parseInt(btn.getAttribute('data-subtask-id'), 10);
      await ApiClient.tasks.deleteSubtask(task.id, subtaskId);
      const refreshed = await ApiClient.tasks.getOne(task.id);
      store.updateTask(refreshed);
    });
  });
}

function attachModalListeners() {
  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
    btn.addEventListener('click', () => store.closeModal());
  });

  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) store.closeModal();
    });
  }

  // Auth Form
  const authForm = document.getElementById('auth-form');
  const authTabLogin = document.getElementById('auth-tab-login');
  const authTabRegister = document.getElementById('auth-tab-register');
  const groupEmail = document.getElementById('group-email');
  let isRegisterMode = false;

  if (authTabLogin && authTabRegister) {
    authTabLogin.addEventListener('click', () => {
      isRegisterMode = false;
      authTabLogin.style.background = 'var(--bg-hover)';
      authTabRegister.style.background = 'transparent';
      groupEmail.classList.add('hidden');
      document.getElementById('btn-submit-auth').innerText = 'Войти';
    });

    authTabRegister.addEventListener('click', () => {
      isRegisterMode = true;
      authTabRegister.style.background = 'var(--bg-hover)';
      authTabLogin.style.background = 'transparent';
      groupEmail.classList.remove('hidden');
      document.getElementById('btn-submit-auth').innerText = 'Зарегистрироваться';
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('auth-username').value;
      const password = document.getElementById('auth-password').value;
      const email = document.getElementById('auth-email')?.value || `${username}@doto.local`;

      try {
        let res;
        if (isRegisterMode) {
          res = await ApiClient.auth.register({ username, email, password });
        } else {
          res = await ApiClient.auth.login({ username_or_email: username, password });
        }

        ApiClient.setToken(res.access_token);
        store.setUser(res.user);
        store.closeModal();
        showToast('Добро пожаловать в Doto! 🚀', 'success');
        loadUserData();
      } catch (err) {
        showToast(err.message || 'Ошибка входа', 'error');
      }
    });
  }

  const demoBtn = document.getElementById('btn-instant-demo');
  if (demoBtn) {
    demoBtn.addEventListener('click', async () => {
      try {
        const res = await ApiClient.auth.demo();
        ApiClient.setToken(res.access_token);
        store.setUser(res.user);
        store.closeModal();
        showToast('Вход в Демо-режим выполнен! ✨', 'success');
        loadUserData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Quick Add Modal Input
  const quickAddModalInput = document.getElementById('quick-add-modal-input');
  if (quickAddModalInput) {
    quickAddModalInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && quickAddModalInput.value.trim()) {
        const title = quickAddModalInput.value.trim();
        try {
          await ApiClient.tasks.create({ title }, true);
          audio.playCheckSound();
          store.closeModal();
          showToast('Задача добавлена 🚀', 'success');
          await fetchTasks();
          await fetchLists();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  }

  // Create List Form
  const createListForm = document.getElementById('create-list-form');
  let selectedColor = '#3b82f6';
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedColor = opt.getAttribute('data-color');
    });
  });

  if (createListForm) {
    createListForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('list-name-input').value.trim();
      try {
        await ApiClient.lists.create({ name, color: selectedColor });
        store.closeModal();
        showToast('Список создан', 'success');
        fetchLists();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Create Tag Form
  const createTagForm = document.getElementById('create-tag-form');
  if (createTagForm) {
    createTagForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('tag-name-input').value.trim();
      try {
        await ApiClient.tags.create({ name, color: selectedColor });
        store.closeModal();
        showToast('Тег создан', 'success');
        fetchTags();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Create Habit Form
  const createHabitForm = document.getElementById('create-habit-form');
  let selectedHabitIcon = 'star';
  document.querySelectorAll('[data-icon]').forEach(icBtn => {
    icBtn.addEventListener('click', () => {
      document.querySelectorAll('[data-icon]').forEach(b => b.classList.remove('selected'));
      icBtn.classList.add('selected');
      selectedHabitIcon = icBtn.getAttribute('data-icon');
    });
  });

  if (createHabitForm) {
    createHabitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('habit-name-input').value.trim();
      const target_frequency = parseInt(document.getElementById('habit-frequency-input').value, 10) || 1;
      try {
        await ApiClient.habits.create({ name, icon: selectedHabitIcon, target_frequency, color: '#ec4899' });
        store.closeModal();
        showToast('Привычка создана ⚡', 'success');
        fetchHabits();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Theme selector buttons inside Settings modal
  document.querySelectorAll('.theme-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      ApiClient.users.updateProfile({ theme }).catch(() => {});
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      ApiClient.setToken(null);
      store.setUser(null);
      store.setTasks([]);
      store.closeModal();
      store.openModal('auth');
    });
  }
}

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    store.openModal('quickAdd');
  } else if (e.key === 'Escape') {
    const s = store.getState();
    if (s.activeModal) {
      store.closeModal();
    } else if (s.selectedTask) {
      store.setSelectedTask(null);
    }
  } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) searchInput.focus();
  }
});

// Subscribe store to re-render UI
store.subscribe(() => {
  renderApp();
});

// App Entrypoint
window.addEventListener('DOMContentLoaded', async () => {
  renderApp();

  const token = ApiClient.getToken();
  if (token) {
    await loadUserData();
  } else {
    // Auto demo for seamless start
    try {
      const res = await ApiClient.auth.demo();
      ApiClient.setToken(res.access_token);
      store.setUser(res.user);
      await loadUserData();
    } catch (err) {
      store.openModal('auth');
    }
  }
});
