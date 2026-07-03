"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { getMessages } from "@/lib/api";
import { useChatStore } from "@/stores";
import ChatContainer from "@/components/chat/ChatContainer";

/** Existing conversation page — loads message history. */
export default function ConversationClient() {
  const { id } = useParams<{ id: string }>();
  const { setConversationId, setMessages } = useChatStore();

  useEffect(() => {
    if (!id) return;
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
  }, [id, setConversationId, setMessages]);

  return <ChatContainer />;
}
