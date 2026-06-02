import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

interface MailEditorProps {
  value: string;
  onChange: (html: string) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton = ({ onClick, isActive, title, children }: ToolbarButtonProps) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`px-2 py-1 rounded text-sm font-medium transition-colors border ${isActive
        ? 'bg-orange-500 text-white border-orange-500'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
      }`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => <div className="w-px h-5 bg-gray-300 mx-1" />;

export default function MailEditor({ onChange }: MailEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto;',
        },
      }),
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
    ],
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[220px] px-4 py-3 text-sm text-gray-800',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL du lien :', previousUrl ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('URL de l\'image:');
    if (!url) return;

    const width = window.prompt('Largeur (optionnel, ex: 300px ou 100%):');
    const height = window.prompt('Hauteur (optionnel, ex: auto ou 200px):');

    const attrs: any = { src: url };
    if (width) attrs.width = width;
    if (height) attrs.height = height;

    editor.chain().focus().setImage(attrs).run();
  };

  // Fonction pour augmenter la taille de l'image sélectionnée
  const increaseImageSize = () => {
    const { node } = editor.state.selection.$anchor.parent;
    if (node && node.type.name === 'image') {
      const currentWidth = node.attrs.width || '100%';
      let newWidth = currentWidth;
      
      if (typeof currentWidth === 'string' && currentWidth.includes('px')) {
        const num = parseInt(currentWidth);
        newWidth = (num + 50) + 'px';
      }
      
      editor.chain().focus().updateAttributes('image', { width: newWidth }).run();
    }
  };

  // Fonction pour diminuer la taille de l'image sélectionnée
  const decreaseImageSize = () => {
    const { node } = editor.state.selection.$anchor.parent;
    if (node && node.type.name === 'image') {
      const currentWidth = node.attrs.width || '100%';
      let newWidth = currentWidth;
      
      if (typeof currentWidth === 'string' && currentWidth.includes('px')) {
        const num = parseInt(currentWidth);
        if (num > 50) {
          newWidth = (num - 50) + 'px';
        }
      }
      
      editor.chain().focus().updateAttributes('image', { width: newWidth }).run();
    }
  };

  const isImageSelected = editor.isActive('image');

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* ── Barre d'outils ── */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
        {/* Style de titre */}
        <select
          className="text-xs border border-gray-300 rounded px-1 py-1 bg-white text-gray-700"
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(val) as 1 | 2 | 3 }).run();
          }}
          value={
            editor.isActive('heading', { level: 1 })
              ? '1'
              : editor.isActive('heading', { level: 2 })
                ? '2'
                : editor.isActive('heading', { level: 3 })
                  ? '3'
                  : 'p'
          }
        >
          <option value="p">Paragraphe</option>
          <option value="1">Titre 1</option>
          <option value="2">Titre 2</option>
          <option value="3">Titre 3</option>
        </select>

        <ToolbarDivider />

        <ToolbarButton
          title="Gras"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          title="Italique"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          title="Souligné"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          title="Barré"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <ToolbarDivider />
        <div className="flex items-center gap-1">
          <label htmlFor="text-color" className="text-xs font-medium text-gray-700">
            Couleur :
          </label>
          <input
            id="text-color"
            type="color"
            defaultValue="#000000"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Changer la couleur du texte"
          />
          <button
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100"
            title="Réinitialiser la couleur"
          >
            ✕
          </button>
        </div>
        <ToolbarDivider />
        <ToolbarButton
          title="Liste à puces"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          title="Liste numérotée"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          1.
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Aligner à gauche"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
        >
          ◀
        </ToolbarButton>
        <ToolbarButton
          title="Centrer"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
        >
          ■
        </ToolbarButton>
        <ToolbarButton
          title="Aligner à droite"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
        >
          ▶
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Insérer un lien" onClick={setLink} isActive={editor.isActive('link')}>
          🔗
        </ToolbarButton>
        <ToolbarButton title="Insérer une image" onClick={addImage}>
          🖼️
        </ToolbarButton>

        {/* Boutons de redimensionnement d'image */}
        {isImageSelected && (
          <>
            <ToolbarButton
              title="Augmenter la taille de l'image"
              onClick={increaseImageSize}
            >
              🔍➕
            </ToolbarButton>
            <ToolbarButton
              title="Diminuer la taille de l'image"
              onClick={decreaseImageSize}
            >
              🔍➖
            </ToolbarButton>
          </>
        )}

        <ToolbarButton
          title="Bloc de citation"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
        >
          "
        </ToolbarButton>
        <ToolbarButton
          title="Code inline"
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
        >
          {'</>'}
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Annuler" onClick={() => editor.chain().focus().undo().run()}>
          ↩
        </ToolbarButton>
        <ToolbarButton title="Rétablir" onClick={() => editor.chain().focus().redo().run()}>
          ↪
        </ToolbarButton>
      </div>

      {/* ── Zone d'édition ── */}
      <EditorContent editor={editor} />
    </div>
  );
}
