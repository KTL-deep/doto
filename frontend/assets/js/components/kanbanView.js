// Kanban View Component for Doto
import { store } from '../store.js';

export function renderKanbanView() {
  const state = store.getState();
  const tasks = state.tasks || [];
  const selectedTask = state.selectedTask;

  // Group into Kanban columns: 'todo', 'in_progress', 'done'
  const cols = [
    { id: 'todo', title: 'К выполнению', color: '#3b82f6', items: [] },
    { id: 'in_progress', title: 'В процессе', color: '#f59e0b', items: [] },
    { id: 'done', title: 'Готово', color: '#10b981', items: [] },
  ];

  tasks.forEach(t => {
    if (t.status === 'completed' || t.kanban_column === 'done') {
      cols[2].items.push(t);
    } else if (t.kanban_column === 'in_progress') {
      cols[1].items.push(t);
    } else {
      cols[0].items.push(t);
    }
  });

  return `
    <div class="kanban-view">
      ${cols.map(col => `
        <div class="kanban-column" data-col-id="${col.id}">
          <div class="kanban-column-header">
            <div class="kanban-column-title">
              <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${col.color};"></span>
              <span>${col.title}</span>
              <span class="task-group-count">${col.items.length}</span>
            </div>
            <button class="btn-icon" data-action="add-kanban-task" data-col-id="${col.id}" title="Добавить задачу в колонку">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>

          <div class="kanban-card-list" data-col-id="${col.id}">
            ${col.items.map(task => renderKanbanCard(task, selectedTask)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderKanbanCard(task, selectedTask) {
  const isSelected = selectedTask && selectedTask.id === task.id;
  const isCompleted = task.status === 'completed';
  const priority = task.priority || 0;

  let priorityFlagHtml = '';
  if (priority > 0) {
    priorityFlagHtml = `<span class="priority-flag p-${priority}">!${priority === 5 ? 'Высокий' : priority === 3 ? 'Средний' : 'Низкий'}</span>`;
  }

  return `
    <div class="kanban-card ${isSelected ? 'selected' : ''}" data-task-id="${task.id}" draggable="true">
      <div class="flex items-center justify-between">
        <button class="custom-checkbox priority-${priority} ${isCompleted ? 'checked' : ''}" data-action="toggle-task" data-task-id="${task.id}">
          <svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </button>
        ${priorityFlagHtml}
      </div>

      <div class="task-title ${isCompleted ? 'completed' : ''}" data-action="open-detail" data-task-id="${task.id}">
        ${task.title}
      </div>

      <div class="flex items-center gap-2" style="font-size: 11px; color: var(--text-muted); flex-wrap: wrap;">
        ${task.due_date ? `<span>📅 ${task.due_date}</span>` : ''}
        ${task.subtasks?.length ? `<span>☑️ ${task.subtasks.filter(s => s.is_completed).length}/${task.subtasks.length}</span>` : ''}
      </div>
    </div>
  `;
}
