// Productivity & Karma Stats View Component for Doto
import { store } from '../store.js';

export function renderStatsView(statsData = null) {
  const stats = statsData || {
    karma_score: 120,
    total_tasks: 12,
    completed_tasks: 5,
    completion_rate: 41.7,
    current_task_streak: 2,
    total_focus_hours: 1.5,
    total_habits_completed: 6,
    daily_stats_last_7_days: [],
  };

  // Karma Level
  let karmaLevel = 'Начинающий';
  let karmaColor = '#3b82f6';
  let nextLevelScore = 500;
  if (stats.karma_score >= 2000) {
    karmaLevel = 'Дзен-Мастер 🧘';
    karmaColor = '#ec4899';
    nextLevelScore = 5000;
  } else if (stats.karma_score >= 1000) {
    karmaLevel = 'Мастер продуктивности ⚡';
    karmaColor = '#f59e0b';
    nextLevelScore = 2000;
  } else if (stats.karma_score >= 500) {
    karmaLevel = 'Продвинутый 🚀';
    karmaColor = '#10b981';
    nextLevelScore = 1000;
  }

  const progressPercent = Math.min(100, Math.round((stats.karma_score / nextLevelScore) * 100));

  return `
    <div class="stats-view">
      <!-- Karma Card -->
      <div class="karma-card">
        <div class="flex items-center justify-between" style="margin-bottom: 12px;">
          <div>
            <div style="font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">
              Уровень продуктивности (Карма)
            </div>
            <div style="font-size: 26px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>${karmaLevel}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 28px; font-weight: 800; color: ${karmaColor}; font-family: var(--font-mono);">
              ${stats.karma_score}
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">очков кармы</div>
          </div>
        </div>

        <!-- Progress bar to next level -->
        <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.15); border-radius: 9999px; overflow: hidden; margin-bottom: 6px;">
          <div style="height: 100%; width: ${progressPercent}%; background-color: ${karmaColor}; border-radius: 9999px; transition: width 0.5s ease;"></div>
        </div>
        <div class="flex items-center justify-between" style="font-size: 11px; color: var(--text-muted);">
          <span>Текущий прогресс: ${progressPercent}%</span>
          <span>Следующий уровень: ${nextLevelScore} очков</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-box-num" style="color: #10b981;">${stats.completed_tasks} / ${stats.total_tasks}</div>
          <div class="stat-box-label">Выполнено задач</div>
        </div>

        <div class="stat-box">
          <div class="stat-box-num" style="color: #3b82f6;">${stats.completion_rate}%</div>
          <div class="stat-box-label">Эффективность</div>
        </div>

        <div class="stat-box">
          <div class="stat-box-num" style="color: #f97316;">🔥 ${stats.current_task_streak} дн.</div>
          <div class="stat-box-label">Серия выполнения</div>
        </div>

        <div class="stat-box">
          <div class="stat-box-num" style="color: #ef4444;">⏱️ ${stats.total_focus_hours} ч</div>
          <div class="stat-box-label">Время в фокусе</div>
        </div>
      </div>

      <!-- 7-day Bar Chart -->
      <div class="stat-box" style="padding: 20px;">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">
          Активность за последние 7 дней (Выполнено задач)
        </h3>

        <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 160px; padding-top: 20px; gap: 8px;">
          ${(stats.daily_stats_last_7_days || []).map(day => {
            const heightPx = Math.min(130, Math.max(12, day.completed_count * 24));
            return `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">
                  ${day.completed_count}
                </span>
                <div style="width: 100%; max-width: 38px; height: ${heightPx}px; background-color: var(--brand-primary); border-radius: 6px 6px 0 0; transition: height 0.3s ease;"></div>
                <span style="font-size: 11px; color: var(--text-muted);">${day.date.slice(5)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}
