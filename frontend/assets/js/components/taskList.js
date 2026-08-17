// Task List View Component for Doto
import { store } from '../store.js';

export function renderTaskList() {
  const state = store.getState();
  const tasks = state.tasks || [];
  const selectedTask = state.selectedTask;
  const searchQuery = (state.searchQuery || '').toLowerCase();

  // Filter tasks according to search query if any
  let filtered = tasks;
  if (searchQuery) {
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(searchQuery) ||
      (t.description && t.description.toLowerCase().includes(searchQuery)) ||
      (t.tags && t.tags.some(tag => tag.name.toLowerCase().includes(searchQuery)))
    );
  }

  // Group tasks into Overdue, Today, Upcoming, and Completed
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = [];
  const todayTasks = [];
  const upcomingTasks = [];
  const completedTasks = [];

  filtered.forEach(task => {
    if (task.status === 'completed') {
      completedTasks.push(task);
    } else {
      if (task.due_date && task.due_date < todayStr) {
        overdueTasks.push(task);
      } else if (task.due_date === todayStr) {
        todayTasks.push(task);
      } else {
        upcomingTasks.push(task);
      }
    }
  });

  return `
    <div class="tasks-container">
      <!-- Inline Quick-Add Input -->
      <div class="inline-quick-add">
        <input type="text" class="inline-add-input" id="inline-task-input" placeholder="+ Добавить задачу... (например: Сдать отчет ^сегодня !3 #работа *daily)" autocomplete="off">
        <div class="inline-add-toolbar">
          <div class="quick-toolbar-left">
            <button class="quick-tool-btn" id="inline-btn-date" title="Выбрать дату">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Срок</span>
            </button>
            <button class="quick-tool-btn" id="inline-btn-priority" title="Приоритет">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              <span>Приоритет</span>
            </button>
            <button class="quick-tool-btn" id="inline-btn-tag" title="Добавить тег">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path></svg>
              <span>Тег</span>
            </button>
          </div>
          <button class="btn btn-primary" id="btn-submit-inline-task" style="padding: 4px 12px; font-size: 12px;">
            Добавить
          </button>
        </div>
      </div>

      <!-- Task Lists Render -->
      ${renderTaskGroup('Просрочено', overdueTasks, selectedTask, 'text-danger')}
      ${renderTaskGroup('Сегодня', todayTasks, selectedTask)}
      ${renderTaskGroup('Предстоящие задачи', upcomingTasks, selectedTask)}
      
      ${completedTasks.length > 0 ? `
        <div class="task-group">
          <div class="task-group-title" style="cursor: pointer;" id="toggle-completed-group">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            <span>Выполнено</span>
            <span class="task-group-count">${completedTasks.length}</span>
          </div>
          <div class="task-items-list" id="completed-items-list">
            ${completedTasks.map(t => renderTaskItem(t, selectedTask)).join('')}
          </div>
        </div>
      ` : ''}

      ${filtered.length === 0 ? `
        <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div style="font-size: 40px; margin-bottom: 12px;">✨</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Все задачи выполнены!</div>
          <div style="font-size: 13px;">Отдохните или добавьте новую задачу сверху.</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderTaskGroup(title, tasks, selectedTask, titleClass = '') {
  if (!tasks || tasks.length === 0) return '';
  return `
    <div class="task-group">
      <div class="task-group-title ${titleClass}">
        <span>${title}</span>
        <span class="task-group-count">${tasks.length}</span>
      </div>
      <div class="task-items-list">
        ${tasks.map(t => renderTaskItem(t, selectedTask)).join('')}
      </div>
    </div>
  `;
}

function renderTaskItem(task, selectedTask) {
  const isSelected = selectedTask && selectedTask.id === task.id;
  const isCompleted = task.status === 'completed';
  const priority = task.priority || 0;
  const todayStr = new Date().toISOString().split('T')[0];

  // Due date badge formatting
  let dateBadgeHtml = '';
  if (task.due_date) {
    let dateClass = 'upcoming';
    let dateText = task.due_date;
    if (task.due_date < todayStr) {
      dateClass = 'overdue';
      dateText = `Просрочено (${task.due_date})`;
    } else if (task.due_date === todayStr) {
      dateClass = 'today';
      dateText = task.has_time && task.due_time ? `Сегодня в ${task.due_time.slice(0, 5)}` : 'Сегодня';
    }
    dateBadgeHtml = `<span class="badge badge-date ${dateClass}">${dateText}</span>`;
  }

  // Recurrence badge
  let recurBadgeHtml = '';
  if (task.recurrence_rule) {
    recurBadgeHtml = `<span class="badge" title="Повторяющаяся задача: ${task.recurrence_rule}">🔁</span>`;
  }

  // Subtasks progress
  let subtaskBadgeHtml = '';
  if (task.subtasks && task.subtasks.length > 0) {
    const doneCount = task.subtasks.filter(st => st.is_completed).length;
    subtaskBadgeHtml = `<span class="badge-subtask-progress" title="Подзадачи">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
      ${doneCount}/${task.subtasks.length}
    </span>`;
  }

  // Tags
  let tagsHtml = '';
  if (task.tags && task.tags.length > 0) {
    tagsHtml = task.tags.map(tag => `
      <span class="badge badge-tag" style="color: ${tag.color || 'inherit'};">#${tag.name}</span>
    `).join('');
  }

  return `
    <div class="task-item ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
      <span class="task-drag-handle" title="Перетащить">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2"></circle><circle cx="15" cy="5" r="2"></circle><circle cx="9" cy="12" r="2"></circle><circle cx="15" cy="12" r="2"></circle><circle cx="9" cy="19" r="2"></circle><circle cx="15" cy="19" r="2"></circle></svg>
      </span>

      <!-- Custom Animated Checkbox -->
      <button class="custom-checkbox priority-${priority} ${isCompleted ? 'checked' : ''}" data-action="toggle-task" data-task-id="${task.id}" title="${isCompleted ? 'Отметить как невыполненную' : 'Выполнить задачу'}">
        <svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </button>

      <div class="task-main" data-action="open-detail" data-task-id="${task.id}">
        <div class="task-title-row">
          ${task.is_pinned ? '<span title="Закреплено" style="color: #f59e0b; font-size: 11px;">📌</span>' : ''}
          <span class="task-title truncate">${task.title}</span>
        </div>
        <div class="task-meta-row">
          ${dateBadgeHtml}
          ${recurBadgeHtml}
          ${subtaskBadgeHtml}
          ${tagsHtml}
        </div>
      </div>

      <!-- Quick Hover Actions -->
      <div class="task-hover-actions">
        <button class="btn-icon" data-action="quick-focus" data-task-id="${task.id}" title="Запустить Помодоро для задачи">
          <span style="font-size: 12px;">🍅</span>
        </button>
        <button class="btn-icon" data-action="delete-task" data-task-id="${task.id}" title="Удалить задачу">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `;
}
