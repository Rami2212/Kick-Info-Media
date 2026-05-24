import type { Metadata } from "next";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 | KickInfoMedia",
  description: "FIFA World Cup 2026 standings and knockout bracket schedule.",
};

type TeamRow = { name: string; flag: string };
type Group = { name: string; teams: TeamRow[] };

const groups: Group[] = [
  { name: "Group A", teams: [{ name: "Mexico", flag: "mx" }, { name: "South Africa", flag: "za" }, { name: "Korea Republic", flag: "kr" }, { name: "Czechia", flag: "cz" }] },
  { name: "Group B", teams: [{ name: "Canada", flag: "ca" }, { name: "Bosnia and Herzegovina", flag: "ba" }, { name: "Qatar", flag: "qa" }, { name: "Switzerland", flag: "ch" }] },
  { name: "Group C", teams: [{ name: "Brazil", flag: "br" }, { name: "Morocco", flag: "ma" }, { name: "Haiti", flag: "ht" }, { name: "Scotland", flag: "gb-sct" }] },
  { name: "Group D", teams: [{ name: "USA", flag: "us" }, { name: "Paraguay", flag: "py" }, { name: "Australia", flag: "au" }, { name: "Türkiye", flag: "tr" }] },
  { name: "Group E", teams: [{ name: "Germany", flag: "de" }, { name: "Curaçao", flag: "cw" }, { name: "Côte d'Ivoire", flag: "ci" }, { name: "Ecuador", flag: "ec" }] },
  { name: "Group F", teams: [{ name: "Netherlands", flag: "nl" }, { name: "Japan", flag: "jp" }, { name: "Sweden", flag: "se" }, { name: "Tunisia", flag: "tn" }] },
  { name: "Group G", teams: [{ name: "Belgium", flag: "be" }, { name: "Egypt", flag: "eg" }, { name: "IR Iran", flag: "ir" }, { name: "New Zealand", flag: "nz" }] },
  { name: "Group H", teams: [{ name: "Spain", flag: "es" }, { name: "Cabo Verde", flag: "cv" }, { name: "Saudi Arabia", flag: "sa" }, { name: "Uruguay", flag: "uy" }] },
  { name: "Group I", teams: [{ name: "France", flag: "fr" }, { name: "Senegal", flag: "sn" }, { name: "Iraq", flag: "iq" }, { name: "Norway", flag: "no" }] },
  { name: "Group J", teams: [{ name: "Argentina", flag: "ar" }, { name: "Algeria", flag: "dz" }, { name: "Austria", flag: "at" }, { name: "Jordan", flag: "jo" }] },
  { name: "Group K", teams: [{ name: "Portugal", flag: "pt" }, { name: "Congo DR", flag: "cd" }, { name: "Uzbekistan", flag: "uz" }, { name: "Colombia", flag: "co" }] },
  { name: "Group L", teams: [{ name: "England", flag: "gb-eng" }, { name: "Croatia", flag: "hr" }, { name: "Ghana", flag: "gh" }, { name: "Panama", flag: "pa" }] },
];

const cols = ["P", "W", "D", "L", "GF", "GA", "GD", "Pts", "Form"];

export default function FifaWorldCupPage() {
  return (
    <main className="football-page wc-dark">
      <section className="football-head">
        <p className="blog-sub">FIFA World Cup</p>
        <h1 className="blog-title">FIFA World Cup 2026™</h1>
        <p className="football-subtitle">11 June – 19 July 2026</p>
      </section>

      <section className="football-results wc-standings-wrap" style={{ marginTop: 20 }}>
        <h2 className="football-section-title">Standings</h2>

        <div style={styles.grid}>
          {groups.map((group) => (
            <div key={group.name} style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.headRow}>
                    <th style={{ ...styles.th, ...styles.teamCol, textAlign: "left" }}>
                      {group.name}
                    </th>
                    {cols.map((col) => (
                      <th
                        key={col}
                        style={{
                          ...styles.th,
                          ...(col === "Form" ? styles.formCol : styles.statCol),
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.teams.map((team, index) => (
                    <tr key={team.name} style={styles.bodyRow}>
                      <td style={{ ...styles.td, ...styles.teamCell }}>
                        <span style={styles.rank}>{index + 1}</span>
                        <img
                          src={`https://flagcdn.com/w20/${team.flag}.png`}
                          srcSet={`https://flagcdn.com/w40/${team.flag}.png 2x`}
                          width={20}
                          height={13}
                          alt={team.name}
                          style={styles.flag}
                        />
                        <span style={styles.teamName}>{team.name}</span>
                      </td>
                      <td style={styles.td}>0</td>
                      <td style={styles.td}>0</td>
                      <td style={styles.td}>0</td>
                      <td style={styles.td}>0</td>
                      <td style={styles.td}>0</td>
                      <td style={styles.td}>0</td>
                      <td style={styles.td}>0</td>
                      <td style={{ ...styles.td, ...styles.pts }}>0</td>
                      <td style={{ ...styles.td, ...styles.formCell }}>- - - - -</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 18,
  },
  card: {
    border: "1px solid #2a313d",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#0f1218",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
    fontSize: 13,
  },
  headRow: {
    borderBottom: "1px solid #2a313d",
    backgroundColor: "#141922",
  },
  bodyRow: {
    borderBottom: "1px solid #1f2530",
  },
  th: {
    padding: "9px 4px",
    fontWeight: 500,
    fontSize: 11,
    color: "#8e9aaf",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  teamCol: {
    width: "42%",
    paddingLeft: 12,
    fontSize: 12,
    color: "#e6eaf0",
  },
  statCol: {
    width: "5.5%",
  },
  formCol: {
    width: "13%",
  },
  td: {
    padding: "7px 4px",
    textAlign: "center",
    fontSize: 12,
    color: "#a9b3c4",
    verticalAlign: "middle",
  },
  teamCell: {
    textAlign: "left",
    paddingLeft: 12,
    paddingRight: 8,
  },
  teamName: {
    color: "#e6eaf0",
    fontSize: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rank: {
    display: "inline-block",
    width: 14,
    fontSize: 11,
    color: "#8e9aaf",
    marginRight: 4,
    flexShrink: 0,
  },
  flag: {
    display: "inline-block",
    verticalAlign: "middle",
    marginRight: 6,
    borderRadius: 2,
    objectFit: "cover",
    flexShrink: 0,
  },
  pts: {
    fontWeight: 600,
    color: "#ffffff",
  },
  formCell: {
    color: "#8e9aaf",
    letterSpacing: "0.05em",
    fontSize: 11,
  },
};
