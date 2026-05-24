import type { RankingRow } from "@/lib/rankings";

type RankingsTableProps = {
  title: string;
  rows: RankingRow[];
};

function formatPoints(value: number): string {
  return value.toFixed(2);
}

export default function RankingsTable({ title, rows }: RankingsTableProps) {
  return (
    <div className="rankings-card">
      <div className="rankings-card-head">
        <p className="rankings-card-kicker">{title}</p>
      </div>

      <div className="rankings-table-wrap">
        <table className="rankings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.rank}-${row.team}`}>
                <td>{row.rank}</td>
                <td>
                  <div className="rankings-team">
                    <img
                      src={`https://flagcdn.com/w20/${row.code}.png`}
                      srcSet={`https://flagcdn.com/w40/${row.code}.png 2x`}
                      width={20}
                      height={14}
                      alt={row.team}
                      className="rankings-flag"
                    />
                    <span>{row.team}</span>
                  </div>
                </td>
                <td>{formatPoints(row.points)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
