/* Table. columns: [{ key, label, width (px, omit = flexible), render(row) }] */
export function DataTable({ columns, rows, selectedId, onRowClick, rowKey = 'id' }) {
  const tpl = columns.map((c) => (c.width ? `${c.width}px` : 'minmax(0, 1fr)')).join(' ');
  return (
    <div className="table" role="table">
      <div className="table-row table-head" role="row" style={{ gridTemplateColumns: tpl }}>
        {columns.map((c) => <div key={c.key} role="columnheader">{c.label}</div>)}
      </div>
      {rows.map((r) => (
        <div
          key={r[rowKey]}
          role="row"
          className={`table-row ${selectedId === r[rowKey] ? 'selected' : ''} ${onRowClick ? 'clickable' : ''}`}
          style={{ gridTemplateColumns: tpl }}
          onClick={() => onRowClick && onRowClick(r)}
        >
          {columns.map((c) => <div key={c.key} role="cell" className="cell">{c.render ? c.render(r) : r[c.key]}</div>)}
        </div>
      ))}
    </div>
  );
}
