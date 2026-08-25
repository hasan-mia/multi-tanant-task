"use client";

import { Can } from "@/components/common/can";
import { OrganizationManager } from "@/features/organizations/components/organization-manager";

export default function OrganizationsPage() {
  return (
    <Can
      role="ADMIN"
      fallback={
        <p className="text-sm text-muted-foreground">
          You do not have permission to manage organizations.
        </p>
      }
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Organizations
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, rename, and remove organizations. Each project belongs to an
            organization.
          </p>
        </div>
        <OrganizationManager />
      </div>
    </Can>
  );
}
