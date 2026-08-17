// Enhanced Interactive Calendar View (Month & Week Views with Bottom Resize) for Doto
import { store } from '../store.js';

// Calendar Local State
let calState = {
  currentDate: new Date(),
  viewType: 'month',       // 'month' | 'week'
  trayActiveTab: 'lists',  // 'lists', 'tags', 'unscheduled'
  selectedListIds: [],     // Empty means "All lists", or array e.g. ['inbox', 1, 2]
  selectedTagIds: [],      // Empty means "All tags", or array of tag IDs [1, 2]
  trayPriorityFilter: 'all',
  traySearch: '',
  trayCollapsed: false,
};

export function getCalendarState() {
  return calState;
}

export function setCalendarState(partial) {
  calState = { ...calState, ...partial };
}

export function renderCalendarView() {
  const state = store.getState();
  const tasks = state.tasks || [];
  const lists = state.lists || [];
  const tags = state.tags || [];
  
  const curDate = calState.currentDate;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Header Title & Controls
  let headerTitle = '';
  if (calState.viewType === 'month') {
    headerTitle = `${monthNames[curDate.getMonth()]} ${curDate.getFullYear()}`;
  } else {
    const weekDays = getWeekDays(curDate);
    const startD = weekDays[0];
    const endD = weekDays[6];
    if (startD.getMonth() === endD.getMonth()) {
      headerTitle = `${startD.getDate()} — ${endD.getDate()} ${monthNames[startD.getMonth()]} ${startD.getFullYear()}`;
    } else {
      headerTitle = `${startD.getDate()} ${monthNames[startD.getMonth()]} — ${endD.getDate()} ${monthNames[endD.getMonth()]} ${startD.getFullYear()}`;
    }
  }

  // Filter Tasks for the Right Tray
  const trayTasks = filterTrayTasks(tasks, todayStr);

  return `
    <div class="calendar-view">
      <!-- 1. Left / Main Calendar Area (Month or Week) -->
      <div class="calendar-main-area">
        <div class="calendar-header">
          <div class="calendar-nav-controls">
            <h2 style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin-right: 8px; min-width: 170px;">
              ${headerTitle}
            </h2>
            <button class="btn btn-secondary btn-icon" id="cal-btn-prev" title="Назад" style="width: 28px; height: 28px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="btn btn-secondary btn-icon" id="cal-btn-next" title="Вперед" style="width: 28px; height: 28px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button class="btn btn-secondary" id="cal-btn-today" style="padding: 4px 10px; font-size: 12px; margin-left: 4px;">
              Сегодня
            </button>
          </div>

          <div class="flex items-center gap-2">
            <!-- View Type Switcher (Month / Week) -->
            <div class="cal-view-switcher">
              <button class="cal-view-btn ${calState.viewType === 'month' ? 'active' : ''}" data-action="set-cal-view-type" data-type="month">
                Месяц
              </button>
              <button class="cal-view-btn ${calState.viewType === 'week' ? 'active' : ''}" data-action="set-cal-view-type" data-type="week">
                Неделя
              </button>
            </div>

            <!-- Toggle Task Tray -->
            <button class="btn btn-secondary" id="cal-btn-toggle-tray" title="Показать/скрыть панель «Расставить задачи»">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              <span>${calState.trayCollapsed ? 'Расставить задачи' : 'Скрыть панель'}</span>
            </button>
          </div>
        </div>

        <!-- Render Month or Week Grid -->
        ${calState.viewType === 'month' ? renderMonthGrid(curDate, tasks, todayStr) : renderWeekGrid(curDate, tasks, todayStr)}
      </div>

      <!-- 2. Right Draggable Task Tray / Side Panel -->
      <aside class="calendar-task-tray ${calState.trayCollapsed ? 'collapsed' : ''}" id="calendar-task-tray">
        <div class="tray-header">
          <div class="tray-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            <span>Расставить задачи</span>
            <span class="task-group-count">${trayTasks.length}</span>
          </div>
        </div>

        <!-- Sub-Tabs: Списки, Теги, Без даты -->
        <div class="tray-tabs">
          <button class="tray-tab-btn ${calState.trayActiveTab === 'lists' ? 'active' : ''}" data-action="set-tray-tab" data-tab="lists">
            📋 Списки
          </button>
          <button class="tray-tab-btn ${calState.trayActiveTab === 'tags' ? 'active' : ''}" data-action="set-tray-tab" data-tab="tags">
            🏷️ Теги
          </button>
          <button class="tray-tab-btn ${calState.trayActiveTab === 'unscheduled' ? 'active' : ''}" data-action="set-tray-tab" data-tab="unscheduled">
            📦 Без даты
          </button>
        </div>

        <!-- Multi-select Chips depending on active tab -->
        ${renderTraySubFilterChips(lists, tags)}

        <!-- Search & Priority Filter Controls -->
        <div class="tray-filters-bar">
          <input type="text" class="tray-search-input" id="tray-search-input" placeholder="Поиск среди задач..." value="${calState.traySearch}">
          
          <div class="tray-filter-selects">
            <select class="tray-filter-select" id="tray-priority-select" title="Фильтр по приоритету">
              <option value="all" ${calState.trayPriorityFilter === 'all' ? 'selected' : ''}>Любой приоритет</option>
              <option value="5" ${calState.trayPriorityFilter === '5' ? 'selected' : ''}>🔴 Высокий</option>
              <option value="3" ${calState.trayPriorityFilter === '3' ? 'selected' : ''}>🟡 Средний</option>
              <option value="1" ${calState.trayPriorityFilter === '1' ? 'selected' : ''}>🔵 Низкий</option>
              <option value="0" ${calState.trayPriorityFilter === '0' ? 'selected' : ''}>⚪ Без приоритета</option>
            </select>
          </div>
        </div>

        <!-- Draggable Task List -->
        <div class="tray-task-list" id="tray-task-list">
          <div style="font-size: 11px; color: var(--text-muted); padding: 4px 2px; display: flex; align-items: center; gap: 4px;">
            <span>💡 <i>Перетащите задачу на день или время в календаре:</i></span>
          </div>

          ${trayTasks.map(task => {
            const listObj = lists.find(l => l.id === task.list_id);
            const prio = task.priority || 0;

            return `
              <div class="tray-task-card" draggable="true" data-task-id="${task.id}" data-action="open-detail">
                <span class="tray-drag-indicator" title="Потяните для переноса на дату/время">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2"></circle><circle cx="15" cy="5" r="2"></circle><circle cx="9" cy="12" r="2"></circle><circle cx="15" cy="12" r="2"></circle><circle cx="9" cy="19" r="2"></circle><circle cx="15" cy="19" r="2"></circle></svg>
                </span>

                <div class="tray-task-info">
                  <div class="tray-task-title truncate">${task.title}</div>
                  <div class="tray-task-meta">
                    ${prio > 0 ? `<span class="priority-flag p-${prio}" style="font-size: 10px; padding: 1px 4px;">!${prio === 5 ? 'Высокий' : (prio === 3 ? 'Средний' : 'Низкий')}</span>` : ''}
                    ${listObj ? `<span style="color: ${listObj.color || 'var(--text-muted)'}; font-weight: 600;">• ${listObj.name}</span>` : '<span style="color: #3b82f6;">• Входящие</span>'}
                    ${task.due_date ? `<span>📅 ${task.due_date}</span>` : '<span style="color: var(--text-muted);">Без даты</span>'}
                  </div>
                </div>
              </div>
            `;
          }).join('')}

          ${trayTasks.length === 0 ? `
            <div style="text-align: center; padding: 32px 12px; color: var(--text-muted); font-size: 12.5px;">
              <div style="font-size: 24px; margin-bottom: 6px;">✨</div>
              <div>Нет подходящих задач для этого фильтра</div>
            </div>
          ` : ''}
        </div>
      </aside>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// MONTH VIEW RENDERING
// -----------------------------------------------------------------------------
function renderMonthGrid(curDate, tasks, todayStr) {
  const year = curDate.getFullYear();
  const month = curDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const isCurrentRealMonth = (now.getFullYear() === year && now.getMonth() === month);
  const todayDateNum = isCurrentRealMonth ? now.getDate() : -1;

  const startDay = (firstDay + 6) % 7;
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const cells = [];

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const dNum = prevMonthDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    cells.push({
      dayNum: dNum,
      isCurrentMonth: false,
      dateStr,
      tasks: tasks.filter(t => t.due_date === dateStr && t.status !== 'trash'),
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    cells.push({
      dayNum: d,
      isCurrentMonth: true,
      isToday: d === todayDateNum,
      dateStr,
      tasks: tasks.filter(t => t.due_date === dateStr && t.status !== 'trash'),
    });
  }

  const totalSlots = cells.length > 35 ? 42 : 35;
  const remaining = totalSlots - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      dayNum: d,
      isCurrentMonth: false,
      dateStr,
      tasks: tasks.filter(t => t.due_date === dateStr && t.status !== 'trash'),
    });
  }

  return `
    <div class="calendar-month-grid">
      ${dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}

      ${cells.map(cell => `
        <div class="calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''}" 
             data-date="${cell.dateStr}" 
             data-action="cal-drop-zone">
          <div class="calendar-day-header-row">
            <span class="calendar-day-num">${cell.dayNum}</span>
            ${cell.tasks && cell.tasks.length > 0 ? `<span style="font-size: 10px; color: var(--text-muted); font-weight: 600;">${cell.tasks.length}</span>` : ''}
          </div>
          
          <div class="calendar-tasks-list" style="display: flex; flex-direction: column; gap: 3px; overflow-y: auto; max-height: 90px;">
            ${(cell.tasks || []).map(task => `
              <div class="calendar-task-chip priority-${task.priority || 0} ${task.status === 'completed' ? 'completed' : ''}" 
                   data-action="open-detail" 
                   data-task-id="${task.id}" 
                   draggable="true"
                   data-drag-source="calendar"
                   title="${task.title} (Перетащите для изменения даты)">
                <span>${task.status === 'completed' ? '✓' : '•'}</span>
                <span class="truncate">${task.title}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// -----------------------------------------------------------------------------
// WEEK VIEW RENDERING (TIMELINE + RESIZABLE TASKS)
// -----------------------------------------------------------------------------
function renderWeekGrid(curDate, tasks, todayStr) {
  const weekDays = getWeekDays(curDate);
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const startHour = 7; // 07:00
  const endHour = 22;   // 22:00
  const totalHours = endHour - startHour + 1;
  const pixelsPerHour = 52;

  // Build hours array
  const hours = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }

  // Separate all-day tasks vs timed tasks for each of 7 days
  const weekData = weekDays.map((dObj, idx) => {
    const dateStr = formatDateISO(dObj);
    const dayTasks = tasks.filter(t => t.due_date === dateStr && t.status !== 'trash');
    const alldayTasks = dayTasks.filter(t => !t.due_time);
    const timedTasks = dayTasks.filter(t => !!t.due_time);

    return {
      date: dObj,
      dateStr,
      dayName: dayNames[idx],
      dayNum: dObj.getDate(),
      isToday: dateStr === todayStr,
      alldayTasks,
      timedTasks,
    };
  });

  return `
    <div class="calendar-week-container">
      <!-- Week Days Header -->
      <div class="week-header-row">
        <div class="week-header-cell" style="font-size: 10px; color: var(--text-muted); justify-content: center;">
          GMT+3
        </div>
        ${weekData.map(d => `
          <div class="week-header-cell ${d.isToday ? 'today' : ''}">
            <span class="week-day-name">${d.dayName}</span>
            <span class="week-day-date">${d.dayNum}</span>
          </div>
        `).join('')}
      </div>

      <!-- All-day tasks section -->
      <div class="week-allday-row">
        <div class="week-allday-label">Весь день</div>
        ${weekData.map(d => `
          <div class="week-allday-cell" data-date="${d.dateStr}" data-action="cal-drop-zone">
            ${d.alldayTasks.map(t => `
              <div class="calendar-task-chip priority-${t.priority || 0} ${t.status === 'completed' ? 'completed' : ''}" 
                   data-action="open-detail" 
                   data-task-id="${t.id}" 
                   draggable="true" 
                   title="${t.title}">
                <span>${t.status === 'completed' ? '✓' : '•'}</span>
                <span class="truncate">${t.title}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <!-- Scrollable Timeline Grid -->
      <div class="week-timeline-scroll">
        <div class="week-timeline-grid" style="height: ${totalHours * pixelsPerHour}px;">
          <!-- Time Gutter -->
          <div class="week-time-gutter">
            ${hours.map(h => `<div class="week-hour-label">${h}</div>`).join('')}
          </div>

          <!-- 7 Day Columns -->
          ${weekData.map(d => `
            <div class="week-day-col" data-date="${d.dateStr}">
              <!-- Hour Slots for Drag & Drop -->
              ${hours.map(h => `
                <div class="week-hour-slot" 
                     data-date="${d.dateStr}" 
                     data-hour="${h}" 
                     data-action="cal-time-drop-zone">
                </div>
              `).join('')}

              <!-- Timed Task Blocks Positioned Vertically with Resize Handles -->
              ${d.timedTasks.map(task => {
                const timeParts = String(task.due_time).split(':');
                const tHour = parseInt(timeParts[0], 10);
                const tMin = parseInt(timeParts[1] || 0, 10);
                const duration = task.duration_minutes || 30;

                // Calculate vertical position and height in px
                const topPx = Math.max(0, ((tHour - startHour) * 60 + tMin) * (pixelsPerHour / 60));
                const heightPx = Math.max(26, duration * (pixelsPerHour / 60));
                const endTimeStr = calcEndTimeStr(tHour, tMin, duration);

                return `
                  <div class="week-task-block priority-${task.priority || 0} ${task.status === 'completed' ? 'completed' : ''}" 
                       id="week-task-${task.id}"
                       data-task-id="${task.id}" 
                       data-action="open-detail"
                       draggable="true"
                       style="top: ${topPx}px; height: ${heightPx}px;"
                       title="${task.title} (${task.due_time} - ${endTimeStr})">
                    
                    <div class="week-task-title">${task.title}</div>
                    <div class="week-task-time-range">${String(tHour).padStart(2, '0')}:${String(tMin).padStart(2, '0')} - ${endTimeStr} (${duration}м)</div>

                    <!-- Bottom Resize Handle (Pull to increase/decrease duration) -->
                    <div class="task-resize-bottom-handle" 
                         data-action="resize-task-bottom" 
                         data-task-id="${task.id}" 
                         data-start-time="${task.due_time}" 
                         data-duration="${duration}"
                         title="Потяните за низ для изменения длительности">
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function getWeekDays(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday
  const diff = (day === 0 ? -6 : 1) - day; // Adjust to Monday
  const monday = new Date(date.setDate(date.getDate() + diff));
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const nextD = new Date(monday);
    nextD.setDate(monday.getDate() + i);
    week.push(nextD);
  }
  return week;
}

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calcEndTimeStr(startHour, startMin, durationMinutes) {
  const totalMin = startHour * 60 + startMin + durationMinutes;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function renderTraySubFilterChips(lists, tags) {
  if (calState.trayActiveTab === 'lists') {
    const isAllSelected = calState.selectedListIds.length === 0;
    return `
      <div class="tray-filter-chips">
        <button class="filter-chip ${isAllSelected ? 'active' : ''}" data-action="toggle-list-filter" data-list-id="all">
          Все списки
        </button>
        <button class="filter-chip ${calState.selectedListIds.includes('inbox') ? 'active' : ''}" data-action="toggle-list-filter" data-list-id="inbox">
          📥 Входящие
        </button>
        ${lists.map(l => {
          const isActive = calState.selectedListIds.includes(l.id);
          return `
            <button class="filter-chip ${isActive ? 'active' : ''}" data-action="toggle-list-filter" data-list-id="${l.id}">
              <span style="width: 7px; height: 7px; border-radius: 50%; background-color: ${l.color || '#3b82f6'};"></span>
              <span>${l.name}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  } else if (calState.trayActiveTab === 'tags') {
    const isAllSelected = calState.selectedTagIds.length === 0;
    return `
      <div class="tray-filter-chips">
        <button class="filter-chip ${isAllSelected ? 'active' : ''}" data-action="toggle-tag-filter" data-tag-id="all">
          Все теги
        </button>
        ${tags.map(t => {
          const isActive = calState.selectedTagIds.includes(t.id);
          return `
            <button class="filter-chip ${isActive ? 'active' : ''}" data-action="toggle-tag-filter" data-tag-id="${t.id}">
              <span style="color: ${t.color || '#10b981'}; font-weight: 600;">#</span>
              <span>${t.name}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  } else {
    // Unscheduled tab (Без даты)
    return `
      <div class="tray-filter-chips" style="font-size: 11px; color: var(--text-muted); justify-content: space-between;">
        <span>📌 Задачи без назначенного срока</span>
      </div>
    `;
  }
}

function filterTrayTasks(tasks, todayStr) {
  let list = tasks.filter(t => t.status !== 'trash');

  if (calState.trayActiveTab === 'unscheduled') {
    list = list.filter(t => !t.due_date && t.status === 'todo');
  } else if (calState.trayActiveTab === 'lists') {
    list = list.filter(t => t.status === 'todo');
    if (calState.selectedListIds.length > 0) {
      list = list.filter(t => {
        if (!t.list_id && calState.selectedListIds.includes('inbox')) return true;
        if (t.list_id && calState.selectedListIds.includes(t.list_id)) return true;
        return false;
      });
    }
  } else if (calState.trayActiveTab === 'tags') {
    list = list.filter(t => t.status === 'todo');
    if (calState.selectedTagIds.length > 0) {
      list = list.filter(t => {
        if (!t.tags || t.tags.length === 0) return false;
        return t.tags.some(tag => calState.selectedTagIds.includes(tag.id));
      });
    }
  }

  if (calState.trayPriorityFilter !== 'all') {
    const targetPrio = parseInt(calState.trayPriorityFilter, 10);
    list = list.filter(t => (t.priority || 0) === targetPrio);
  }

  if (calState.traySearch.trim()) {
    const q = calState.traySearch.trim().toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
  }

  return list;
}
