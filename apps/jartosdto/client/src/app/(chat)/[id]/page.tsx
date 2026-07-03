import ConversationClient from "./ConversationClient";

export async function generateStaticParams() {
  return [{ id: "1" }];
}

export default function ConversationPage() {
  return <ConversationClient />;
}
