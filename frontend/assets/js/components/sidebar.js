// Sidebar Component for Doto
import { store } from '../store.js';

export function renderSidebar() {
  const state = store.getState();
  const user = state.user;
  const activeView = state.activeView;
  const lists = state.lists || [];
  const tags = state.tags || [];

  // Calculate counts for today / inbox
  const tasks = state.tasks || [];
  const inboxCount = lists.length > 0 ? (state.inboxCount || 0) : 0;

  return `
    <div class="sidebar-header">
      <button class="user-profile-btn" id="btn-open-settings" title="Настройки профиля">
        <div class="user-avatar">
          ${user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : 'D')}
        </div>
        <div class="user-info">
          <div class="user-name truncate">${user?.full_name || user?.username || 'Гость'}</div>
          <div class="karma-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span id="sidebar-karma-val">Карма</span>
          </div>
        </div>
      </button>
    </div>

    <button class="sidebar-quick-add" id="btn-sidebar-quick-add">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      <span>Новая задача</span>
      <span class="kbd-hint">Ctrl+K</span>
    </button>

    <div class="sidebar-scroll">
      <!-- Smart Navigation Views -->
      <div class="sidebar-section">
        <div class="nav-item ${activeView === 'inbox' ? 'active' : ''}" data-view="inbox">
          <span class="nav-icon" style="color: #3b82f6;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
          </span>
          <span class="nav-label">Входящие</span>
        </div>

        <div class="nav-item ${activeView === 'today' ? 'active' : ''}" data-view="today">
          <span class="nav-icon" style="color: #10b981;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </span>
          <span class="nav-label">Сегодня</span>
        </div>

        <div class="nav-item ${activeView === 'next7days' ? 'active' : ''}" data-view="next7days">
          <span class="nav-icon" style="color: #8b5cf6;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>
          </span>
          <span class="nav-label">Следующие 7 дней</span>
        </div>


        <div class="nav-item ${activeView === 'calendar' ? 'active' : ''}" data-view="calendar">
          <span class="nav-icon" style="color: #06b6d4;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          </span>
          <span class="nav-label">Календарь</span>
        </div>

        <div class="nav-item ${activeView === 'focus' ? 'active' : ''}" data-view="focus">
          <span class="nav-icon" style="color: #ef4444;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </span>
          <span class="nav-label">Фокус & Помодоро</span>
        </div>

        <div class="nav-item ${activeView === 'habits' ? 'active' : ''}" data-view="habits">
          <span class="nav-icon" style="color: #ec4899;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          </span>
          <span class="nav-label">Привычки</span>
        </div>

        <div class="nav-item ${activeView === 'stats' ? 'active' : ''}" data-view="stats">
          <span class="nav-icon" style="color: #14b8a6;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </span>
          <span class="nav-label">Статистика</span>
        </div>
      </div>

      <!-- Custom Lists Section -->
      <div class="sidebar-section">
        <div class="sidebar-section-header">
          <span>Списки</span>
          <button class="sidebar-section-add-btn" id="btn-add-list" title="Создать список">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div class="list-nav-items">
          ${lists.map(lst => `
            <div class="nav-item ${activeView === `list_${lst.id}` ? 'active' : ''}" data-view="list_${lst.id}" data-list-id="${lst.id}">
              <span class="nav-icon" style="color: ${lst.color || '#3b82f6'};">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6" fill="currentColor"></circle></svg>
              </span>
              <span class="nav-label">${lst.name}</span>
              ${lst.task_count > 0 ? `<span class="nav-count">${lst.task_count}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tags Section -->
      <div class="sidebar-section">
        <div class="sidebar-section-header">
          <span>Теги</span>
          <button class="sidebar-section-add-btn" id="btn-add-tag" title="Создать тег">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div class="tag-nav-items">
          ${tags.map(tag => `
            <div class="nav-item ${activeView === `tag_${tag.id}` ? 'active' : ''}" data-view="tag_${tag.id}" data-tag-id="${tag.id}">
              <span class="nav-icon" style="color: ${tag.color || '#10b981'};">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              </span>
              <span class="nav-label">#${tag.name}</span>
              ${tag.task_count > 0 ? `<span class="nav-count">${tag.task_count}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Sidebar Bottom Footer -->
    <div class="sidebar-footer">
      <div class="nav-item ${activeView === 'completed' ? 'active' : ''}" data-view="completed" title="Завершенные задачи" style="flex: 1;">
        <span class="nav-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </span>
        <span class="nav-label">Архив</span>
      </div>

      <div class="nav-item ${activeView === 'trash' ? 'active' : ''}" data-view="trash" title="Корзина" style="flex: 1;">
        <span class="nav-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </span>
        <span class="nav-label">Корзина</span>
      </div>
    </div>
  `;
}
