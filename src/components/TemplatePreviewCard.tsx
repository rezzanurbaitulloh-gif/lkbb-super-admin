"use client"

// Kartu pratinjau visual template: mock mini situs dari theme_tokens + varian.
// Murni presentasional — tidak membaca event lain, tidak ada efek samping.
export function TemplatePreviewCard({ template, onApply }: {
  template: {
    id?: string
    name: string
    description?: string
    category?: string
    layout_variant?: string
    hero_variant?: string
    theme_tokens?: { colors?: Record<string, string>; fonts?: Record<string, string> }
    is_active?: boolean
  }
  onApply?: (t: any) => void
}) {
  const c = template.theme_tokens?.colors || {}
  const f = template.theme_tokens?.fonts || {}
  const bg = c.background || "#0A0A09"
  const surface = c.surface || "#141412"
  const text = c.text || "#F2F0E9"
  const muted = c.muted || "#92918C"
  const primary = c.primary || "#D9FF3F"
  const border = c.border || "#292927"
  const hero = template.hero_variant || "default"

  return (
    <div className="overflow-hidden rounded-[16px] border border-white/[0.08] bg-white/[0.02]">
      {/* Mock browser */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-2 text-[10px] text-muted-foreground">{template.layout_variant || "default"} / {hero}</span>
      </div>
      {/* Mock situs */}
      <div style={{ background: bg, fontFamily: f.body || "inherit" }}>
        {/* navbar */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full" style={{ background: primary }} />
            <span className="text-[11px] font-black tracking-wide" style={{ color: text, fontFamily: f.display || "inherit" }}>LKBB</span>
          </div>
          <div className="flex gap-2">
            <span className="inline-block h-1.5 w-8 rounded-full" style={{ background: muted, opacity: 0.5 }} />
            <span className="inline-block h-1.5 w-8 rounded-full" style={{ background: muted, opacity: 0.5 }} />
            <span className="inline-block h-4 w-12 rounded-full" style={{ background: primary }} />
          </div>
        </div>
        {/* hero */}
        {hero === "centered" ? (
          <div className="px-4 py-6 text-center">
            <div className="mx-auto h-2.5 w-3/4 rounded-full" style={{ background: text }} />
            <div className="mx-auto mt-2 h-2.5 w-1/2 rounded-full" style={{ background: primary }} />
            <div className="mx-auto mt-2 h-1.5 w-2/3 rounded-full" style={{ background: muted, opacity: 0.6 }} />
            <div className="mx-auto mt-3 h-6 w-24 rounded-full" style={{ background: primary }} />
          </div>
        ) : hero === "fullscreen" ? (
          <div className="px-4 py-8" style={{ background: `linear-gradient(135deg, ${surface}, ${bg})` }}>
            <div className="h-3 w-2/3 rounded-full" style={{ background: text }} />
            <div className="mt-2 h-3 w-1/2 rounded-full" style={{ background: primary }} />
            <div className="mt-3 flex gap-2">
              <span className="inline-block h-6 w-20 rounded-full" style={{ background: primary }} />
              <span className="inline-block h-6 w-20 rounded-full" style={{ border: `1px solid ${border}` }} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 py-5">
            <div>
              <div className="h-2.5 w-full rounded-full" style={{ background: text }} />
              <div className="mt-2 h-2.5 w-4/5 rounded-full" style={{ background: primary }} />
              <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: muted, opacity: 0.6 }} />
              <div className="mt-3 h-6 w-20 rounded-full" style={{ background: primary }} />
            </div>
            <div className="rounded-lg" style={{ background: surface, border: `1px solid ${border}`, minHeight: 64 }} />
          </div>
        )}
        {/* cards */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg p-2" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="h-8 rounded" style={{ background: muted, opacity: 0.35 }} />
              <div className="mt-1.5 h-1.5 w-4/5 rounded-full" style={{ background: text, opacity: 0.8 }} />
              <div className="mt-1 h-4 w-10 rounded-full" style={{ background: primary }} />
            </div>
          ))}
        </div>
      </div>
      {/* Meta + aksi */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-black">{template.name}</div>
            <div className="truncate text-xs text-muted-foreground">{template.category} • {template.is_active === false ? "nonaktif" : "aktif"}</div>
          </div>
          {onApply && (
            <button onClick={() => onApply(template)} className="h-9 shrink-0 rounded-full bg-white px-4 text-xs font-bold text-black">
              Pratinjau & Terapkan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
