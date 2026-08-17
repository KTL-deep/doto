// Focus & Pomodoro View Component for Doto
import { store } from '../store.js';

export function renderFocusView() {
  const state = store.getState();
  const pomo = state.pomo;
  const tasks = state.tasks || [];

  const mins = Math.floor(pomo.timeRemaining / 60);
  const secs = pomo.timeRemaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // SVG circle calculation
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = pomo.totalDuration > 0 ? (pomo.timeRemaining / pomo.totalDuration) : 1;
  const strokeDashoffset = circumference * (1 - progressPercent);

  // Active task name
  const activeTask = tasks.find(t => t.id === pomo.activeTaskId);

  return `
    <div class="focus-view">
      <!-- Timer Mode Switcher -->
      <div class="timer-mode-switcher">
        <button class="timer-mode-btn ${pomo.mode === 'work' ? 'active' : ''}" data-action="set-pomo-mode" data-mode="work">
          Фокус 25м
        </button>
        <button class="timer-mode-btn ${pomo.mode === 'short_break' ? 'active' : ''}" data-action="set-pomo-mode" data-mode="short_break">
          Перерыв 5м
        </button>
        <button class="timer-mode-btn ${pomo.mode === 'long_break' ? 'active' : ''}" data-action="set-pomo-mode" data-mode="long_break">
          Длинный перерыв 15м
        </button>
      </div>

      <!-- Circular Timer Display -->
      <div class="timer-circle-wrapper">
        <svg class="timer-svg" viewBox="0 0 280 280">
          <circle class="timer-circle-bg" cx="140" cy="140" r="${radius}"></circle>
          <circle class="timer-circle-progress" cx="140" cy="140" r="${radius}"
                  style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset};"></circle>
        </svg>

        <div class="timer-inner-content">
          <div class="timer-session-label">
            ${pomo.mode === 'work' ? 'Сессия фокуса' : 'Отдых'}
          </div>
          <div class="timer-digits">${timeStr}</div>
          <div style="font-size: 13px; color: var(--text-muted);">
            ${activeTask ? `Задача: <b>${activeTask.title}</b>` : 'Без привязки к задаче'}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="timer-controls">
        <button class="btn btn-secondary btn-icon" id="btn-reset-pomo" title="Сбросить таймер" style="width: 44px; height: 44px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
        </button>

        <button class="timer-main-btn" id="btn-toggle-pomo" title="${pomo.isRunning ? 'Пауза' : 'Старт'}">
          ${pomo.isRunning ? `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ` : `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          `}
        </button>

        <button class="btn btn-secondary btn-icon" id="btn-skip-pomo" title="Пропустить сессию" style="width: 44px; height: 44px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
        </button>
      </div>

      <!-- Ambient Sound Generator -->
      <div class="ambient-sounds-bar">
        <span style="font-size: 11.5px; font-weight: 600; color: var(--text-muted); margin-right: 4px;">Фоновый звук:</span>
        <button class="sound-btn ${pomo.ambientSound === 'rain' ? 'active' : ''}" data-action="set-ambient" data-sound="rain">
          🌧️ Дождь
        </button>
        <button class="sound-btn ${pomo.ambientSound === 'brown' ? 'active' : ''}" data-action="set-ambient" data-sound="brown">
          🌊 Глубокий фокус
        </button>
        <button class="sound-btn ${pomo.ambientSound === 'white' ? 'active' : ''}" data-action="set-ambient" data-sound="white">
          📻 Белый шум
        </button>
        <button class="sound-btn ${pomo.ambientSound === 'none' ? 'active' : ''}" data-action="set-ambient" data-sound="none">
          🔇 Выкл
        </button>
      </div>
    </div>
  `;
}
