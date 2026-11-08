import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDiwaliWish } from "@/lib/wish.functions";
import * as Dialog from "@radix-ui/react-dialog";

export function PersonalWish({ onRelease }: { onRelease: (wish: string) => void }) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [note, setNote] = useState("");
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const generate = useServerFn(createDiwaliWish);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current || !recipient.trim() || !note.trim()) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const result = await generate({ data: { recipient, note } });
      if (result.wish) setWish(result.wish);
      else setError(result.error ?? "No wish arrived.");
    } catch { setError("Couldn't connect to AI wishes. Your name and note have been kept."); }
    finally { pending.current = false; setBusy(false); }
  }

  return <Dialog.Root open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
    <Dialog.Trigger asChild><Button variant="ghost" className="exp-chip exp-chip--gold"><Sparkles /> Personalize with AI</Button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="exp-wish-overlay" />
      <Dialog.Content className="exp-personal exp-personal-modal" aria-describedby={undefined} onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }}>
        <div className="exp-personal-head"><Dialog.Title className="exp-h2">A wish just for them</Dialog.Title><Button variant="ghost" size="icon" aria-label="Close personalized wish" disabled={busy} onClick={() => setOpen(false)}><X /></Button></div>
        <form onSubmit={submit} className="exp-personal-form">
          <label htmlFor="recipient">Recipient name</label>
          <input autoFocus id="recipient" className="exp-input" value={recipient} maxLength={60} required disabled={busy} onChange={(e) => { setRecipient(e.target.value); setWish(""); }} placeholder="Their name" />
          <label htmlFor="personal-note">Personal note</label>
          <textarea id="personal-note" className="exp-input" value={note} maxLength={300} required disabled={busy} onChange={(e) => { setNote(e.target.value); setWish(""); }} placeholder="A memory, a thank-you, or something you wish for them…" rows={3} />
          <Button type="submit" className="exp-btn" disabled={busy || !recipient.trim() || !note.trim()}><Sparkles />{busy ? "Creating your wish…" : wish ? "Create another wish" : "Create Diwali wish"}</Button>
        </form>
        {error && <p className="exp-ai-error" role="alert">{error}</p>}
        {wish && <div className="exp-personal-result" aria-live="polite"><label htmlFor="generated-wish">Your Diwali wish</label><textarea id="generated-wish" className="exp-input" value={wish} rows={4} onChange={(e) => setWish(e.target.value)} /><Button className="exp-btn" disabled={busy || !wish.trim()} onClick={() => { onRelease(wish.trim()); setOpen(false); }}>Release into the sky</Button></div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}