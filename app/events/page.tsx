import { FeatureGate } from "@/app/_components/site-settings";
import { EventsPage } from "@/features/events/components/events-page";

export const metadata = { title: "Events — SmartTrip" };

export default function Page() {
  return (
    <FeatureGate tool="events">
      <EventsPage />
    </FeatureGate>
  );
}
