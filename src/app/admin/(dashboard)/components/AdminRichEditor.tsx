"use client";

import { useEffect, useRef, useState } from "react";

type AdminRichEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type UploadResponse = {
  url?: string;
  error?: string;
};

export default function AdminRichEditor({ value, onChange }: AdminRichEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  const syncValue = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const formatBlock = (tag: string) => {
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, tag);
    syncValue();
  };

  const addLink = () => {
    const url = window.prompt("Enter link URL");
    if (!url) return;
    runCommand("createLink", url);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as UploadResponse;

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Image upload failed");
      }

      runCommand("insertImage", data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="admin-editor">
      <div className="admin-editor-toolbar">
        <button type="button" onClick={() => formatBlock("h2")} className="admin-editor-btn">H2</button>
        <button type="button" onClick={() => formatBlock("h3")} className="admin-editor-btn">H3</button>
        <button type="button" onClick={() => formatBlock("p")} className="admin-editor-btn">P</button>
        <button type="button" onClick={() => runCommand("bold")} className="admin-editor-btn">B</button>
        <button type="button" onClick={() => runCommand("italic")} className="admin-editor-btn">I</button>
        <button type="button" onClick={() => runCommand("insertUnorderedList")} className="admin-editor-btn">List</button>
        <button type="button" onClick={() => runCommand("insertOrderedList")} className="admin-editor-btn">1. List</button>
        <button type="button" onClick={addLink} className="admin-editor-btn">Link</button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="admin-editor-btn">
          {uploading ? "Uploading..." : "Image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file);
          }}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="admin-editor-surface"
        onInput={syncValue}
        onBlur={syncValue}
        suppressContentEditableWarning
      />
    </div>
  );
}
