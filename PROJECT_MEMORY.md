# 🧠 Память проекта: Doto (Аналог TickTick)

> **Последнее обновление**: 2026-08-17 22:51  
> **Статус проекта**: Активная разработка (Добавлен `.gitignore` файл, проект полностью готов к контролю версий Git)

---

## 📌 1. Обзор проекта и назначение
- **Цель**: Полноценный высокопроизводительный веб-аналог сервиса TickTick для управления персональными задачами, привычками, фокус-сессиями (Помодоро) и календарем.
- **Ключевой функционал**:
  - Смарт-списки (Входящие, Сегодня, Следующие 7 дней, Архив, Корзина).
  - Пользовательские списки и папки с кастомными цветами и иконками.
  - Тегирование (#срочно, #спорт, #работа) с цветовыми бейджами.
  - Приоритеты задач: 0 (Нет), 1 (Низкий), 3 (Средний), 5 (Высокий).
  - Умный быстрый ввод синтаксиса (`^сегодня`, `!3`, `#тег`, `*daily`).
  - Повторяющиеся задачи (RRULE: DAILY, WEEKDAYS, WEEKLY, MONTHLY).
  - Подзадачи (чеклисты) и Markdown-заметки.
  - **Интерактивный календарь (Режимы «Месяц» и «Неделя»)**:
    - Переключатель видов **[📅 Месяц]** и **[🗓️ Неделя]**.
    - **Режим «Неделя»**:
      - 7 колонок дней недели с датами и индикатором сегодняшнего дня.
      - Секция задач на весь день («Весь день»).
      - Почасовая сетка времени (07:00 – 22:00) с точным вертикальным позиционированием блоков задач по времени старта (`due_time`) и длительности (`duration_minutes`).
      - **Интерактивное изменение длительности задачи**: нижний край карточки задачи снабжен ручкой изменения размера (`.task-resize-bottom-handle`). При перетаскивании мышью вниз/вверх блок динамически растягивается с шагом 15 минут, отображая подсказку диапазона времени (например, `11:00 - 12:30 (90м)`), и сохраняет новую длительность на бэкенде.
      - **Сохранение длительности при переносе**: при перетаскивании задачи на другой день или на другое время её установленная длительность (`duration_minutes`) строго сохраняется и не сбрасывается.
    - Выдвижная правая панель «Расставить задачи» с 3 вкладками (Списки с мультивыбором, Теги с мультивыбором, Без даты) и Drag-and-Drop на сетку дней или конкретные часы.
  - Канбан-доска (К выполнению / В процессе / Готово).
  - Трекер привычек с 7-дневными круговыми чек-инами и счетчиком серий (🔥 Streak).
  - Таймер Помодоро (25м/5м/15м) с автономным генератором звуков (Web Audio API) и привязкой к задачам.
  - Статистика продуктивности и геймификация (Карма).
  - Поддержка тем: Dark, Light, Forest, Sunset, Cyber.

---

## 🛠️ 2. Стек технологий и окружение
- **Бэкенд**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async), aiosqlite, PyJWT, bcrypt.
- **Фронтенд**: HTML5, Vanilla CSS (CSS Variables, Responsive, анимации), Vanilla JavaScript (ES6 Modules, reactive Store, Web Audio API, HTML5 Drag and Drop API, Pointer/Mouse Drag-to-Resize).
- **База данных**: SQLite (`doto.db`).
- **Команды запуска**:
  - Установка зависимостей: `.\.venv\Scripts\python -m pip install -r requirements.txt`
  - Запуск сервера: `.\.venv\Scripts\python run.py` (доступно на `http://127.0.0.1:8000`, API docs: `http://127.0.0.1:8000/docs`).

---

## 📂 3. Структура проекта и ключевые файлы
```
doto/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Маршруты: auth, users, tasks, lists, tags, habits, focus, calendar, stats
│   │   ├── core/            # config.py, database.py, security.py, deps.py
│   │   ├── models/          # user.py, task.py (с duration_minutes), list.py, tag.py, habit.py, focus.py
│   │   ├── schemas/         # Pydantic v2 схемы валидации (TaskBase, TaskUpdate и т.д.)
│   │   ├── services/        # task_service.py, habit_service.py, stats_service.py
│   │   └── main.py          # FastAPI приложение, CORS, Lifespan, раздача статики SPA
├── frontend/
│   ├── assets/
│   │   ├── css/             # variables.css, base.css, layout.css, components.css, views.css, modals.css
│   │   └── js/              # api.js, store.js, audio.js, app.js, components/ (calendarView.js, etc.)
│   └── index.html           # SPA страница
├── .gitignore               # Игнорируемые Git файлы и директории
├── requirements.txt         # Зависимости Python
├── run.py                   # Скрипт единого запуска
├── PROJECT_MEMORY.md        # Файл долговременной памяти проекта
└── README.md                # Описание проекта
```

---

## 🗄️ 4. Модели данных (База данных)
- **User**: `id`, `email`, `username`, `hashed_password`, `theme`, `pomo_*_duration`, `sound_enabled`.
- **TaskList**: `id`, `user_id`, `name`, `color`, `icon`, `is_folder`, `parent_id`, `sort_order`, `view_mode`, `is_archived`.
- **Tag**: `id`, `user_id`, `name`, `color`, `parent_id`.
- **Task**: `id`, `user_id`, `list_id`, `title`, `description`, `priority`, `status`, `due_date`, `due_time`, `duration_minutes`, `has_time`, `all_day`, `recurrence_rule`, `is_pinned`, `kanban_column`, `actual_pomo`, `tags`, `subtasks`.
- **SubTask**: `id`, `task_id`, `title`, `is_completed`, `due_date`, `sort_order`.
- **Habit**: `id`, `user_id`, `name`, `icon`, `color`, `goal_days`, `target_frequency`, `frequency_unit`.
- **HabitLog**: `id`, `habit_id`, `user_id`, `date`, `value`, `note`.
- **FocusSession**: `id`, `user_id`, `task_id`, `duration_minutes`, `session_type`, `started_at`, `ended_at`.

---

## 🔌 5. Основные API эндпоинты
- **Аутентификация**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/demo`, `GET /api/v1/auth/me`.
- **Задачи**: `GET /api/v1/tasks`, `POST /api/v1/tasks?smart_parse=true`, `GET/PUT/DELETE /api/v1/tasks/{id}`, `POST /api/v1/tasks/{id}/toggle`, `POST /api/v1/tasks/batch`.
- **Подзадачи**: `POST/PUT/DELETE /api/v1/tasks/{id}/subtasks`.
- **Списки**: `GET/POST/PUT/DELETE /api/v1/lists`.
- **Теги**: `GET/POST/PUT/DELETE /api/v1/tags`.
- **Привычки**: `GET/POST/PUT/DELETE /api/v1/habits`, `POST /api/v1/habits/{id}/checkin`, `POST /api/v1/habits/{id}/uncheck`.
- **Фокус (Помодоро)**: `GET /api/v1/focus/sessions`, `POST /api/v1/focus/sessions`, `GET /api/v1/focus/stats`.
- **Календарь**: `GET /api/v1/calendar/events`.
- **Статистика & Карма**: `GET /api/v1/stats/summary`.

---

## ✅ 6. Текущее состояние и выполненные задачи
- [x] Создан файл `.gitignore` с полным списком исключений для Python, виртуальных окружений, SQLite, IDE и системных файлов.
- [x] Обновлен файл памяти проекта `PROJECT_MEMORY.md`.
