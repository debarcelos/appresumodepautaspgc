import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean'],
      ['highlight']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'color', 'background',
    'highlight'
  ];

  return (
    <div className="rich-text-editor">
      <style>
        {`
          .ql-editor {
            min-height: 200px;
          }
          .ql-toolbar .ql-highlight:after {
            content: "Realçar";
            margin-left: 5px;
          }
          .ql-toolbar .ql-highlight {
            width: auto;
          }
          .ql-container {
            font-size: inherit;
          }
        `}
      </style>
      <ReactQuill
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        theme="snow"
      />
    </div>
  );
};

export default RichTextEditor;