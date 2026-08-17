// Reactive State Management for Doto

class Store {
  constructor() {
    this.state = {
      user: null,
      activeView: 'today', // inbox, today, next7days, matrix, calendar, habits, focus, stats, completed, trash, list_ID, tag_ID
      activeListId: null,
      activeTagId: null,
      viewMode: 'list', // list | kanban
      
      tasks: [],
      lists: [],
      tags: [],
      habits: [],
      
      selectedTask: null,
      searchQuery: '',
      sortOption: 'smart', // smart, due_date, priority, title
      
      // Pomodoro Timer State
      pomo: {
        isRunning: false,
        mode: 'work', // work, short_break, long_break, stopwatch
        timeRemaining: 25 * 60,
        totalDuration: 25 * 60,
        completedSessionsCount: 0,
        activeTaskId: null,
        ambientSound: 'none',
      },

      // UI state
      sidebarCollapsed: false,
      activeModal: null, // 'quickAdd', 'createList', 'createTag', 'createHabit', 'settings', 'auth'
    };

    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Store subscriber error:', err);
      }
    }
  }

  // Helper actions
  setUser(user) {
    this.setState({ user });
    if (user && user.theme) {
      document.documentElement.setAttribute('data-theme', user.theme);
    }
  }

  setActiveView(viewKey, listId = null, tagId = null) {
    this.setState({
      activeView: viewKey,
      activeListId: listId,
      activeTagId: tagId,
      selectedTask: null, // close drawer on nav change
    });
  }

  setViewMode(mode) {
    this.setState({ viewMode: mode });
  }

  setTasks(tasks) {
    this.setState({ tasks });
  }

  setSelectedTask(task) {
    this.setState({ selectedTask: task });
  }

  updateTask(updatedTask) {
    const tasks = this.state.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
    const selectedTask = this.state.selectedTask?.id === updatedTask.id ? updatedTask : this.state.selectedTask;
    this.setState({ tasks, selectedTask });
  }

  removeTask(taskId) {
    const tasks = this.state.tasks.filter(t => t.id !== taskId);
    const selectedTask = this.state.selectedTask?.id === taskId ? null : this.state.selectedTask;
    this.setState({ tasks, selectedTask });
  }

  openModal(modalName) {
    this.setState({ activeModal: modalName });
  }

  closeModal() {
    this.setState({ activeModal: null });
  }
}

export const store = new Store();
