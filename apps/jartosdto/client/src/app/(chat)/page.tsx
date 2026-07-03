"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getMessages } from "@/lib/api";
import { useChatStore } from "@/stores";
import ChatContainer from "@/components/chat/ChatContainer";

function ChatContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { setConversationId, setMessages, clearChat } = useChatStore();

  useEffect(() => {
    if (!id) {
      clearChat();
      return;
    }
    setConversationId(id);
    getMessages(id).then(msgs => {
      setMessages(msgs.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        thinking: m.thinking,
        sources: m.sources,
        model_id: m.model_id,
        attachments: m.attachments,
        created_at: m.created_at,
      })));
    }).catch(() => {});
  }, [id, setConversationId, setMessages, clearChat]);

  return <ChatContainer />;
}

/** Main chat page — supports new chat and loading existing conversation. */
export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-secondary)" }}>Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
