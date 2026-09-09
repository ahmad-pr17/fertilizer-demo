import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock3, TriangleAlert } from 'lucide-react';
import { api, SessionExpiredError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { StatusPill } from '../components/StatusPill';
import { StatCard } from '../components/StatCard';
import { ORDER_STATUSES, type Order } from '../types';

function money(amount: number | null): string {
  return amount === null ? '—' : `Rs. ${amount.toLocaleString()}`;
}

export function OrdersPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [escalationCount, setEscalationCount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    api
      .getOrders()
      .then(setOrders)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          logout();
          navigate('/login');
          return;
        }
        setError('Could not load orders.');
      });
    api
      .getEscalations()
      .then((rows) => setEscalationCount(rows.length))
      .catch(() => setEscalationCount(null));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusChange(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, status);
      load();
    } catch {
      setError('Could not update order status — try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = orders?.filter((o) => o.status === 'pending_confirmation').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={String(orders?.length ?? '—')} icon={ClipboardList} />
        <StatCard label="Awaiting confirmation" value={String(pendingCount)} icon={Clock3} />
        <StatCard
          label="Open escalations"
          value={escalationCount === null ? '—' : String(escalationCount)}
          icon={TriangleAlert}
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!orders && !error && <p className="text-sm text-muted-foreground">Loading…</p>}

      {orders && orders.length === 0 && (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      )}

      {orders && orders.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Items</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Delivery</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    {order.items
                      .map((item) => `${item.quantity} ${item.unit} ${item.productName}`)
                      .join(', ')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">{money(order.totalAmount)}</td>
                  <td className="px-4 py-2.5">{order.deliveryAddress ?? '—'}</td>
                  <td className="px-4 py-2.5">{order.paymentTerms ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                      <StatusPill status={order.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
