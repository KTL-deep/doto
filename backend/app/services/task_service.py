from datetime import datetime, date, timedelta, time, timezone
from typing import Optional, Tuple
import re


def compute_next_due_date(current_due: date, rule: str) -> Optional[date]:
    """
    Computes the next due date based on a recurrence rule string.
    Supported rules:
    - DAILY / DAY
    - WEEKDAYS (Mon-Fri)
    - WEEKLY / WEEK
    - MONTHLY / MONTH
    - YEARLY / YEAR
    - EVERY_N_DAYS:X
    """
    if not rule or not current_due:
        return None
        
    rule_upper = rule.strip().upper()
    
    if rule_upper in ("DAILY", "DAY"):
        return current_due + timedelta(days=1)
        
    elif rule_upper == "WEEKDAYS":
        next_d = current_due + timedelta(days=1)
        while next_d.weekday() >= 5:  # 5=Sat, 6=Sun
            next_d += timedelta(days=1)
        return next_d
        
    elif rule_upper in ("WEEKLY", "WEEK"):
        return current_due + timedelta(weeks=1)
        
    elif rule_upper in ("MONTHLY", "MONTH"):
        # Simple month increment
        month = current_due.month + 1
        year = current_due.year
        if month > 12:
            month = 1
            year += 1
        # Handle end of month boundary
        day = min(current_due.day, 28)
        try:
            return date(year, month, current_due.day)
        except ValueError:
            return date(year, month, day)
            
    elif rule_upper in ("YEARLY", "YEAR"):
        try:
            return date(current_due.year + 1, current_due.month, current_due.day)
        except ValueError:
            return date(current_due.year + 1, current_due.month, 28)
            
    elif rule_upper.startswith("EVERY_") and "_DAYS" in rule_upper:
        try:
            n = int(rule_upper.split(":")[1])
            return current_due + timedelta(days=n)
        except Exception:
            return current_due + timedelta(days=1)
            
    return current_due + timedelta(days=1)


def parse_smart_task_input(raw_title: str) -> dict:
    """
    Parses Quick-Add syntax like in TickTick:
    - '!1', '!2', '!3', '!!!' -> priority (1=low, 3=medium, 5=high)
    - '#tag' -> tag name
    - '^today', '^tomorrow', '^mon', '^2026-08-20' -> due date
    - '@14:30' or '14:00' -> time
    - '*daily', '*weekly' -> recurrence
    """
    title = raw_title.strip()
    result = {
        "title": title,
        "priority": 0,
        "due_date": None,
        "due_time": None,
        "has_time": False,
        "all_day": True,
        "tags": [],
        "recurrence_rule": None,
        "eisenhower_quadrant": 4
    }

    # Priority parsing: !3 / !!! -> 5, !2 / !! -> 3, !1 / ! -> 1
    if "!!!" in title or "!3" in title:
        result["priority"] = 5
        title = re.sub(r'(!3|!!!)', '', title)
    elif "!!" in title or "!2" in title:
        result["priority"] = 3
        title = re.sub(r'(!2|!!)', '', title)
    elif "!1" in title or "!low" in title.lower():
        result["priority"] = 1
        title = re.sub(r'(!1|!low)', '', title, flags=re.IGNORECASE)

    # Recurrence parsing: *daily, *weekly, *weekdays, *monthly
    recur_match = re.search(r'\*(daily|weekly|weekdays|monthly|yearly)', title, re.IGNORECASE)
    if recur_match:
        result["recurrence_rule"] = recur_match.group(1).upper()
        title = title.replace(recur_match.group(0), '')

    # Tag parsing: #work, #personal
    tag_matches = re.findall(r'#([a-zA-Z0-9_\-\u0400-\u04FF]+)', title)
    if tag_matches:
        result["tags"] = tag_matches
        title = re.sub(r'#[a-zA-Z0-9_\-\u0400-\u04FF]+', '', title)

    # Date parsing: ^today, ^tomorrow, ^yesterday, ^YYYY-MM-DD
    today = date.today()
    date_match = re.search(r'\^(today|tomorrow|сегодня|завтра|\d{4}-\d{2}-\d{2})', title, re.IGNORECASE)
    if date_match:
        val = date_match.group(1).lower()
        if val in ("today", "сегодня"):
            result["due_date"] = today
        elif val in ("tomorrow", "завтра"):
            result["due_date"] = today + timedelta(days=1)
        else:
            try:
                result["due_date"] = datetime.strptime(val, "%Y-%m-%d").date()
            except ValueError:
                pass
        title = title.replace(date_match.group(0), '')

    # Time parsing: @14:30 or 15:00
    time_match = re.search(r'@(\d{1,2}:\d{2})', title)
    if time_match:
        try:
            t_obj = datetime.strptime(time_match.group(1), "%H:%M").time()
            result["due_time"] = t_obj
            result["has_time"] = True
            result["all_day"] = False
        except ValueError:
            pass
        title = title.replace(time_match.group(0), '')

    # Clean up whitespace
    result["title"] = " ".join(title.split()).strip() or raw_title.strip()
    
    # Auto quadrant default
    if result["priority"] == 5:
        result["eisenhower_quadrant"] = 1 if result["due_date"] == today else 2
    elif result["priority"] == 3:
        result["eisenhower_quadrant"] = 2
    elif result["priority"] == 1:
        result["eisenhower_quadrant"] = 3
    else:
        result["eisenhower_quadrant"] = 4

    return result
