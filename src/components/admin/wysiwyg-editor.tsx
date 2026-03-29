"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
} from "lucide-react";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function WysiwygEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[200px] px-4 py-3 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("URL ссылки:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("URL изображения:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const ToolButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
        active ? "bg-gray-200 text-blue-600" : "text-gray-600"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Заголовок"
        >
          <Heading2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Жирный"
        >
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Курсив"
        >
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Зачёркнутый"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolButton>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Маркированный список"
        >
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Нумерованный список"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Цитата"
        >
          <Quote className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Код"
        >
          <Code className="w-4 h-4" />
        </ToolButton>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolButton onClick={addLink} title="Ссылка">
          <LinkIcon className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={addImage} title="Изображение">
          <ImageIcon className="w-4 h-4" />
        </ToolButton>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Отменить"
        >
          <Undo className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Повторить"
        >
          <Redo className="w-4 h-4" />
        </ToolButton>
      </div>
      <EditorContent editor={editor} />
      {placeholder && !editor.getText() && (
        <p className="absolute px-4 py-3 text-gray-400 pointer-events-none">
          {placeholder}
        </p>
      )}
    </div>
  );
}
