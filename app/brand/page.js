import '@/styles/Brand.css';
export const metadata = { title: 'Brand — OJOs' };

const BLUE_SCALE = [
  { name: '--blue-950', hex: '#001266', label: '950' },{ name: '--blue-900', hex: '#001a8a', label: '900' },
  { name: '--blue-800', hex: '#002399', label: '800' },{ name: '--blue',     hex: '#002fa7', label: 'base' },
  { name: '--blue-600', hex: '#1a47bf', label: '600' },{ name: '--blue-400', hex: '#4d72d6', label: '400' },
  { name: '--blue-200', hex: '#a8bef0', label: '200' },{ name: '--blue-100', hex: '#d4e0f8', label: '100' },
  { name: '--blue-50',  hex: '#e8edff', label: '50'  },
];
const NEUTRAL_SCALE = [
  { name: '--neutral-950', hex: '#0a0a0a', label: '950' },{ name: '--neutral-800', hex: '#1f2937', label: '800' },
  { name: '--neutral-700', hex: '#374151', label: '700' },{ name: '--neutral-500', hex: '#6b7280', label: '500' },
  { name: '--neutral-300', hex: '#d1d5db', label: '300' },{ name: '--neutral-200', hex: '#e5e7eb', label: '200' },
  { name: '--neutral-100', hex: '#f3f4f6', label: '100' },{ name: '--neutral-50',  hex: '#fafafa', label: '50'  },
  { name: '--neutral-0',   hex: '#ffffff', label: '0'   },
];
const ACCENT_COLORS = [
  { name: '--ink',   hex: '#0D1B3E', label: 'Ink',   note: 'Dark sections, overlays' },
  { name: '--gold',  hex: '#C9A447', label: 'Gold',  note: 'Accent, highlights' },
  { name: '--fog',   hex: '#EEF1FA', label: 'Fog',   note: 'Layered backgrounds' },
  { name: '--slate', hex: '#64748B', label: 'Slate', note: 'Tonal blue-gray' },
  { name: '--sage',  hex: '#4A7C59', label: 'Sage',  note: 'Success, positive' },
  { name: '--clay',  hex: '#B85C38', label: 'Clay',  note: 'Errors, warmth' },
  { name: '--dusk',  hex: '#8B95C9', label: 'Dusk',  note: 'Decorative, secondary' },
];
const TYPE_SCALE = [
  { label: 'Display XL',   spec: 'Unique  700  48px  −0.02em', size: '48px', weight: 700, style: 'normal', font: 'var(--font-unique), system-ui, sans-serif' },
  { label: 'Display L',    spec: 'Unique  700  36px  −0.01em', size: '36px', weight: 700, style: 'normal', font: 'var(--font-unique), system-ui, sans-serif' },
  { label: 'Display M',    spec: 'Unique  600  30px  −0.01em', size: '30px', weight: 600, style: 'normal', font: 'var(--font-unique), system-ui, sans-serif' },
  { label: 'Display S',    spec: 'Unique  400  24px  +0.22em', size: '24px', weight: 400, style: 'normal', font: 'var(--font-unique), system-ui, sans-serif', tracking: '0.22em' },
  { label: 'Display XS',   spec: 'Unique  300  18px  +0.08em', size: '18px', weight: 300, style: 'normal', font: 'var(--font-unique), system-ui, sans-serif', tracking: '0.08em' },
  { label: 'Editorial XL', spec: 'Fraunces  300i  36px  opsz:144',  size: '36px', weight: 300, style: 'italic', font: '"Fraunces", Georgia, serif', opsz: 144 },
  { label: 'Editorial M',  spec: 'Fraunces  400   24px  opsz:72',   size: '24px', weight: 400, style: 'normal', font: '"Fraunces", Georgia, serif', opsz: 72 },
  { label: 'Editorial S',  spec: 'Fraunces  300i  18px  opsz:9',    size: '18px', weight: 300, style: 'italic', font: '"Fraunces", Georgia, serif', opsz: 9 },
  { label: 'Body L',       spec: 'Inter  400   18px  normal',       size: '18px', weight: 400, style: 'normal', font: 'Inter, sans-serif' },
  { label: 'Body M',       spec: 'Inter  400   16px  normal',       size: '16px', weight: 400, style: 'normal', font: 'Inter, sans-serif' },
  { label: 'Body S',       spec: 'Inter  400   14px  normal',       size: '14px', weight: 400, style: 'normal', font: 'Inter, sans-serif' },
  { label: 'Mono M',       spec: 'DM Mono  400   14px  normal',     size: '14px', weight: 400, style: 'normal', font: '"DM Mono", monospace' },
  { label: 'Mono S',       spec: 'DM Mono  300   12px  normal',     size: '12px', weight: 300, style: 'normal', font: '"DM Mono", monospace' },
  { label: 'Label',        spec: 'Inter  500   12px  +0.12em',      size: '12px', weight: 500, style: 'normal', font: 'Inter, sans-serif', tracking: '0.12em' },
  { label: 'Overline',     spec: 'Inter  600   11px  +0.22em  upper',size:'11px', weight: 600, style: 'normal', font: 'Inter, sans-serif', tracking: '0.22em', upper: true },
];

