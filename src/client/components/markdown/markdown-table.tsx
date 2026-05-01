import type { ComponentPropsWithoutRef } from "react";

export const MarkdownTable = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"table">) => (
  <div className="overflow-x-auto">
    <table {...props}>{children}</table>
  </div>
);
