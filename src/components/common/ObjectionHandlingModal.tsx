import React, { useState, useMemo } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { OBJECTION_HANDLING_LIST, type ObjectionItem } from '@/constants/salesFunnelData'
import { createWhatsAppLink } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Search, Copy, Check, MessageSquare, ShieldCheck, Sparkles, Filter } from 'lucide-react'

interface ObjectionHandlingModalProps {
  isOpen: boolean
  onClose: () => void
  leadPhone?: string
  leadName?: string
  onSelectScript?: (script: string) => void
}

const CATEGORIES = [
  'All',
  '💰 फी आणि पैसे',
  '⏰ वेळ आणि टाइमिंग',
  '🛡️ फ्रॉड / विश्वास',
  '👨‍👩‍👦 पालक आणि निर्णय',
  '📱 कौशल्य आणि काम',
] as const

export const ObjectionHandlingModal: React.FC<ObjectionHandlingModalProps> = ({
  isOpen,
  onClose,
  leadPhone,
  leadName,
  onSelectScript,
}) => {
  const { success } = useToast()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredList = useMemo(() => {
    return OBJECTION_HANDLING_LIST.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory
      const s = search.toLowerCase().trim()
      const matchesSearch =
        !s ||
        item.objection.toLowerCase().includes(s) ||
        item.responseMr.toLowerCase().includes(s) ||
        item.keyPoint.toLowerCase().includes(s)
      return matchesCategory && matchesSearch
    })
  }, [search, selectedCategory])

  const handleCopy = (item: ObjectionItem) => {
    navigator.clipboard.writeText(item.responseMr)
    setCopiedId(item.id)
    success('Script Copied', 'Marathi response script copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2500)
    if (onSelectScript) {
      onSelectScript(item.responseMr)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="🛡️ मराठी Objection Handling Cheatsheet"
      description={
        leadName
          ? `Candidates चे प्रश्न आणि शंका दूर करण्यासाठी तयार Marathi Scripts (${leadName} साठी).`
          : 'Course आणि Workshop विक्री दरम्यान येणाऱ्या सर्व शंकांवर तयार Marathi Scripts.'
      }
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Search & Filter Header */}
        <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search objection (e.g. पैसे, वेळ, फ्रॉड, पालक, काम, अनुभव)..."
              className="w-full text-xs h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs font-medium"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        {filteredList.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">कोणतीही स्क्रिप्ट सापडली नाही</p>
            <p className="text-[11px] text-slate-400 mt-1">दुसरा कीवर्ड सर्च करून पहा.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredList.map((item) => {
              const waLink = leadPhone
                ? createWhatsAppLink(leadPhone, item.responseMr)
                : undefined

              const isCopied = copiedId === item.id

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-4 shadow-2xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          {item.keyPoint}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                        ❓ &ldquo;{item.objection}&rdquo;
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant={isCopied ? 'success' : 'outline'}
                        onClick={() => handleCopy(item)}
                        className="text-[11px] h-7 px-2.5"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 text-white" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy Script
                          </>
                        )}
                      </Button>

                      {leadPhone && waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Send
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Marathi Response Preview Box */}
                  <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line select-text">
                    {item.responseMr}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing <strong>{filteredList.length}</strong> of{' '}
            {OBJECTION_HANDLING_LIST.length} objection scripts
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Cheatsheet
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
