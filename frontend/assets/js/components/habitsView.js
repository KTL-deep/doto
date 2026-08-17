// Habit Tracker View Component for Doto
import { store } from '../store.js';

export function renderHabitsView() {
  const state = store.getState();
  const habits = state.habits || [];

  // Generate last 7 days for the weekly check-in grid
  const days = [];
  const today = new Date();
  const dayLabels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      dayName: dayLabels[d.getDay()],
      isToday: i === 0,
    });
  }

  return `
    <div class="habits-view">
      <!-- Habit Header Banner -->
      <div class="habits-header-banner">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
            Трекер полезных привычек ⚡
          </h2>
          <p style="font-size: 13px; color: var(--text-secondary);">
            Формируйте дисциплину день за днем. Отмечайте прогресс для непрерывной серии!
          </p>
        </div>
        <button class="btn btn-primary" id="btn-create-habit-modal" style="background-color: #ec4899;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Новая привычка</span>
        </button>
      </div>

      <!-- Habits List -->
      <div class="habits-list">
        ${habits.map(habit => {
          const logDates = new Set((habit.recent_logs || []).map(l => l.date));

          return `
            <div class="habit-card" data-habit-id="${habit.id}">
              <div class="habit-info">
                <div class="habit-icon-pill" style="background-color: ${habit.color ? `${habit.color}20` : 'rgba(236,72,153,0.15)'}; color: ${habit.color || '#ec4899'};">
                  <span>${getHabitEmoji(habit.icon)}</span>
                </div>
                <div>
                  <div class="habit-name">${habit.name}</div>
                  <div class="flex items-center gap-3" style="margin-top: 2px;">
                    <span class="habit-streak-pill">
                      🔥 ${habit.current_streak || 0} дн. (рекорд: ${habit.best_streak || 0})
                    </span>
                    <span style="font-size: 11.5px; color: var(--text-muted);">
                      Цель: ${habit.target_frequency} ${habit.frequency_unit_label || 'раз'} в день
                    </span>
                  </div>
                </div>
              </div>

              <!-- 7-day mini check-in buttons -->
              <div class="habit-week-dots">
                ${days.map(day => {
                  const isDone = logDates.has(day.dateStr);
                  return `
                    <button class="habit-day-btn ${isDone ? 'completed' : ''}" 
                            data-action="toggle-habit" 
                            data-habit-id="${habit.id}" 
                            data-date="${day.dateStr}"
                            data-is-done="${isDone}"
                            style="${isDone && habit.color ? `background-color: ${habit.color}; border-color: ${habit.color};` : ''}"
                            title="${day.dateStr}: ${isDone ? 'Выполнено (нажмите для отмены)' : 'Нажмите для отметки'}">
                      ${isDone ? '✓' : day.dayName}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}

        ${habits.length === 0 ? `
          <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
            <div style="font-size: 40px; margin-bottom: 12px;">🌱</div>
            <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">У вас пока нет активных привычек</div>
            <div style="font-size: 13px; margin-bottom: 16px;">Добавьте привычку: пить воду, читать 15 минут, зарядка или медитация.</div>
            <button class="btn btn-primary" id="btn-empty-create-habit">Создать первую привычку</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getHabitEmoji(iconKey) {
  const map = {
    star: '⭐',
    book: '📚',
    water: '💧',
    fitness: '🏃',
    meditate: '🧘',
    code: '💻',
    bed: '🌙',
    heart: '❤️',
  };
  return map[iconKey] || '⭐';
}
