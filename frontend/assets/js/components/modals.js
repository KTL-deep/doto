// Modals & Overlays for Doto
import { store } from '../store.js';

export function renderModals() {
  const state = store.getState();
  const activeModal = state.activeModal;
  if (!activeModal) return '';

  if (activeModal === 'auth') {
    return renderAuthModal();
  } else if (activeModal === 'quickAdd') {
    return renderQuickAddModal();
  } else if (activeModal === 'createList') {
    return renderCreateListModal();
  } else if (activeModal === 'createTag') {
    return renderCreateTagModal();
  } else if (activeModal === 'createHabit') {
    return renderCreateHabitModal();
  } else if (activeModal === 'settings') {
    return renderSettingsModal();
  }

  return '';
}

function renderAuthModal() {
  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-card animate-scale-in" style="max-width: 420px;">
        <div class="modal-header">
          <div class="modal-title">Вход в Doto 🚀</div>
          <button class="btn-icon" data-action="close-modal">✕</button>
        </div>

        <div class="modal-body">
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button class="btn btn-secondary" id="auth-tab-login" style="flex: 1; background: var(--bg-hover);">Вход</button>
            <button class="btn btn-secondary" id="auth-tab-register" style="flex: 1;">Регистрация</button>
          </div>

          <form id="auth-form" class="flex flex-col gap-3">
            <div class="form-group" id="group-username">
              <label class="form-label">Логин / Email</label>
              <input type="text" class="input-text" id="auth-username" required placeholder="Введите ваш логин или email">
            </div>

            <div class="form-group hidden" id="group-email">
              <label class="form-label">Email</label>
              <input type="email" class="input-text" id="auth-email" placeholder="example@mail.ru">
            </div>

            <div class="form-group">
              <label class="form-label">Пароль</label>
              <input type="password" class="input-text" id="auth-password" required placeholder="Минимум 6 символов">
            </div>

            <button type="submit" class="btn btn-primary" id="btn-submit-auth" style="margin-top: 8px;">
              Войти
            </button>
          </form>

          <div style="text-align: center; margin: 12px 0; font-size: 12px; color: var(--text-muted);">
            — или мгновенный доступ без регистрации —
          </div>

          <button class="btn btn-secondary" id="btn-instant-demo" style="width: 100%; border-color: var(--brand-primary); color: var(--brand-primary);">
            ⚡ Попробовать Демо в 1 клик
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderQuickAddModal() {
  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-card command-palette-card animate-scale-in">
        <div class="command-input-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <input type="text" class="command-input" id="quick-add-modal-input" placeholder="Что нужно сделать? Например: Купить кофе ^сегодня !3 #личное *daily" autofocus>
        </div>

        <div class="syntax-hints">
          <div><span class="syntax-badge">^сегодня</span> дата</div>
          <div><span class="syntax-badge">!1 / !2 / !3</span> приоритет</div>
          <div><span class="syntax-badge">#тег</span> тег</div>
          <div><span class="syntax-badge">*daily</span> повтор</div>
          <div><span class="syntax-badge">Enter</span> сохранить</div>
          <div><span class="syntax-badge">Esc</span> закрыть</div>
        </div>
      </div>
    </div>
  `;
}

function renderCreateListModal() {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-card animate-scale-in">
        <div class="modal-header">
          <div class="modal-title">Создать новый список</div>
          <button class="btn-icon" data-action="close-modal">✕</button>
        </div>

        <form id="create-list-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Название списка</label>
              <input type="text" class="input-text" id="list-name-input" required placeholder="Например: Проект, Покупки, Книги...">
            </div>

            <div class="form-group">
              <label class="form-label">Цвет метки</label>
              <div class="color-picker-grid">
                ${colors.map((c, i) => `
                  <div class="color-option ${i === 0 ? 'selected' : ''}" data-color="${c}" style="background-color: ${c};"></div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="close-modal">Отмена</button>
            <button type="submit" class="btn btn-primary">Создать список</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderCreateTagModal() {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-card animate-scale-in">
        <div class="modal-header">
          <div class="modal-title">Создать новый тег</div>
          <button class="btn-icon" data-action="close-modal">✕</button>
        </div>

        <form id="create-tag-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Имя тега</label>
              <input type="text" class="input-text" id="tag-name-input" required placeholder="Например: срочно, идея, баг...">
            </div>

            <div class="form-group">
              <label class="form-label">Цвет</label>
              <div class="color-picker-grid">
                ${colors.map((c, i) => `
                  <div class="color-option ${i === 0 ? 'selected' : ''}" data-color="${c}" style="background-color: ${c};"></div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="close-modal">Отмена</button>
            <button type="submit" class="btn btn-primary">Создать тег</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderCreateHabitModal() {
  const icons = [
    { key: 'star', emoji: '⭐' },
    { key: 'book', emoji: '📚' },
    { key: 'water', emoji: '💧' },
    { key: 'fitness', emoji: '🏃' },
    { key: 'meditate', emoji: '🧘' },
    { key: 'code', emoji: '💻' },
    { key: 'bed', emoji: '🌙' },
    { key: 'heart', emoji: '❤️' },
  ];

  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-card animate-scale-in">
        <div class="modal-header">
          <div class="modal-title">Новая полезная привычка ⚡</div>
          <button class="btn-icon" data-action="close-modal">✕</button>
        </div>

        <form id="create-habit-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Название привычки</label>
              <input type="text" class="input-text" id="habit-name-input" required placeholder="Например: Чтение 20 страниц, 2л воды, Спорт...">
            </div>

            <div class="form-group">
              <label class="form-label">Иконка</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${icons.map((ic, i) => `
                  <button type="button" class="btn-icon ${i === 0 ? 'selected' : ''}" data-icon="${ic.key}" style="font-size: 20px; width: 38px; height: 38px; border: 1px solid var(--border-subtle);">
                    ${ic.emoji}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Целевая частота (в день)</label>
              <input type="number" class="input-text" id="habit-frequency-input" value="1" min="1" max="100">
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="close-modal">Отмена</button>
            <button type="submit" class="btn btn-primary" style="background-color: #ec4899;">Создать привычку</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderSettingsModal() {
  const state = store.getState();
  const user = state.user;

  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-card animate-scale-in">
        <div class="modal-header">
          <div class="modal-title">Настройки и Внешний вид</div>
          <button class="btn-icon" data-action="close-modal">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Тема оформления</label>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              <button class="btn btn-secondary theme-select-btn" data-theme="dark">🌑 Темная Pro</button>
              <button class="btn btn-secondary theme-select-btn" data-theme="light">☀️ Светлая</button>
              <button class="btn btn-secondary theme-select-btn" data-theme="forest">🌲 Forest</button>
              <button class="btn btn-secondary theme-select-btn" data-theme="sunset">🌅 Sunset</button>
              <button class="btn btn-secondary theme-select-btn" data-theme="cyber">⚡ Cyber</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Длительность сессии Помодоро (минут)</label>
            <input type="number" class="input-text" id="settings-pomo-work" value="${user?.pomo_work_duration || 25}" min="1" max="120">
          </div>

          <div class="form-group">
            <label class="form-label">Короткий перерыв (минут)</label>
            <input type="number" class="input-text" id="settings-pomo-break" value="${user?.pomo_short_break || 5}" min="1" max="30">
          </div>

          <div style="padding-top: 12px; border-top: 1px solid var(--border-subtle);">
            <button class="btn btn-danger" id="btn-logout" style="width: 100%;">
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
