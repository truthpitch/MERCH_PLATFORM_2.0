import type { SizeTable as Table } from "@/lib/size-guides";

/** A size guide table; scrolls sideways on small screens when it has many columns. */
export function SizeTable({ table }: { table: Table }) {
  return (
    <div className="space-y-3">
      {table.header.length > 0 && (
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black">
                {table.header.map((h, i) => (
                  <th key={i} scope="col" className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-black">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {table.rows.map((row, r) => (
                <tr key={r}>
                  {table.header.map((_, c) =>
                    c === 0 ? (
                      <th key={c} scope="row" className="py-2 pr-4 font-medium text-black">
                        {row[c] ?? ""}
                      </th>
                    ) : (
                      <td key={c} className="py-2 pr-4 text-neutral-700">
                        {row[c] ?? ""}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {table.notes.map((n, i) => (
        <p key={i} className="text-xs text-neutral-500">
          {n}
        </p>
      ))}
    </div>
  );
}
