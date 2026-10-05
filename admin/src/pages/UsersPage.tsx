import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "../api";
import { CopyButton, QueryState } from "../components";

export function UsersPage() {
  const [filter, setFilter] = useState("");
  const { data, isLoading, error } = useQuery(["users"], api.listUsers);

  const users = (data?.users ?? []).filter((user) =>
    user.userId.toLowerCase().includes(filter.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl">Users</h1>
          <p className="text-sm text-muted-foreground">
            Every Cognito user ID with data in the Mise table.
          </p>
        </div>
        <Input
          className="max-w-xs"
          placeholder="Filter by user ID"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>

      <QueryState isLoading={isLoading} error={error} />

      {data && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User ID</th>
                <th className="px-4 py-3 font-medium">Recipes</th>
                <th className="px-4 py-3 font-medium">Meal plan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-2 font-mono">
                    <div className="flex items-center gap-1">
                      <Link to={`/users/${user.userId}`} className="text-primary hover:underline">
                        {user.userId}
                      </Link>
                      <CopyButton value={user.userId} />
                    </div>
                  </td>
                  <td className="px-4 py-2">{user.recipeCount}</td>
                  <td className="px-4 py-2">
                    {user.hasMealPlan ? <Badge variant="secondary">Saved</Badge> : "—"}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    No users match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
