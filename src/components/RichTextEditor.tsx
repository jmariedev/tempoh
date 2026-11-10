"use client";

import {
  IconBold,
  IconClearFormatting,
  IconItalic,
  IconLink,
  IconList,
  IconStrikethrough,
  IconUnderline,
} from "@tabler/icons-react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { fromDoc, toDoc, type RichText } from "@/lib/richtext";

interface Props {
  id: string;
  value: RichText;
  onChange: (value: RichText) => void;
  placeholder?: string;
  compact?: boolean;
}

function setLink(editor: Editor) {
  const current = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Link address", current ?? "https://");
  if (url === null) return;
  const chain = editor.chain().focus().extendMarkRange("link");
  if (!url.trim() || url.trim() === "https://") chain.unsetLink().run();
  else chain.setLink({ href: /^https?:\/\//.test(url) ? url.trim() : `https://${url.trim()}` }).run();
}

export default function RichTextEditor({ id, value, onChange, placeholder, compact }: Props) {
  const editor = useEditor({
    // Only the formatting Notion text properties can store.
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        orderedList: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: toDoc(value),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        id,
        class: `rte-content${compact ? " compact" : ""}`,
      },
    },
    onUpdate: ({ editor }) => onChange(fromDoc(editor.getJSON())),
  });

  const tools: { label: string; icon: typeof IconBold; active?: string; run: (e: Editor) => void }[] = [
    { label: "Bold", icon: IconBold, active: "bold", run: (e) => e.chain().focus().toggleBold().run() },
    { label: "Italic", icon: IconItalic, active: "italic", run: (e) => e.chain().focus().toggleItalic().run() },
    { label: "Underline", icon: IconUnderline, active: "underline", run: (e) => e.chain().focus().toggleUnderline().run() },
    { label: "Strikethrough", icon: IconStrikethrough, active: "strike", run: (e) => e.chain().focus().toggleStrike().run() },
    { label: "Bullet list", icon: IconList, active: "bulletList", run: (e) => e.chain().focus().toggleBulletList().run() },
    { label: "Link", icon: IconLink, active: "link", run: setLink },
    { label: "Clear formatting", icon: IconClearFormatting, run: (e) => e.chain().focus().unsetAllMarks().run() },
  ];

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
        {tools.map(({ label, icon: Icon, active, run }) => (
          <button
            key={label}
            type="button"
            className="rte-tool"
            aria-label={label}
            title={label}
            aria-pressed={active ? !!editor?.isActive(active) : undefined}
            disabled={!editor}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor && run(editor)}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
