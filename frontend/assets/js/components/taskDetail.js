// Task Detail Drawer Component for Doto
import { store } from '../store.js';

export function renderTaskDetail() {
  const state = store.getState();
  const task = state.selectedTask;
  const lists = state.lists || [];
  const tags = state.tags || [];

  if (!task) {
    return `<div class="task-detail-panel collapsed" id="task-detail-panel"></div>`;
  }

  const isCompleted = task.status === 'completed';
  const priority = task.priority || 0;

  return `
    <div class="task-detail-panel animate-fade-in" id="task-detail-panel" data-task-id="${task.id}">
      <!-- Drawer Header -->
      <div class="task-detail-header">
        <div class="flex items-center gap-2">
          <button class="custom-checkbox priority-${priority} ${isCompleted ? 'checked' : ''}" id="detail-toggle-complete" title="Отметить выполненной">
            <svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">
            ${isCompleted ? 'Выполнено' : 'В работе'}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button class="btn-icon" id="detail-btn-focus" title="Запустить Помодоро" style="font-size: 14px;">
            🍅
          </button>
          <button class="btn-icon ${task.is_pinned ? 'text-warning' : ''}" id="detail-btn-pin" title="Закрепить задачу">
            📌
          </button>
          <button class="btn-icon" id="detail-btn-delete" title="Удалить задачу">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          <button class="btn-icon" id="detail-btn-close" title="Закрыть панель">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Drawer Body -->
      <div class="task-detail-body">
        <!-- Title Input -->
        <input type="text" class="detail-title-input input-text" id="detail-title-input" value="${task.title}" placeholder="Название задачи..." style="border: none; padding: 0; background: transparent;">

        <!-- Meta Properties Grid -->
        <div class="detail-meta-grid">
          <!-- Due Date -->
          <div class="detail-meta-row">
            <span class="detail-meta-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Дата
            </span>
            <input type="date" class="input-text" id="detail-due-date" value="${task.due_date || ''}" style="width: auto; padding: 4px 8px; font-size: 12px;">
          </div>

          <!-- Time & Duration -->
          <div class="detail-meta-row">
            <span class="detail-meta-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Время и длительность
            </span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <input type="time" class="input-text" id="detail-due-time" value="${task.due_time || ''}" style="width: auto; padding: 4px 8px; font-size: 12px;" title="Время начала">
              <select class="input-select" id="detail-duration" style="width: auto; padding: 4px 8px; font-size: 12px;" title="Длительность">
                <option value="15" ${(task.duration_minutes || 30) === 15 ? 'selected' : ''}>15 мин</option>
                <option value="30" ${(task.duration_minutes || 30) === 30 ? 'selected' : ''}>30 мин</option>
                <option value="45" ${(task.duration_minutes || 30) === 45 ? 'selected' : ''}>45 мин</option>
                <option value="60" ${(task.duration_minutes || 30) === 60 ? 'selected' : ''}>1 час</option>
                <option value="90" ${(task.duration_minutes || 30) === 90 ? 'selected' : ''}>1.5 часа</option>
                <option value="120" ${(task.duration_minutes || 30) === 120 ? 'selected' : ''}>2 часа</option>
                <option value="180" ${(task.duration_minutes || 30) === 180 ? 'selected' : ''}>3 часа</option>
                <option value="240" ${(task.duration_minutes || 30) === 240 ? 'selected' : ''}>4 часа</option>
              </select>
            </div>
          </div>

          <!-- Recurrence Rule -->
          <div class="detail-meta-row">
            <span class="detail-meta-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
              Повторение
            </span>
            <select class="input-select" id="detail-recurrence" style="width: auto; padding: 4px 8px; font-size: 12px;">
              <option value="" ${!task.recurrence_rule ? 'selected' : ''}>Не повторять</option>
              <option value="DAILY" ${task.recurrence_rule === 'DAILY' ? 'selected' : ''}>Ежедневно</option>
              <option value="WEEKDAYS" ${task.recurrence_rule === 'WEEKDAYS' ? 'selected' : ''}>По будням (Пн-Пт)</option>
              <option value="WEEKLY" ${task.recurrence_rule === 'WEEKLY' ? 'selected' : ''}>Еженедельно</option>
              <option value="MONTHLY" ${task.recurrence_rule === 'MONTHLY' ? 'selected' : ''}>Ежемесячно</option>
            </select>
          </div>

          <!-- Priority -->
          <div class="detail-meta-row">
            <span class="detail-meta-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              Приоритет
            </span>
            <select class="input-select" id="detail-priority" style="width: auto; padding: 4px 8px; font-size: 12px;">
              <option value="0" ${priority === 0 ? 'selected' : ''}>⚪ Без приоритета</option>
              <option value="1" ${priority === 1 ? 'selected' : ''}>🔵 Низкий</option>
              <option value="3" ${priority === 3 ? 'selected' : ''}>🟡 Средний</option>
              <option value="5" ${priority === 5 ? 'selected' : ''}>🔴 Высокий</option>
            </select>
          </div>

          <!-- List Selector -->
          <div class="detail-meta-row">
            <span class="detail-meta-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6"></circle></svg>
              Список
            </span>
            <select class="input-select" id="detail-list-id" style="width: auto; padding: 4px 8px; font-size: 12px;">
              <option value="" ${!task.list_id ? 'selected' : ''}>📥 Входящие</option>
              ${lists.map(l => `
                <option value="${l.id}" ${task.list_id === l.id ? 'selected' : ''}>${l.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Eisenhower Quadrant -->
          <div class="detail-meta-row">
            <span class="detail-meta-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Матрица
            </span>
            <select class="input-select" id="detail-quadrant" style="width: auto; padding: 4px 8px; font-size: 12px;">
              <option value="1" ${task.eisenhower_quadrant === 1 ? 'selected' : ''}>Q1: Срочно и Важно</option>
              <option value="2" ${task.eisenhower_quadrant === 2 ? 'selected' : ''}>Q2: Не срочно, но Важно</option>
              <option value="3" ${task.eisenhower_quadrant === 3 ? 'selected' : ''}>Q3: Срочно, но Не важно</option>
              <option value="4" ${task.eisenhower_quadrant === 4 ? 'selected' : ''}>Q4: Не срочно и Не важно</option>
            </select>
          </div>
        </div>

        <!-- Subtasks Section (Checklist) -->
        <div class="detail-subtasks-section">
          <div class="flex items-center justify-between" style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
            <span>Подзадачи (${task.subtasks?.length || 0})</span>
          </div>

          <div class="subtask-items-list" id="detail-subtasks-list">
            ${(task.subtasks || []).map(st => `
              <div class="detail-subtask-item" data-subtask-id="${st.id}">
                <button class="custom-checkbox ${st.is_completed ? 'checked' : ''}" data-action="toggle-subtask" data-subtask-id="${st.id}">
                  <svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <input type="text" class="subtask-text-input ${st.is_completed ? 'completed' : ''}" value="${st.title}" data-action="edit-subtask-title" data-subtask-id="${st.id}">
                <button class="btn-icon" data-action="delete-subtask" data-subtask-id="${st.id}" style="width: 24px; height: 24px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            `).join('')}
          </div>

          <!-- Add Subtask Input -->
          <input type="text" class="input-text" id="detail-new-subtask-input" placeholder="+ Добавить пункт чеклиста..." style="font-size: 12.5px; padding: 6px 10px;">
        </div>

        <!-- Markdown Description / Notes Section -->
        <div class="form-group" style="margin-top: 8px;">
          <div class="flex items-center justify-between" style="margin-bottom: 6px;">
            <span class="form-label" style="font-weight: 700; text-transform: uppercase;">Заметка / Описание</span>
            <span style="font-size: 11px; color: var(--text-muted);">Markdown</span>
          </div>
          <textarea class="input-textarea" id="detail-description-input" rows="7" placeholder="Добавьте подробные заметки, ссылки или описание...">${task.description || ''}</textarea>
        </div>
      </div>
    </div>
  `;
}
