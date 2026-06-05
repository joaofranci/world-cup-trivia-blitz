import { useEffect, useState } from "react";
import { getProfile, setNickname, type Profile } from "@/lib/profile";

export function ProfileCard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setDraft(p.nickname);
  }, []);

  if (!profile) return null;
  const initials = profile.nickname.slice(0, 2).toUpperCase();

  return (
    <div className="rounded-3xl p-6 bg-card border border-border shadow-stadium">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl pitch-bg flex items-center justify-center font-display text-2xl text-white shadow-trophy">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={20}
                className="flex-1 px-3 py-2 rounded-xl border-2 border-border bg-background font-medium"
                autoFocus
              />
              <button
                onClick={() => {
                  setProfile(setNickname(draft));
                  setEditing(false);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display tracking-wider"
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Player</div>
              <div className="font-display text-3xl tracking-wider truncate">{profile.nickname}</div>
            </>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
