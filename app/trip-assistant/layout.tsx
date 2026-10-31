import { TripAssistantProvider } from "@/features/trip-assistant/trip-assistant-provider";

export default function TripAssistantLayout({ children }: LayoutProps<"/trip-assistant">) {
  return <TripAssistantProvider>{children}</TripAssistantProvider>;
}
