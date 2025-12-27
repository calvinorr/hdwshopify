import { db } from "@/lib/db";
import { customers, orders } from "@/lib/db/schema";
import { desc, eq, like, or, sql, count, sum } from "drizzle-orm";
import Link from "next/link";
import {
  Users,
  Search,
  Eye,
  Mail,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchParams {
  q?: string;
  page?: string;
}

async function getCustomers(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let whereClause;
  if (searchParams.q) {
    const searchTerm = `%${searchParams.q}%`;
    whereClause = or(
      like(customers.email, searchTerm),
      like(customers.firstName, searchTerm),
      like(customers.lastName, searchTerm)
    );
  }

  const [customerList, countResult] = await Promise.all([
    db.query.customers.findMany({
      where: whereClause,
      orderBy: [desc(customers.createdAt)],
      limit,
      offset,
      with: {
        orders: {
          columns: {
            id: true,
            total: true,
          },
        },
      },
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause),
  ]);

  // Calculate stats for each customer
  const customersWithStats = customerList.map((customer) => ({
    ...customer,
    orderCount: customer.orders.length,
    totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
  }));

  return {
    customers: customersWithStats,
    total: Number(countResult[0]?.count || 0),
    page,
    limit,
  };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { customers: customerList, total, page, limit } = await getCustomers(params);
  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-stone-900">
            Customers
          </h1>
          <p className="text-stone-600 mt-1">
            {total} customer{total !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border p-4">
        <form className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <Button type="submit">Search</Button>
          {params.q && (
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/customers">Clear</Link>
            </Button>
          )}
        </form>
      </div>

      {/* Customers list */}
      {customerList.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Users className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">
            No customers found
          </h3>
          <p className="text-stone-500">
            {params.q
              ? "Try adjusting your search"
              : "Customers will appear here when they create accounts or place orders"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 border-b">
              <tr>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
                  Customer
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Orders
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Total Spent
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Joined
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {customerList.map((customer) => {
                const fullName = [customer.firstName, customer.lastName]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr key={customer.id} className="hover:bg-stone-50">
                    {/* Name */}
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-medium text-stone-900 hover:text-primary"
                      >
                        {fullName || "Unknown"}
                      </Link>
                      {customer.acceptsMarketing && (
                        <span className="ml-2 inline-flex px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                          Marketing
                        </span>
                      )}
                      {/* Show email on mobile */}
                      <p className="text-xs text-stone-500 md:hidden truncate max-w-[200px]">
                        {customer.email}
                      </p>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-sm text-stone-600 hover:text-primary flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{customer.email}</span>
                      </a>
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-stone-600 flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {customer.orderCount} order{customer.orderCount !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Total spent */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm font-medium text-stone-900">
                        {formatCurrency(customer.totalSpent)}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-sm text-stone-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(customer.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/customers/${customer.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={{
                    pathname: "/admin/customers",
                    query: { ...params, page: page - 1 },
                  }}
                >
                  Previous
                </Link>
              </Button>
            )}
            {page < pages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={{
                    pathname: "/admin/customers",
                    query: { ...params, page: page + 1 },
                  }}
                >
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
