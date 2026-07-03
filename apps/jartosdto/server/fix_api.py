import re

file_path = "/Users/manu/Desktop/SERVER-DEV/apps/jartosdto/client/src/lib/api.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix getConversationsLocal
def fix_get_conv(m):
    return """function getConversationsLocal(): any[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_CONVS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Error parsing conversations from localStorage", e);
    return [];
  }
}"""
content = re.sub(r'function getConversationsLocal\(\): any\[\] \{.*?\}', fix_get_conv, content, flags=re.DOTALL)

# Fix getMessagesLocal
def fix_get_msgs(m):
    return """function getMessagesLocal(convId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_MSGS_KEY);
  if (!stored) return [];
  try {
    const map = JSON.parse(stored);
    return map[convId] || [];
  } catch (e) {
    console.error("Error parsing messages from localStorage", e);
    return [];
  }
}"""
content = re.sub(r'function getMessagesLocal\(convId: string\): ChatMessage\[\] \{.*?\}', fix_get_msgs, content, flags=re.DOTALL)

# Fix saveMessagesLocal
def fix_save_msgs(m):
    return """function saveMessagesLocal(convId: string, msgs: ChatMessage[]) {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_MSGS_KEY) || "{}";
      const map = JSON.parse(stored);
      map[convId] = msgs;
      localStorage.setItem(LOCAL_MSGS_KEY, JSON.stringify(map));
    } catch (e) {
      console.error("Error saving messages to localStorage", e);
    }
  }
}"""
content = re.sub(r'function saveMessagesLocal\(convId: string, msgs: ChatMessage\[\]\) \{.*?\}', fix_save_msgs, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)

print("api.ts updated.")
