import { Check, Clipboard } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="absolute top-2 right-2 bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? <Check size={16} /> : <Clipboard size={16} />}
    </Button>
  );
};
