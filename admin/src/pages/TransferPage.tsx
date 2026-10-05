import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, TransferRequest } from "../api";
import { QueryState } from "../components";

function UserIdField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const listId = `${label}-options`;
  return (
    <label className="block space-y-1 text-sm font-medium">
      {label}
      <Input
        className="font-mono"
        list={listId}
        placeholder="Cognito user ID"
        value={value}
        onChange={(event) => onChange(event.target.value.trim())}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

export function TransferPage() {
  const [searchParams] = useSearchParams();
  const [fromUserId, setFromUserId] = useState(searchParams.get("from") ?? "");
  const [toUserId, setToUserId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeMealPlan, setIncludeMealPlan] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  const users = useQuery(["users"], api.listUsers);
  const source = useQuery(["user", fromUserId], () => api.getUser(fromUserId), { enabled: !!fromUserId });
  const target = useQuery(["user", toUserId], () => api.getUser(toUserId), { enabled: !!toUserId });

  useEffect(() => {
    setSelected(new Set(source.data?.recipes.map((recipe) => recipe.uuid)));
  }, [source.data]);

  const transfer = useMutation((request: TransferRequest) => api.transfer(request), {
    onSuccess: () => {
      setConfirming(false);
      queryClient.invalidateQueries(["users"]);
      queryClient.invalidateQueries(["user", toUserId]);
    },
  });

  const recipes = source.data?.recipes ?? [];
  const allSelected = recipes.length > 0 && selected.size === recipes.length;
  const sameUser = !!fromUserId && fromUserId === toUserId;
  const canTransfer =
    !!source.data && !!target.data && !sameUser && (selected.size > 0 || includeMealPlan);

  const toggle = (uuid: string) => {
    const next = new Set(selected);
    if (next.has(uuid)) next.delete(uuid);
    else next.add(uuid);
    setSelected(next);
  };

  const submit = () =>
    transfer.mutate({
      fromUserId,
      toUserId,
      recipeUuids: allSelected ? undefined : Array.from(selected),
      includeMealPlan,
    });

  const userOptions = users.data?.users.map((user) => user.userId) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Transfer data</h1>
        <p className="text-sm text-muted-foreground">
          Copies recipes and their images to another account. The source account is never modified,
          and recipes keep their IDs, so re-running a transfer overwrites the earlier copies instead of
          duplicating them.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <UserIdField label="From" value={fromUserId} onChange={setFromUserId} options={userOptions} />
        <UserIdField label="To" value={toUserId} onChange={setToUserId} options={userOptions} />
      </div>
      {sameUser && <p className="text-sm text-destructive-foreground">Choose two different users.</p>}
      {toUserId && target.data && (
        <p className="text-sm text-muted-foreground">
          Target currently has {target.data.recipes.length} recipes
          {target.data.mealPlan.some((day) => day.plan.length > 0) ? " and a meal plan" : ""}.
        </p>
      )}
      {toUserId && <QueryState isLoading={target.isFetching} error={target.error} />}

      {fromUserId && <QueryState isLoading={source.isFetching} error={source.error} />}
      {source.data && (
        <Card className="gap-0 py-0">
          <CardContent className="divide-y p-0">
            <label className="flex items-center gap-3 px-4 py-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? new Set() : new Set(recipes.map((r) => r.uuid)))}
              />
              All recipes ({selected.size}/{recipes.length} selected)
            </label>
            <div className="max-h-96 overflow-y-auto">
              {recipes.map((recipe) => (
                <label key={recipe.uuid} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50">
                  <input type="checkbox" checked={selected.has(recipe.uuid)} onChange={() => toggle(recipe.uuid)} />
                  <span className="flex-1">{recipe.name}</span>
                  <span className="text-xs text-muted-foreground">{recipe.images.length} images</span>
                </label>
              ))}
            </div>
            <label className="flex items-start gap-3 px-4 py-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={includeMealPlan}
                onChange={(event) => setIncludeMealPlan(event.target.checked)}
              />
              <span>
                <span className="font-medium">Replace the target's meal plan</span>
                <span className="block text-muted-foreground">
                  The target's current meal plan is overwritten with the source's, keeping only entries
                  for the recipes being copied.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>
      )}

      <Button disabled={!canTransfer} onClick={() => setConfirming(true)}>
        Review transfer
      </Button>

      {transfer.data && (
        <div className="rounded-md border bg-card p-4 text-sm">
          Copied {transfer.data.recipesCopied} recipes and {transfer.data.imagesCopied} images
          {transfer.data.mealPlanCopied ? ", and replaced the meal plan" : ""}.{" "}
          <Link to={`/users/${toUserId}`} className="text-primary hover:underline">
            View target user
          </Link>
        </div>
      )}

      <Dialog open={confirming} onOpenChange={(open) => !transfer.isLoading && setConfirming(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              Copy <strong>{selected.size}</strong> recipes
              {includeMealPlan ? " and replace the meal plan" : ""}
            </p>
            <p className="break-all font-mono text-xs">from {fromUserId}</p>
            <p className="break-all font-mono text-xs">to {toUserId}</p>
            <QueryState isLoading={false} error={transfer.error} />
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={transfer.isLoading} onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button disabled={transfer.isLoading} onClick={submit}>
              {transfer.isLoading ? "Copying…" : "Copy data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
