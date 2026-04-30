import { Check, Clipboard } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // HTTP 環境（スマホからの LAN アクセス等）では clipboard API が使えないためフォールバック
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const handleClick = useCallback(() => {
    void handleCopy();
  }, [handleCopy]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="absolute top-2 right-2 bg-muted opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? <Check size={16} /> : <Clipboard size={16} />}
    </Button>
  );
};
