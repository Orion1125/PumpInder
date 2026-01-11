import { ProfileWorkspace } from '@/components/ProfileWorkspace';

export default function OnboardingPage() {
  return (
    <ProfileWorkspace
      eyebrow="Step 1 · mint your vibe"
      title="Ship your PumpInder profile"
      subtitle="(Stashed on your local storage for now.)"
      submitLabel="Save & enter swipe mode"
      footnote="Finished here? We'll fast-track you to swipe mode and remember this device for next time."
      successRedirect="/swipe"
      backHref="/"
      backLabel="Back to landing"
    />
  );
}
