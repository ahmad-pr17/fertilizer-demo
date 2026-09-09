import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, SessionExpiredError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { StatusPill } from '../components/StatusPill';
import type { Dealer, DealerActivity } from '../types';

function money(amount: number): string {
  return `Rs. ${amount.toLocaleString()}`;
}

export function DealerActivityPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [activity, setActivity] = useState<DealerActivity | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getDealers()
      .then(setDealers)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          logout();
          navigate('/login');
          return;
        }
        setError('Could not load dealers.');
      });
  }, [logout, navigate]);

  useEffect(() => {
    if (!selectedId) {
      setActivity(null);
      return;
    }
    api
      .getDealerActivity(selectedId)
      .then(setActivity)
      .catch(() => setError('Could not load dealer activity.'));
  }, [selectedId]);

  return (
    <div>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="mb-6 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring sm:w-80"
      >
        <option value="">Select a dealer…</option>
        {dealers.map((dealer) => (
          <option key={dealer.id} value={dealer.id}>
            {dealer.name} — {dealer.whatsappNumber}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!activity && !error && (
        <p className="text-sm text-muted-foreground">Pick a dealer to see their activity.</p>
      )}

      {activity && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold text-foreground">
              {activity.dealer.name}{' '}
              <span className="font-normal text-muted-foreground">— {activity.dealer.region}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Credit limit: {money(activity.dealer.creditLimit)} · Balance:{' '}
              {money(activity.dealer.currentBalance)} · Available:{' '}
              {money(activity.dealer.creditLimit - activity.dealer.currentBalance)}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Recent orders</h2>
            {activity.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Items</th>
                      <th className="px-4 py-2 font-medium">Total</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activity.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          {order.items
                            .map((item) => `${item.quantity} ${item.unit} ${item.productName}`)
                            .join(', ')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {order.totalAmount === null ? '—' : money(order.totalAmount)}
                        </td>
                        <td className="px-4 py-2">
                          <StatusPill status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Recent conversations</h2>
            {activity.conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Message</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activity.conversations.map((conversation) => (
                      <tr key={conversation.id}>
                        <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                          {new Date(conversation.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">{conversation.rawMessage}</td>
                        <td className="px-4 py-2">
                          <StatusPill status={conversation.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
