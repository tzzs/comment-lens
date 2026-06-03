/** Ready status shown in the badge. */
const ReadyStatus = 'ready';

/** StatusBadge component. */
function StatusBadge(props: { status: string }) {
  return <span>{props.status}</span>;
}

const order = {
  status: ReadyStatus
};

export const view = <StatusBadge status={order.status} />;
