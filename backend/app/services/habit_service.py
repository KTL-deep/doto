from datetime import date, timedelta
from typing import List, Dict, Any, Tuple
from backend.app.models.habit import Habit, HabitLog


def calculate_habit_streaks(habit: Habit, logs: List[HabitLog], target_date: date = None) -> Tuple[int, int, bool, int]:
    """
    Returns (current_streak, best_streak, today_completed, today_value)
    """
    if target_date is None:
        target_date = date.today()
        
    log_map: Dict[date, int] = {log.date: log.value for log in logs}
    
    today_val = log_map.get(target_date, 0)
    today_completed = today_val >= habit.target_frequency
    
    # Calculate current streak
    current_streak = 0
    check_d = target_date
    
    # If today is not completed yet, streak might continue from yesterday
    if not today_completed:
        check_d = target_date - timedelta(days=1)
        
    while True:
        val = log_map.get(check_d, 0)
        if val >= habit.target_frequency:
            current_streak += 1
            check_d -= timedelta(days=1)
        else:
            break
            
    # Calculate best streak across all logs
    if not logs:
        return current_streak, current_streak, today_completed, today_val
        
    sorted_dates = sorted(list(log_map.keys()))
    best_streak = 0
    temp_streak = 0
    prev_date = None
    
    for d in sorted_dates:
        if log_map[d] >= habit.target_frequency:
            if prev_date is None or d == prev_date + timedelta(days=1):
                temp_streak += 1
            else:
                temp_streak = 1
            prev_date = d
            if temp_streak > best_streak:
                best_streak = temp_streak
        else:
            temp_streak = 0
            prev_date = None
            
    best_streak = max(best_streak, current_streak)
    
    return current_streak, best_streak, today_completed, today_val
