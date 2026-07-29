import '@wangeditor/editor/dist/css/style.css'
import React, { useState, useEffect, useRef } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  uploadUrl?: string
  placeholder?: string
  height?: number
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  uploadUrl = '/api/admin/upload',
  placeholder = '请输入内容...',
  height = 400,
}) => {
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const latestValue = useRef(value)

  useEffect(() => { latestValue.current = value }, [value])

  // Sync external value changes (e.g. form reset / setFieldsValue)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHtml()
    const next = value ?? ''
    if (current !== next) {
      editor.setHtml(next)
    }
  }, [value, editor])

  useEffect(() => {
    return () => { editor?.destroy() }
  }, [editor])

  const toolbarConfig: Partial<IToolbarConfig> = {}

  const editorConfig: Partial<IEditorConfig> = {
    placeholder,
    MENU_CONF: {
      uploadImage: {
        server: uploadUrl,
        fieldName: 'file',
        maxFileSize: 50 * 1024 * 1024,
        allowedFileTypes: ['image/*'],
        customInsert(res: { data: string }, insertFn: (url: string) => void) {
          insertFn(res.data)
        },
      },
    },
  }

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #d9d9d9' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={value ?? ''}
        onCreated={setEditor}
        onChange={e => onChange?.(e.getHtml())}
        mode="default"
        style={{ height, overflowY: 'hidden' }}
      />
    </div>
  )
}

export default RichTextEditor
