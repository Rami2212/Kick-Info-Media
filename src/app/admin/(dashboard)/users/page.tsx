import { getMongoDb } from "@/lib/mongodb";

type AdminUserRow = {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  displayName?: string;
  country?: string;
  membership?: string;
  createdAt?: string;
  profileImageUrl?: string;
};

function safeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function safeDate(value: unknown) {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const db = await getMongoDb();
  const users = await db
    .collection<AdminUserRow>("users")
    .find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          username: 1,
          email: 1,
          name: 1,
          displayName: 1,
          country: 1,
          membership: 1,
          createdAt: 1,
          profileImageUrl: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div className="admin-page-wide space-y-6">
      <div className="admin-panel">
        <p className="admin-kicker">Accounts</p>
        <h2 className="admin-title mt-2">Users</h2>
        <p className="admin-subtitle">All registered users in your database.</p>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Name</th>
              <th>Country</th>
              <th>Membership</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={safeText(user.id) || safeText(user.email)}>
                <td>
                  <div className="flex items-center gap-3">
                    {safeText(user.profileImageUrl) ? (
                      <img
                        src={safeText(user.profileImageUrl)}
                        alt={safeText(user.username)}
                        className="h-9 w-9 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[11px] font-heading text-white/65">
                        {(safeText(user.username) || "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-heading text-[11px] uppercase tracking-[0.12em] text-white/85 truncate">
                        @{safeText(user.username) || "unknown"}
                      </p>
                      <p className="text-[11px] text-white/40 truncate">{safeText(user.id)}</p>
                    </div>
                  </div>
                </td>
                <td className="text-white/75">{safeText(user.email)}</td>
                <td>{safeText(user.name) || safeText(user.displayName) || "-"}</td>
                <td>{safeText(user.country) || "-"}</td>
                <td>{safeText(user.membership) || "-"}</td>
                <td>{safeDate(user.createdAt) || "-"}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-white/45">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
