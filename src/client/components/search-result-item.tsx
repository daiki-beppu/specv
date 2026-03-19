import { FileText } from "lucide-react";

import { CommandItem } from "@/components/ui/command";

interface FlatFile {
  path: string;
  name: string;
  dir: string;
}

const namePositions = (file: FlatFile, positions: Set<number>): Set<number> => {
  const nameStart = file.path.length - file.name.length;
  const result = new Set<number>();
  for (const pos of positions) {
    if (pos >= nameStart) {
      result.add(pos - nameStart);
    }
  }
  return result;
};

const groupCharsByHighlight = (str: string, indices: Set<number>) => {
  const spans: { highlighted: boolean; text: string }[] = [];
  for (let i = 0; i < str.length; i += 1) {
    const highlighted = indices.has(i);
    const prev = spans.at(-1);
    if (prev && prev.highlighted === highlighted) {
      prev.text += str[i];
    } else {
      spans.push({ highlighted, text: str[i] });
    }
  }
  return spans;
};

const HighlightChars = ({
  str,
  indices,
}: {
  str: string;
  indices: Set<number>;
}) => {
  const spans = groupCharsByHighlight(str, indices);

  return (
    <>
      {spans.map((span, i) =>
        span.highlighted ? (
          <span key={i} className="text-foreground font-semibold">
            {span.text}
          </span>
        ) : (
          <span key={i}>{span.text}</span>
        )
      )}
    </>
  );
};

interface SearchResultItemProps {
  file: FlatFile;
  positions: Set<number>;
  query: string;
  onSelect: (path: string) => void;
}

export type { FlatFile };

export const SearchResultItem = ({
  file,
  positions,
  query,
  onSelect,
}: SearchResultItemProps) => (
  <CommandItem key={file.path} value={file.path} onSelect={onSelect}>
    <FileText size={14} className="shrink-0 text-blue-500" />
    <span className="truncate text-muted-foreground">
      {query ? (
        <HighlightChars
          str={file.name}
          indices={namePositions(file, positions)}
        />
      ) : (
        file.name
      )}
    </span>
    {file.dir && (
      <span className="truncate text-xs text-muted-foreground ml-auto">
        {file.dir}
      </span>
    )}
  </CommandItem>
);
