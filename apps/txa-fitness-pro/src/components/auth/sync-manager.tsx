"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useWorkoutStore } from "@/store/workout-store";
import { useCoachingStore } from "@/store/coaching-store";
import { useAssessmentStore } from "@/store/assessment-store";

export function SyncManager() {
  const { data: session, status } = useSession();
  const hasPulled = useRef(false);

  // Zustand stores
  const workoutState = useWorkoutStore();
  const coachingState = useCoachingStore();
  const assessmentState = useAssessmentStore();

  useEffect(() => {
    if (status === "authenticated" && !hasPulled.current) {
      // Pull data once on login
      hasPulled.current = true;
      fetch("/app/txafitnesspro/api/user/sync")
        .then((res) => res.json())
        .then((data) => {
          if (data.state) {
            if (data.state.workout) useWorkoutStore.setState(data.state.workout);
            if (data.state.coaching) useCoachingStore.setState(data.state.coaching);
            if (data.state.assessment) useAssessmentStore.setState(data.state.assessment);
          }
        })
        .catch(console.error);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && hasPulled.current) {
      const stateToSave = {
        workout: useWorkoutStore.getState(),
        coaching: useCoachingStore.getState(),
        assessment: useAssessmentStore.getState(),
      };

      const timeoutId = setTimeout(() => {
        fetch("/app/txafitnesspro/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: stateToSave }),
        }).catch(console.error);
      }, 2000); // Debounce saves by 2 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [workoutState, coachingState, assessmentState, status]);

  return null; // Invisible component
}
