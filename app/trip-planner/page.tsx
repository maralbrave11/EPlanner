import { FeatureGate } from "@/app/_components/site-settings";
import { TripPlannerPage } from "@/features/trip-planner/components/trip-planner-page";

export const metadata = { title: "Trip planner — SmartTrip" };

export default function Page() {
  return (
    <FeatureGate tool="trip-planner">
      <TripPlannerPage />
    </FeatureGate>
  );
}
