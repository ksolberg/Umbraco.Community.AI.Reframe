// ui.jsx — Modal shell, ratio picker, mode toggle, action bar.
// Designed to feel at home in a content-tool / Studio context but with
// its own visual personality. Original — not copying any specific kit.

// ─── Icons (tiny inline SVGs) ──────────────────────────────────────
const Icon = {
  close: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  check: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  alert: (p) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M8 1.5L15 14H1L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6V9.5M8 11.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  refresh: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M11.5 7A4.5 4.5 0 1 1 10 3.5M11.5 1.5V4H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  crop: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M3.5 1V11H13.5M1 3.5H11V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  spark: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M7 1L8.2 5.3L12.5 6.5L8.2 7.7L7 12L5.8 7.7L1.5 6.5L5.8 5.3L7 1Z" fill="currentColor" />
    </svg>
  ),
  swap: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M1.5 4.5H10.5M10.5 4.5L8 2M10.5 4.5L8 7M12.5 9.5H3.5M3.5 9.5L6 7M3.5 9.5L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  image: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <rect x="1.5" y="2.5" width="11" height="9" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="5" cy="5.5" r="1" fill="currentColor" />
      <path d="M2 10L5.5 7L8 9L10 7.5L12.5 10.5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  ),
};
window.Icon = Icon;

// ─── Aspect ratio chip ─────────────────────────────────────────────
// The chip is a literal scaled rectangle of the ratio — quicker to
// scan than just a "16:9" string.
function RatioChip({ w, h, selected, onClick, possibleCrop }) {
  // Fit chip preview into a 36×24 box
  const maxW = 30, maxH = 22;
  const s = Math.min(maxW / w, maxH / h);
  const pw = Math.max(6, w * s);
  const ph = Math.max(6, h * s);
  return (
    <button
      onClick={onClick}
      className={'rf-chip' + (selected ? ' is-selected' : '')}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px 7px 8px',
        borderRadius: 6,
        border: selected ? '1.5px solid #1f1f1f' : '1px solid #e5e4df',
        background: selected ? '#fafaf7' : '#fff',
        color: '#1f1f1f',
        cursor: 'pointer',
        fontFamily: 'var(--rf-mono)',
        fontSize: 12,
        letterSpacing: '.02em',
        position: 'relative',
        minWidth: 76,
      }}
    >
      <span style={{
        width: 36, height: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          width: pw, height: ph,
          background: selected ? '#1f1f1f' : '#d1d0cb',
          borderRadius: 1,
        }} />
      </span>
      <span>{w}:{h}</span>
      {!possibleCrop && (
        <span title="Outpaint only" style={{
          position: 'absolute', top: -4, right: -4,
          width: 12, height: 12, borderRadius: 999,
          background: '#ec4899',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 8, fontWeight: 700,
        }}>✦</span>
      )}
    </button>
  );
}

// ─── Mode toggle (Crop / Outpaint) ─────────────────────────────────
function ModeToggle({ mode, onChange, cropPossible }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
    }}>
      <ModeCard
        active={mode === 'crop'}
        disabled={!cropPossible}
        onClick={() => cropPossible && onChange('crop')}
        icon={<Icon.crop />}
        title="Crop"
        meta="Instant · Free"
        body="Cut the image to a smaller frame. Geometric only."
      />
      <ModeCard
        active={mode === 'outpaint'}
        onClick={() => onChange('outpaint')}
        icon={<Icon.spark />}
        accent
        title="Outpaint"
        meta="~12s · 4 credits"
        body="AI generates new pixels to extend the image."
      />
    </div>
  );
}

function ModeCard({ active, disabled, onClick, icon, title, meta, body, accent }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        textAlign: 'left',
        padding: '12px 12px 10px',
        borderRadius: 8,
        border: active ? '1.5px solid #1f1f1f' : '1px solid #e5e4df',
        background: active ? '#fafaf7' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        position: 'relative',
        font: 'inherit',
        color: '#1f1f1f',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: accent ? '#ec4899' : '#1f1f1f',
          color: '#fff',
        }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
        {active && (
          <span style={{
            marginLeft: 'auto', width: 16, height: 16, borderRadius: 999,
            background: '#1f1f1f', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.check />
          </span>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--rf-mono)', fontSize: 10.5, letterSpacing: '.04em',
        textTransform: 'uppercase', color: accent ? '#ec4899' : '#6b6b6b',
      }}>{meta}</div>
      <div style={{ fontSize: 11.5, color: '#6b6b6b', lineHeight: 1.4 }}>{body}</div>
      {disabled && (
        <div style={{
          position: 'absolute', top: 6, right: 8,
          fontFamily: 'var(--rf-mono)', fontSize: 9.5, letterSpacing: '.05em',
          color: '#a0a0a0', textTransform: 'uppercase',
        }}>Not possible</div>
      )}
    </button>
  );
}

