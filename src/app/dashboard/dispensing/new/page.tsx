import { getAvailableBatches, getBeneficiaries } from "@/features/dispensing/queries";
import { NewDispensingForm } from "@/features/dispensing/components/new-dispensing-form";

export default async function NewDispensingPage() {
  const [batches, beneficiaries] = await Promise.all([
    getAvailableBatches(),
    getBeneficiaries(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
          New Distribution
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record a new milk dispensing to a beneficiary. The processing fee is ₱2/mL.
        </p>
      </div>
      <NewDispensingForm
        batches={batches}
        beneficiaries={beneficiaries}
        dispensedBy={1}
      />
    </div>
  );
}
