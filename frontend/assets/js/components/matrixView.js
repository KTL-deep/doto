// Eisenhower Matrix View Component for Doto
import { store } from '../store.js';

export function renderMatrixView() {
  const state = store.getState();
  const tasks = state.tasks || [];
  const selectedTask = state.selectedTask;

  const quadrants = [
    { id: 1, key: 'q1', title: 'Q1: Срочно и Важно', subtitle: 'Сделать немедленно', color: '#ef4444', items: [] },
    { id: 2, key: 'q2', title: 'Q2: Не срочно, но Важно', subtitle: 'Запланировать в календаре', color: '#3b82f6', items: [] },
    { id: 3, key: 'q3', title: 'Q3: Срочно, но Не важно', subtitle: 'Делегировать / Упростить', color: '#f59e0b', items: [] },
    { id: 4, key: 'q4', title: 'Q4: Не срочно и Не важно', subtitle: 'Минимизировать / Исключить', color: '#94a3b8', items: [] },
  ];

  tasks.forEach(t => {
    if (t.status !== 'trash') {
      const q = t.eisenhower_quadrant || 4;
      const targetQ = quadrants.find(item => item.id === q);
      if (targetQ) targetQ.items.push(t);
    }
  });

  return `
    <div class="matrix-view">
      <div class="matrix-grid">
        ${quadrants.map(q => `
          <div class="matrix-quadrant ${q.key}" data-quadrant-id="${q.id}">
            <div class="matrix-quadrant-header">
              <div>
                <div class="quadrant-title" style="color: ${q.color};">
                  <span>${q.title}</span>
                  <span class="task-group-count">${q.items.length}</span>
                </div>
                <div class="quadrant-subtitle">${q.subtitle}</div>
              </div>
              <button class="btn-icon" data-action="add-matrix-task" data-quadrant-id="${q.id}" title="Добавить задачу в этот квадрант">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>

            <div class="quadrant-task-list" data-quadrant-id="${q.id}">
              ${q.items.map(t => renderMatrixTaskItem(t, selectedTask)).join('')}
              ${q.items.length === 0 ? `
                <div style="font-size: 12px; color: var(--text-muted); padding: 12px; text-align: center; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
                  Перетащите сюда задачу или нажмите +
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMatrixTaskItem(task, selectedTask) {
  const isSelected = selectedTask && selectedTask.id === task.id;
  const isCompleted = task.status === 'completed';
  const priority = task.priority || 0;

  return `
    <div class="task-item ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}" draggable="true" style="padding: 8px 10px;">
      <button class="custom-checkbox priority-${priority} ${isCompleted ? 'checked' : ''}" data-action="toggle-task" data-task-id="${task.id}">
        <svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </button>

      <div class="task-main" data-action="open-detail" data-task-id="${task.id}">
        <span class="task-title truncate" style="font-size: 13px;">${task.title}</span>
        ${task.due_date ? `<span style="font-size: 11px; color: var(--text-muted);">📅 ${task.due_date}</span>` : ''}
      </div>
    </div>
  `;
}
