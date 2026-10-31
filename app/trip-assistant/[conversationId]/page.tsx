import { Suspense } from "react";
import { ConversationView } from "@/features/trip-assistant/components/conversation-view";

export const metadata = { title: "Conversation — SmartTrip" };

// With cacheComponents, route params are runtime data and must be read inside <Suspense>.
export default function TripAssistantConversationPage({
  params,
}: PageProps<"/trip-assistant/[conversationId]">) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Loading conversation…</p>}>
      {params.then(({ conversationId }) => (
        <ConversationView conversationId={conversationId} />
      ))}
    </Suspense>
  );
}
