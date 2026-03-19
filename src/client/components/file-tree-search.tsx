import { Search } from "lucide-react";
import type React from "react";

import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";

interface FileTreeSearchProps {
  query: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileTreeSearch = ({ query, onChange }: FileTreeSearchProps) => (
  <div className="relative mb-3">
    <Search
      size={14}
      className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
    />
    <Input
      type="text"
      value={query}
      onChange={onChange}
      placeholder="Search files..."
      className="pl-7 pr-12 py-1 text-sm"
    />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs text-muted-foreground">
      <Kbd>⌘</Kbd>
      <Kbd>P</Kbd>
    </div>
  </div>
);
