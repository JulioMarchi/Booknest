import { BookOpen } from "lucide-react";
import { siteConfig } from "@/lib/constants";
import { AuthMotionWrapper } from "@/features/auth/components/auth-motion-wrapper";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4 py-16">
      <div className="flex items-center gap-2 text-foreground">
        <BookOpen className="size-5 text-primary" />
        <span className="font-display text-xl font-semibold tracking-tight">
          {siteConfig.name}
        </span>
      </div>
      <div className="w-full max-w-sm">
        <AuthMotionWrapper>{children}</AuthMotionWrapper>
      </div>
    </div>
  );
}
