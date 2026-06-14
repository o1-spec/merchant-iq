import React from 'react';
import { marked } from 'marked';

interface MarkdownFormatterProps {
  content: string;
}

export function MarkdownFormatter({ content }: MarkdownFormatterProps) {
  if (!content) return null;

  // marked.parse returns string by default (synchronously)
  const rawHtml = marked.parse(content) as string;

  return (
    <div 
      className="text-slate-700 text-sm leading-relaxed space-y-3
        [&>h1]:text-lg [&>h1]:font-bold [&>h1]:text-slate-900 [&>h1]:mt-4 [&>h1]:mb-2 [&>h1]:border-b [&>h1]:border-slate-100 [&>h1]:pb-1
        [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-3 [&>h2]:mb-2
        [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-slate-900 [&>h3]:mt-3 [&>h3]:mb-1 [&>h3]:uppercase [&>h3]:tracking-wider
        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ul]:my-2
        [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1.5 [&>ol]:my-2
        [&>p]:my-1.5
        [&_strong]:font-semibold [&_strong]:text-slate-900
        [&_li]:marker:text-slate-400"
      dangerouslySetInnerHTML={{ __html: rawHtml }}
    />
  );
}
