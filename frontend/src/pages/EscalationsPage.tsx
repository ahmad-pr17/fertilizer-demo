import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { api, SessionExpiredError } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Conversation } from '../types';

function EscalationCard({
  conversation,
  onResolved,
}: {
  conversation: Conversation;
  onResolved: (id: string) => void;
}) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    if (!reply.trim()) return;
    setSending(true);
    setError('');
    try {
      await api.replyToEscalation(conversation.id, reply.trim());
      onResolved(conversation.id);
    } catch {
      setError('Could not send reply — try again.');
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{conversation.whatsappNumber}</span>
        <span>{new Date(conversation.createdAt).toLocaleString()}</span>
      </div>
      <p className="mb-2 whitespace-pre-wrap text-sm text-foreground">{conversation.rawMessage}</p>
      {conversation.escalationReason && (
        <p className="mb-3 text-xs font-medium text-red-600 dark:text-red-400">
          Escalated: {conversation.escalationReason}
        </p>
      )}
      <div className="flex items-start gap-2">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type a reply to send back over WhatsApp…"
          rows={2}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={handleSend}
          disabled={sending || !reply.trim()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Send size={14} />
          Send
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function EscalationsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [escalations, setEscalations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getEscalations()
      .then(setEscalations)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          logout();
          navigate('/login');
          return;
        }
        setError('Could not load escalations.');
      });
  }, [logout, navigate]);

  function handleResolved(id: string) {
    setEscalations((prev) => prev?.filter((c) => c.id !== id) ?? null);
  }

  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!escalations) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (escalations.length === 0) {
    return <p className="text-sm text-muted-foreground">No escalations waiting on a reply.</p>;
  }

  return (
    <div className="space-y-4">
      {escalations.map((conversation) => (
        <EscalationCard
          key={conversation.id}
          conversation={conversation}
          onResolved={handleResolved}
        />
      ))}
    </div>
  );
}
