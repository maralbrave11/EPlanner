import { FeatureGate } from "@/app/_components/site-settings";
import { TripAssistantProvider } from "@/features/trip-assistant/trip-assistant-provider";

export default function TripAssistantLayout({ children }: LayoutProps<"/trip-assistant">) {
  return (
    <TripAssistantProvider>
      <FeatureGate tool="trip-assistant">{children}</FeatureGate>
    </TripAssistantProvider>
  );
}
