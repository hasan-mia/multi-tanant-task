import { cn } from "@/lib/utils";

export function Typography({
  as: Comp = "div",
  className,
  children,
}: {
  as?: "div" | "p" | "h1" | "h2" | "h3";
  className?: string;
  children: React.ReactNode;
}) {
  return <Comp className={cn("text-balance", className)}>{children}</Comp>;
}
