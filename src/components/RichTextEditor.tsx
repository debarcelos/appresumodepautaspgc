import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Image as ImageIcon,
  List,
  ListOrdered
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          width: '100',
          height: '100',
          style: 'width: 100px; height: 100px; object-fit: contain;'
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addImage = () => {
    const url = window.prompt('Enter the URL of the image:');
    if (url && editor) {
      editor.chain().focus().setImage({ 
        src: url,
        width: 100,
        height: 100,
      }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="border-b border-gray-300 p-2 flex gap-2 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
          title="Lista não ordenada"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
          title="Lista ordenada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={addImage}
          className="p-1 rounded"
          title="Inserir imagem"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="p-2 min-h-[100px] [&_img]:w-[100px] [&_img]:h-[100px] [&_img]:object-contain" />
    </div>
  );
};

export default RichTextEditor;