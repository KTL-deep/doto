// Topbar Component for Doto
import { store } from '../store.js';

export function renderTopbar() {
  const state = store.getState();
  const activeView = state.activeView;
  const viewMode = state.viewMode;
  const pomo = state.pomo;

  // Derive view title and icon
  let title = 'Задачи';
  let iconHtml = '';
  let showViewSwitcher = false;

  if (activeView === 'inbox') {
    title = 'Входящие';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`;
    showViewSwitcher = true;
  } else if (activeView === 'today') {
    title = 'Сегодня';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    showViewSwitcher = true;
  } else if (activeView === 'next7days') {
    title = 'Следующие 7 дней';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    showViewSwitcher = true;
  } else if (activeView === 'calendar') {
    title = 'Календарь';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><line x1="2" y1="10" x2="22" y2="10"></line></svg>`;
  } else if (activeView === 'focus') {
    title = 'Фокус & Помодоро';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
  } else if (activeView === 'habits') {
    title = 'Трекер привычек';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`;
  } else if (activeView === 'stats') {
    title = 'Статистика & Продуктивность';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;
  } else if (activeView.startsWith('list_')) {
    const listId = parseInt(activeView.replace('list_', ''), 10);
    const lst = state.lists.find(l => l.id === listId);
    title = lst ? lst.name : 'Список';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${lst?.color || '#3b82f6'}" stroke-width="2"><circle cx="12" cy="12" r="6" fill="currentColor"></circle></svg>`;
    showViewSwitcher = true;
  } else if (activeView.startsWith('tag_')) {
    const tagId = parseInt(activeView.replace('tag_', ''), 10);
    const tag = state.tags.find(t => t.id === tagId);
    title = tag ? `#${tag.name}` : 'Тег';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${tag?.color || '#10b981'}" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path></svg>`;
    showViewSwitcher = true;
  } else if (activeView === 'completed') {
    title = 'Архив выполненных';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (activeView === 'trash') {
    title = 'Корзина';
    iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
  }

  // Format pomo remaining time
  const mins = Math.floor(pomo.timeRemaining / 60);
  const secs = pomo.timeRemaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return `
    <div class="topbar-left">
      <button class="btn-icon" id="btn-toggle-sidebar" title="Свернуть/развернуть панель">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div class="view-title">
        ${iconHtml}
        <span>${title}</span>
      </div>
    </div>

    <div class="topbar-center">
      <div class="search-box">
        <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></line><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" class="search-input" id="global-search-input" placeholder="Поиск задач, тегов, заметок..." value="${state.searchQuery || ''}">
        <span class="search-shortcut-badge">/</span>
      </div>
    </div>

    <div class="topbar-right">
      ${showViewSwitcher ? `
        <div class="view-switcher">
          <button class="view-switcher-btn ${viewMode === 'list' ? 'active' : ''}" data-mode="list" title="Вид: Список">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
          <button class="view-switcher-btn ${viewMode === 'kanban' ? 'active' : ''}" data-mode="kanban" title="Вид: Канбан-доска">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="18" rx="1"></rect><rect x="10" y="3" width="5" height="12" rx="1"></rect><rect x="17" y="3" width="5" height="15" rx="1"></rect></svg>
          </button>
        </div>
      ` : ''}

      <!-- Pomodoro Mini Widget in Topbar -->
      <div class="pomo-mini-widget ${pomo.isRunning ? 'running' : ''}" id="topbar-pomo-widget" title="Открыть таймер Помодоро">
        ${pomo.isRunning ? '<span class="pomo-pulse-dot"></span>' : '<span style="font-size: 13px;">🍅</span>'}
        <span style="font-family: var(--font-mono);">${timeStr}</span>
      </div>

      <!-- Quick Settings / Theme button -->
      <button class="btn-icon" id="btn-quick-theme" title="Сменить тему">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      </button>
    </div>
  `;
}
