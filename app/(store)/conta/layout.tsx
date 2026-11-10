import { AccountNav } from "@/features/account/components/account-nav";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Minha conta
        </h1>
      </div>
      <AccountNav />
      <div>{children}</div>
    </div>
  );
}
