import { requireStaff } from "@/lib/auth";
import { getAllHubs } from "@/lib/data";
import type { Hub } from "@/lib/types";
import { saveHub } from "../../actions";
import { Flash, PageTitle } from "../ui";

export const metadata = { title: "Hubs" };

function HubForm({ hub }: { hub?: Hub }) {
  const id = hub?.id ?? "new";
  return (
    <form action={saveHub} className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr_1fr_auto_auto] sm:items-end">
      <input type="hidden" name="id" value={hub?.id ?? ""} />
      <div><label htmlFor={`name-${id}`} className="field-label">Hub name</label><input id={`name-${id}`} name="name" required defaultValue={hub?.name} className="field" placeholder="Anna Nagar West" /></div>
      <div><label htmlFor={`area-${id}`} className="field-label">Area / address</label><input id={`area-${id}`} name="area" defaultValue={hub?.area} className="field" /></div>
      <div><label htmlFor={`fee-${id}`} className="field-label">Fee ₹ each way</label><input id={`fee-${id}`} name="deliveryFee" type="number" min={0} defaultValue={hub?.deliveryFee ?? 0} className="field" /></div>
      <div><label htmlFor={`order-${id}`} className="field-label">Order</label><input id={`order-${id}`} name="sortOrder" type="number" defaultValue={hub?.sortOrder ?? 0} className="field" /></div>
      <label className="flex min-h-12 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={hub?.active ?? true} className="size-5 accent-brand-600" />Active</label>
      <button type="submit" className={`btn ${hub ? "btn-secondary" : "btn-primary"}`}>{hub ? "Save" : "Add hub"}</button>
    </form>
  );
}

export default async function HubsAdmin(props: PageProps<"/admin/hubs">) {
  await requireStaff(["owner"]);
  const sp = await props.searchParams;
  const hubs = await getAllHubs();
  return (
    <div className="max-w-5xl">
      <PageTitle title="Delivery hubs" />
      <Flash sp={sp} />
      <p className="mb-4 text-sm text-muted">
        Customers pick a hub when they search. The fee is charged once for &quot;Delivery only&quot; and twice for &quot;Delivery &amp; pickup&quot;. Set ₹0 for free delivery.
      </p>
      <ul className="space-y-3">
        {hubs.map((h) => <li key={h.id} className="card p-4"><HubForm hub={h} /></li>)}
      </ul>
      <section className="card mt-5 border-dashed p-4">
        <h2 className="mb-3 font-bold">Add a hub</h2>
        <HubForm />
      </section>
    </div>
  );
}