// ─── Buttons ───────────────────────────────────────────────────────
function Btn({ children, variant = 'ghost', onClick, icon, style = {}, disabled }) {
  const variants = {
    primary: { background: '#1f1f1f', color: '#fff', border: '1px solid #1f1f1f' },
    ghost:   { background: '#fff', color: '#1f1f1f', border: '1px solid #d1d0cb' },
    subtle:  { background: 'transparent', color: '#1f1f1f', border: '1px solid transparent' },
    danger:  { background: '#fff', color: '#b91c1c', border: '1px solid #fecaca' },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px',
        borderRadius: 6,
        font: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        ...variants[variant],
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
window.Btn = Btn;

// ─── Toolbar pills (indicator picker, view options) ────────────────
function PillGroup({ value, options, onChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      padding: 2,
      border: '1px solid #e5e4df',
      borderRadius: 7,
      background: '#fafaf7',
      gap: 0,
    }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '5px 10px',
            border: 0,
            background: value === o.value ? '#fff' : 'transparent',
            color: '#1f1f1f',
            fontSize: 11.5,
            fontWeight: value === o.value ? 600 : 500,
            borderRadius: 5,
            cursor: 'pointer',
            font: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            boxShadow: value === o.value ? '0 1px 2px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)' : 'none',
          }}
        >
          {o.dot && <span style={{
            width: 7, height: 7, borderRadius: 999,
            background: o.dot,
          }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
window.PillGroup = PillGroup;

// ─── Modal shell ───────────────────────────────────────────────────
function Modal({ width = 1060, height = 700, children, fieldPath = 'hero.image' }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#1a1a1a',
      backgroundImage:
        'radial-gradient(circle at 30% 20%, rgba(255,255,255,.04) 0, transparent 40%),' +
        'radial-gradient(circle at 70% 80%, rgba(255,255,255,.03) 0, transparent 40%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Faint hint of studio chrome behind */}
      <StudioChromeHint />
      <div style={{
        position: 'relative',
        width, height,
        background: '#fafaf7',
        borderRadius: 10,
        boxShadow: '0 20px 60px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <ModalHeader fieldPath={fieldPath} />
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
window.Modal = Modal;

function ModalHeader({ fieldPath }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '14px 18px',
      borderBottom: '1px solid #e5e4df',
      background: '#fff',
      gap: 12,
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 6,
        background: '#1f1f1f', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--rf-mono)', fontWeight: 700, fontSize: 13,
      }}>R</span>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Reframe</div>
        <div style={{ fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b' }}>
          {fieldPath}
        </div>
      </div>
      <div style={{
        marginLeft: 12,
        padding: '3px 8px',
        background: '#f5f4f0',
        border: '1px solid #e5e4df',
        borderRadius: 4,
        fontSize: 11,
        color: '#6b6b6b',
        fontFamily: 'var(--rf-mono)',
        letterSpacing: '.02em',
      }}>SANITY · PLUGIN</div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'transparent', border: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6b6b6b',
        }}><Icon.close /></button>
      </div>
    </div>
  );
}

// Light hint of Studio chrome behind the modal — gives the modal a place
// to live without us having to design or copy a specific Studio's UI.
function StudioChromeHint() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#262624',
      pointerEvents: 'none',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 44,
        background: '#1f1f1f',
        borderBottom: '1px solid #0f0f0f',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '0 16px',
        color: '#888',
        fontSize: 12,
      }}>
        <span style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#3a3a3a' }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#3a3a3a' }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#3a3a3a' }} />
        </span>
        <span style={{ width: 1, height: 18, background: '#333' }} />
        <span style={{ fontFamily: 'var(--rf-mono)' }}>studio.example.com</span>
      </div>
      {/* Left rail */}
      <div style={{
        position: 'absolute', top: 44, left: 0, bottom: 0,
        width: 56,
        background: '#1f1f1f',
        borderRight: '1px solid #0f0f0f',
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '12px 0',
        alignItems: 'center',
      }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{
            width: 28, height: 28, borderRadius: 6,
            background: i === 0 ? '#3a3a3a' : '#262624',
          }} />
        ))}
      </div>
      {/* Doc list */}
      <div style={{
        position: 'absolute', top: 44, left: 56, bottom: 0,
        width: 240,
        background: '#262624',
        borderRight: '1px solid #1a1a1a',
        padding: 12,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {[80, 60, 90, 70, 50, 75, 60, 85].map((w, i) => (
          <div key={i} style={{
            height: 28, borderRadius: 4,
            background: i === 2 ? '#333' : 'transparent',
            display: 'flex', alignItems: 'center', padding: '0 10px',
          }}>
            <span style={{ width: `${w}%`, height: 8, background: '#3a3a3a', borderRadius: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
window.StudioChromeHint = StudioChromeHint;

// ─── Left rail: ratio + mode + info ────────────────────────────────
function ControlsRail({ ratio, onRatio, mode, onMode, currentRatio, customX, customY, onCustom }) {
  const PRESETS = [
    { w: 16, h: 9 },
    { w: 9, h: 16 },
    { w: 1, h: 1 },
    { w: 4, h: 3 },
    { w: 3, h: 4 },
    { w: 4, h: 5 },
    { w: 21, h: 9 },
  ];
  // Whether crop is possible: target must fit INSIDE the current image
  // in both dimensions when matched to one of them. Simplified: if the
  // target ratio is "wider OR taller per axis after fitting", crop fails.
  const cropPossible = (() => {
    if (!ratio) return true;
    const [tw, th] = ratio.split(':').map(Number);
    const [cw, ch] = currentRatio.split(':').map(Number);
    const target = tw / th;
    const cur = cw / ch;
    // Crop only works when target ratio matches or sits "inside" current
    // (here: target requires neither extending). True if target===cur or
    // target is more square / less extreme on one axis we can shave.
    // For demo purposes: crop ok when target is between 0.8 and 1/0.8 of cur.
    return target / cur <= 1 && cur / target <= 2.5; // crude — see chip flags
  })();

  return (
    <div style={{
      width: 304,
      flexShrink: 0,
      borderRight: '1px solid #e5e4df',
      padding: '18px 18px 14px',
      background: '#fff',
      display: 'flex', flexDirection: 'column', gap: 18,
      overflow: 'auto',
    }}>
      <Section title="Aspect ratio" meta={`Current ${currentRatio}`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PRESETS.map((p) => {
            const key = `${p.w}:${p.h}`;
            // mark which presets force outpaint relative to currentRatio
            const [cw, ch] = currentRatio.split(':').map(Number);
            const target = p.w / p.h;
            const cur = cw / ch;
            const forcesOutpaint = Math.abs(target - cur) > 0.001 && (target > cur ? target / cur > 1.05 : cur / target > 1.05);
            return (
              <RatioChip
                key={key}
                w={p.w} h={p.h}
                selected={ratio === key}
                onClick={() => onRatio(key)}
                possibleCrop={!forcesOutpaint || (cur > target)}
              />
            );
          })}
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{
            fontFamily: 'var(--rf-mono)', fontSize: 10, letterSpacing: '.06em',
            textTransform: 'uppercase', color: '#9a9a96', marginBottom: 6,
          }}>Custom</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CustomNum value={customX} onChange={(v) => onCustom(v, customY)} />
            <span style={{ color: '#9a9a96', fontFamily: 'var(--rf-mono)' }}>:</span>
            <CustomNum value={customY} onChange={(v) => onCustom(customX, v)} />
            <button style={{
              marginLeft: 'auto',
              padding: '5px 9px',
              border: '1px solid #e5e4df',
              borderRadius: 5,
              background: '#fff',
              fontSize: 11.5,
              cursor: 'pointer',
              fontFamily: 'var(--rf-mono)',
            }}>Apply</button>
          </div>
        </div>
      </Section>

      <Section title="Mode">
        <ModeToggle mode={mode} onChange={onMode} cropPossible={cropPossible} />
      </Section>

      <Section title="Output">
        <Row label="Dimensions" value="1920 × 1080 px" />
        <Row label="From" value={`${currentRatio} · 1080 × 1080`} />
        <Row label="Source" value="hero-photo.jpg" />
      </Section>
    </div>
  );
}
window.ControlsRail = ControlsRail;

function Section({ title, meta, children }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '.08em', color: '#1f1f1f',
        }}>{title}</div>
        {meta && (
          <div style={{
            fontFamily: 'var(--rf-mono)', fontSize: 10.5, color: '#9a9a96',
            letterSpacing: '.02em',
          }}>{meta}</div>
        )}
      </div>
      {children}
    </div>
  );
}
window.Section = Section;

function Row({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '5px 0',
      fontSize: 12,
      borderBottom: '1px dashed #ececea',
    }}>
      <span style={{ color: '#6b6b6b' }}>{label}</span>
      <span style={{ fontFamily: 'var(--rf-mono)', color: '#1f1f1f' }}>{value}</span>
    </div>
  );
}
window.Row = Row;

function CustomNum({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 56,
        padding: '6px 8px',
        border: '1px solid #e5e4df',
        borderRadius: 5,
        background: '#fff',
        fontFamily: 'var(--rf-mono)',
        fontSize: 12,
        textAlign: 'center',
        color: '#1f1f1f',
      }}
    />
  );
}

// ─── Action bar (footer of the preview area) ───────────────────────
function ActionBar({ mode, onCancel, onRegenerate, onAccept, busy, regenerating }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 18px',
      borderTop: '1px solid #e5e4df',
      background: '#fff',
    }}>
      <div style={{
        fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Icon.image />
        Replaces hero.image · 1920 × 1080 · WebP
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <Btn variant="subtle" onClick={onCancel}>Cancel</Btn>
        {mode === 'outpaint' && (
          <Btn variant="ghost" icon={<Icon.refresh />} onClick={onRegenerate} disabled={busy}>
            {regenerating ? 'Regenerating…' : 'Regenerate'}
          </Btn>
        )}
        <Btn variant="primary" icon={<Icon.check />} onClick={onAccept} disabled={busy}>
          {mode === 'crop' ? 'Apply crop' : 'Accept'}
        </Btn>
      </div>
    </div>
  );
}
window.ActionBar = ActionBar;