export default function Brand() {
  return (
    <div className="brand">
      <header className="brand__header">
        <p className="brand__eyebrow">OJOs — Brand Identity</p>
        <h1 className="brand__title"><span className="wm-o">O</span><span className="wm-j">J</span><span className="wm-o">O</span><span className="wm-s">s</span></h1>
        <p className="brand__subtitle">see eye to eye</p>
      </header>

      <section className="brand__section">
        <p className="brand__section-title">Wordmark</p>
        <div className="brand__wordmark-specimen">
          <div><div className="brand__wordmark-large"><span className="wm-o">O</span><span className="wm-j">J</span><span className="wm-o">O</span><span className="wm-s">s</span></div></div>
          <div><div className="brand__wordmark-small"><span className="wm-o">O</span><span className="wm-j">J</span><span className="wm-o">O</span><span className="wm-s">s</span></div></div>
          <div className="brand__wordmark-rules">
            <div className="brand__wordmark-rule"><strong>O</strong> Unique 700 Upright</div>
            <div className="brand__wordmark-rule"><strong>J</strong> Unique 400 Upright</div>
            <div className="brand__wordmark-rule"><strong>O</strong> Unique 700 Upright</div>
            <div className="brand__wordmark-rule"><strong>s</strong> Unique 700 Upright</div>
          </div>
        </div>
        <div className="brand__tagline-specimen">
          <p className="brand__tagline-text">see eye to eye</p>
          <p className="brand__note">Unique 300 — letter-spacing: 0.22em — lowercase</p>
        </div>
      </section>

      <section className="brand__section">
        <p className="brand__section-title">Color</p>
        <div className="brand__palette">
          <div>
            <p className="brand__palette-group-label">Klein Blue — Primary</p>
            <div className="brand__swatches">
              {BLUE_SCALE.map(s => <div key={s.name} className="brand__swatch"><div className="brand__swatch-color" style={{ background: s.hex }} /><div className="brand__swatch-info"><span className="brand__swatch-name">{s.label}</span><span className="brand__swatch-hex">{s.hex}</span></div></div>)}
            </div>
          </div>
          <div>
            <p className="brand__palette-group-label">Accent</p>
            <div className="brand__swatches brand__swatches--accent">
              {ACCENT_COLORS.map(s => <div key={s.name} className="brand__swatch"><div className="brand__swatch-color" style={{ background: s.hex }} /><div className="brand__swatch-info"><span className="brand__swatch-name">{s.label}</span><span className="brand__swatch-hex">{s.hex}</span><span className="brand__swatch-note">{s.note}</span></div></div>)}
            </div>
          </div>
          <div>
            <p className="brand__palette-group-label">Neutral</p>
            <div className="brand__swatches">
              {NEUTRAL_SCALE.map(s => <div key={s.name} className="brand__swatch"><div className="brand__swatch-color" style={{ background: s.hex, border: s.hex === '#ffffff' ? '1px solid #e5e7eb' : 'none' }} /><div className="brand__swatch-info"><span className="brand__swatch-name">{s.label}</span><span className="brand__swatch-hex">{s.hex}</span></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="brand__section">
        <p className="brand__section-title">Typography</p>
        {TYPE_SCALE.map(t => (
          <div key={t.label} className="brand__type-row">
            <div className="brand__type-meta"><span className="brand__type-label">{t.label}</span><span className="brand__type-spec">{t.spec}</span></div>
            <span className="brand__type-sample" style={{ fontFamily: t.font, fontSize: t.size, fontWeight: t.weight, fontStyle: t.style, letterSpacing: t.tracking || 'normal', textTransform: t.upper ? 'uppercase' : 'none', lineHeight: 1.2, fontVariationSettings: t.opsz ? `'opsz' ${t.opsz}` : undefined }}>
              OJOs — see eye to eye
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
