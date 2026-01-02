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
  variant?: 'dark' | 'light'  // dark = white text, light = dark text
}

// Custom code block with copy button
function CodeBlock({ 
  language, 
  children,
  variant = 'dark'
}: { 
  language: string | undefined
  children: string
  variant?: 'dark' | 'light'
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isDark = variant === 'dark'

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden">
      {/* Language label & copy button */}
      <div className={cn(
        "flex items-center justify-between px-3 py-1.5 border-b",
        isDark ? "bg-white/5 border-white/10" : "bg-neutral-100 border-neutral-200"
      )}>
        <span className={cn(
          "text-xs font-mono",
          isDark ? "text-white/40" : "text-neutral-500"
        )}>
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 text-xs px-2 py-1 rounded',
            'transition-all duration-200',
            copied 
              ? 'text-green-500 bg-green-500/10' 
              : isDark 
                ? 'text-white/40 hover:text-white/70 hover:bg-white/10'
                : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200'
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
          background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.85)',
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
  className,
  variant = 'dark'
}: MarkdownRendererProps) {
  const isDark = variant === 'dark'
  
  // Color classes based on variant
  const colors = {
    heading: isDark ? 'text-white' : 'text-neutral-900',
    text: isDark ? 'text-white/90' : 'text-neutral-800',
    textMuted: isDark ? 'text-white/80' : 'text-neutral-600',
    textSubtle: isDark ? 'text-white/70' : 'text-neutral-500',
    code: isDark ? 'text-cyan-300 bg-white/10' : 'text-pink-600 bg-neutral-100',
    link: isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-500',
    border: isDark ? 'border-white/10' : 'border-neutral-200',
    borderAccent: isDark ? 'border-cyan-500/50' : 'border-blue-400',
    tableBg: isDark ? 'bg-white/5' : 'bg-neutral-50',
  }

  const components: Components = {
    // Code blocks and inline code
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : undefined
      const codeString = String(children).replace(/\n$/, '')
      
      // Check if it's a code block (has language or newlines)
      const isCodeBlock = match || codeString.includes('\n')

      if (isCodeBlock) {
        return <CodeBlock language={language} variant={variant}>{codeString}</CodeBlock>
      }

      return (
        <code
          className={cn("px-1.5 py-0.5 rounded font-mono text-[0.85em]", colors.code)}
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
      return <p className={cn("mb-3 last:mb-0 leading-relaxed", colors.text)}>{children}</p>
    },

    // Headers
    h1({ children }) {
      return <h1 className={cn("text-xl font-bold mb-3 mt-4 first:mt-0", colors.heading)}>{children}</h1>
    },
    h2({ children }) {
      return <h2 className={cn("text-lg font-bold mb-2 mt-3 first:mt-0", colors.heading)}>{children}</h2>
    },
    h3({ children }) {
      return <h3 className={cn("text-base font-semibold mb-2 mt-3 first:mt-0", colors.heading)}>{children}</h3>
    },

    // Lists
    ul({ children }) {
      return <ul className={cn("list-disc list-inside mb-3 space-y-1 pl-1", colors.text)}>{children}</ul>
    },
    ol({ children }) {
      return <ol className={cn("list-decimal list-inside mb-3 space-y-1 pl-1", colors.text)}>{children}</ol>
    },
    li({ children }) {
      return <li className={colors.text}>{children}</li>
    },

    // Links
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("underline underline-offset-2 transition-colors", colors.link)}
        >
          {children}
        </a>
      )
    },

    // Blockquotes
    blockquote({ children }) {
      return (
        <blockquote className={cn("border-l-2 pl-3 my-3 italic", colors.borderAccent, colors.textSubtle)}>
          {children}
        </blockquote>
      )
    },

    // Horizontal rule
    hr() {
      return <hr className={cn("my-4", colors.border)} />
    },

    // Strong/Bold
    strong({ children }) {
      return <strong className={cn("font-semibold", colors.heading)}>{children}</strong>
    },

    // Emphasis/Italic
    em({ children }) {
      return <em className={cn("italic", colors.text)}>{children}</em>
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
      return <thead className={colors.tableBg}>{children}</thead>
    },
    tbody({ children }) {
      return <tbody className={cn("divide-y", colors.border)}>{children}</tbody>
    },
    tr({ children }) {
      return <tr className={cn("border-b", colors.border)}>{children}</tr>
    },
    th({ children }) {
      return (
        <th className={cn("px-3 py-2 text-left font-semibold", colors.text)}>
          {children}
        </th>
      )
    },
    td({ children }) {
      return <td className={cn("px-3 py-2", colors.textMuted)}>{children}</td>
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
