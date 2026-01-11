import { ProfileWorkspace } from '@/components/ProfileWorkspace';

export default function EditProfilePage() {
  return (
    <ProfileWorkspace
      eyebrow="Profile desk"
      title="Tune your PumpInder dossier"
      subtitle="Update your on-chain calling card at any time. Changes stay on this device until sync lands."
      submitLabel="Save changes & return"
      footnote="Need to tweak more later? Reopen this desk from the header whenever."
      successRedirect="/swipe"
      backHref="/swipe"
      backLabel="Back to swipe"
    />
  );
}
