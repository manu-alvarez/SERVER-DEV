import os
import re

app_dir = "/Users/manu/Desktop/SERVER-DEV/apps/taskflow-pro"

# 1. Fix whatsappService.ts
ws_path = os.path.join(app_dir, "src/services/whatsappService.ts")
with open(ws_path, "r") as f:
    ws_content = f.read()

# I want to add try/catch around localStorage.getItem, but it's already inside a try block!
# Let's check whatsappService.ts again... The problem is if localStorage is denied, the error is caught at the end of the method.
# But actually, if it's caught at the end, it doesn't crash the app (it just logs an error). So WSoD won't happen.
# Still, I will make it safer to not throw if localStorage is undefined.
new_ws_content = ws_content.replace(
    "const storageStr = localStorage.getItem('taskflowpro-v2-storage');",
    "let storageStr = null;\n      try { storageStr = localStorage.getItem('taskflowpro-v2-storage'); } catch(e) { console.error('LocalStorage error', e); }"
)

with open(ws_path, "w") as f:
    f.write(new_ws_content)


# 2. Fix taskStore.ts
ts_path = os.path.join(app_dir, "src/store/taskStore.ts")
with open(ts_path, "r") as f:
    ts_content = f.read()

# Replace the isSameMinute logic with "now >= reminderDate"
old_logic = """              const isSameMinute = 
                reminderDate.getFullYear() === now.getFullYear() &&
                reminderDate.getMonth() === now.getMonth() &&
                reminderDate.getDate() === now.getDate() &&
                reminderDate.getHours() === now.getHours() &&
                reminderDate.getMinutes() === now.getMinutes();

              if (isSameMinute) {"""

new_logic = """              // The reminder must trigger if the current time is at or past the reminder time.
              // Since it checks !task.reminderSent above, it won't fire twice.
              const isDue = now >= reminderDate;

              if (isDue) {"""

if old_logic in ts_content:
    new_ts_content = ts_content.replace(old_logic, new_logic)
    with open(ts_path, "w") as f:
        f.write(new_ts_content)
else:
    print("Could not find exact match in taskStore.ts")


# 3. Fix Tasks.tsx (any type)
tasks_path = os.path.join(app_dir, "src/pages/Tasks.tsx")
with open(tasks_path, "r") as f:
    tasks_content = f.read()

# We need to import Priority if it isn't already, but it's probably exported from taskStore.
# Let's just cast to `as "low" | "medium" | "high" | "urgent"` or find `setPriority(e.target.value as any)`
new_tasks_content = tasks_content.replace(
    "onChange={(e) => setPriority(e.target.value as any)}",
    "onChange={(e) => setPriority(e.target.value as \"low\" | \"medium\" | \"high\" | \"urgent\")}"
)

with open(tasks_path, "w") as f:
    f.write(new_tasks_content)

print("taskflow-pro refactor completed.")
