import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";

import PageMeta from "../components/common/PageMeta";
import DataTableThree from "../components/tables/DataTables/TableThree/DataTableThree";

export default function DataTables() {
  return (
    <>
      <PageMeta
        title="React.js Data Tables Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Data Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Data Tables" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Data Table 3">
          <DataTableThree />
        </ComponentCard>
      </div>
    </>
  );
}
