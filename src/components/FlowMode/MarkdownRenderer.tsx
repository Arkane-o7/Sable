import { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Components } from 'react-markdown'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Custom code block with copy button
function CodeBlock({ 
  language, 
  children 
}: { 
  language: string | undefined
  children: string 
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden">
      {/* Language label & copy button */}
      <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 border-b border-white/10">
        <span className="text-xs text-white/40 font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 text-xs px-2 py-1 rounded',
            'transition-all duration-200',
            copied 
              ? 'text-green-400 bg-green-500/10' 
              : 'text-white/40 hover:text-white/70 hover:bg-white/10'
          )}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code content */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          fontSize: '0.8rem',
          lineHeight: 1.5,
        }}
        codeTagProps={{
          style: {
            fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
          }
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ 
  content, 
  className 
}: MarkdownRendererProps) {
  const components: Components = {
    // Code blocks and inline code
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : undefined
      const codeString = String(children).replace(/\n$/, '')
      
      // Check if it's a code block (has language or newlines)
      const isCodeBlock = match || codeString.includes('\n')

      if (isCodeBlock) {
        return <CodeBlock language={language}>{codeString}</CodeBlock>
      }

      return (
        <code
          className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[0.85em]"
          {...props}
        >
          {children}
        </code>
      )
    },

    // Pre wrapper - let code handle everything
    pre({ children }) {
      return <>{children}</>
    },

    // Paragraphs
    p({ children }) {
      return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
    },

    // Headers
    h1({ children }) {
      return <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-white">{children}</h1>
    },
    h2({ children }) {
      return <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0 text-white">{children}</h2>
    },
    h3({ children }) {
      return <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-white">{children}</h3>
    },

    // Lists
    ul({ children }) {
      return <ul className="list-disc list-inside mb-3 space-y-1 pl-1">{children}</ul>
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside mb-3 space-y-1 pl-1">{children}</ol>
    },
    li({ children }) {
      return <li className="text-white/90">{children}</li>
    },

    // Links
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
        >
          {children}
        </a>
      )
    },

    // Blockquotes
    blockquote({ children }) {
      return (
        <blockquote className="border-l-2 border-cyan-500/50 pl-3 my-3 text-white/70 italic">
          {children}
        </blockquote>
      )
    },

    // Horizontal rule
    hr() {
      return <hr className="my-4 border-white/10" />
    },

    // Strong/Bold
    strong({ children }) {
      return <strong className="font-semibold text-white">{children}</strong>
    },

    // Emphasis/Italic
    em({ children }) {
      return <em className="italic text-white/90">{children}</em>
    },

    // Tables
    table({ children }) {
      return (
        <div className="overflow-x-auto my-3">
          <table className="min-w-full border-collapse text-sm">
            {children}
          </table>
        </div>
      )
    },
    thead({ children }) {
      return <thead className="bg-white/5">{children}</thead>
    },
    tbody({ children }) {
      return <tbody className="divide-y divide-white/10">{children}</tbody>
    },
    tr({ children }) {
      return <tr className="border-b border-white/10">{children}</tr>
    },
    th({ children }) {
      return (
        <th className="px-3 py-2 text-left font-semibold text-white/90">
          {children}
        </th>
      )
    },
    td({ children }) {
      return <td className="px-3 py-2 text-white/80">{children}</td>
    },
  }

  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
