import { ConversationSidebar } from "./conversation-sidebar";

/** Page frame: conversation list on the left, chat on the right. */
export function TripAssistantShell({
  activeId,
  children,
}: {
  activeId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <ConversationSidebar activeId={activeId} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
