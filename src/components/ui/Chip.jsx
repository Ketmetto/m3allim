/* kind: teal | green | gold | gray | red */
export function Chip({ kind = 'teal', dot = true, children }) {
  return (
    <span className={`chip chip-${kind}`}>
      {dot && <span className="chip-dot" />}
      {children}
    </span>
  );
}

const STATUS_KIND = {
  Confirmed: 'green', Accepted: 'green', Active: 'green', Approved: 'green', Operational: 'green', Resolved: 'green', Answered: 'green',
  Pending: 'gold', Invited: 'gold', Open: 'gold', 'New time proposed': 'gold', 'No account yet': 'gold',
  Completed: 'gray', Cancelled: 'gray', Dismissed: 'gray', Closed: 'gray',
  Declined: 'red', Banned: 'red', Suspended: 'red', Rejected: 'red', Down: 'red',
};
export const StatusChip = ({ status, label }) => <Chip kind={STATUS_KIND[status] || 'gray'}>{label || status}</Chip>;
