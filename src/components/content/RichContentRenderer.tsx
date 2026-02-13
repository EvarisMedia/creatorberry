import React from "react";

interface Props {
  content: string;
}

export function RichContentRenderer({ content }: Props) {
  // Split content by markdown image pattern ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = imageRegex.exec(content)) !== null) {
    // Text before this image
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      parts.push(
        <TextBlock key={key++} text={textBefore} />
      );
    }

    // Rendered image
    const alt = match[1] || "Image";
    const src = match[2];
    parts.push(
      <div key={key++} className="my-4 flex justify-center">
        <img
          src={src}
          alt={alt}
          className="max-w-full rounded-lg border border-border shadow-sm"
          style={{ maxHeight: "500px" }}
        />
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last image
  if (lastIndex < content.length) {
    parts.push(
      <TextBlock key={key++} text={content.slice(lastIndex)} />
    );
  }

  if (parts.length === 0) {
    return <p className="text-muted-foreground text-sm italic">No content yet.</p>;
  }

  return <div className="space-y-1">{parts}</div>;
}

function TextBlock({ text }: { text: string }) {
  // Basic markdown rendering: headings, bold, italic, hr
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        if (trimmed.startsWith("### ")) {
          return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{renderInline(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith("## ")) {
          return <h2 key={i} className="text-lg font-semibold mt-5 mb-2">{renderInline(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith("# ")) {
          return <h1 key={i} className="text-xl font-bold mt-6 mb-2">{renderInline(trimmed.slice(2))}</h1>;
        }
        if (trimmed === "---") {
          return <hr key={i} className="border-border my-4" />;
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return <li key={i} className="text-sm ml-4 list-disc">{renderInline(trimmed.slice(2))}</li>;
        }
        if (/^\d+\.\s/.test(trimmed)) {
          return <li key={i} className="text-sm ml-4 list-decimal">{renderInline(trimmed.replace(/^\d+\.\s/, ""))}</li>;
        }

        return <p key={i} className="text-sm leading-relaxed">{renderInline(trimmed)}</p>;
      })}
    </>
  );
}

function renderInline(text: string): React.ReactNode {
  // Bold and italic
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.slice(lastIdx, m.index));
    }
    if (m[2]) {
      parts.push(<strong key={k++}>{m[2]}</strong>);
    } else if (m[3]) {
      parts.push(<em key={k++}>{m[3]}</em>);
    } else if (m[4]) {
      parts.push(<code key={k++} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{m[4]}</code>);
    }
    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
