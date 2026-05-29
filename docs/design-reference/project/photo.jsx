// photo.jsx — the photographic placeholder + 5 indicator variants
// We render a CSS-only "photo" (sunset landscape) where the centered
// box represents the ORIGINAL pixels and the surrounding area is what
// the AI outpainted. Each indicator visually distinguishes the two.

// ─── The photo itself ──────────────────────────────────────────────
// Renders the full reframed image at `outW × outH` with the original
// square sitting centered at `origW × origH`. The composition is the
// same scene continuing through, so without the overlay the AI part
// looks plausible — that's exactly the problem the indicators solve.
function Photo({ outW, outH, origW, origH, style = {} }) {
  // Where the original sits inside the canvas.
  const ox = (outW - origW) / 2;
  const oy = (outH - origH) / 2;

  return (
    <div
      className="rf-photo"
      style={{
        position: 'relative',
        width: outW,
        height: outH,
        overflow: 'hidden',
        borderRadius: 4,
        ...style,
      }}
    >
      {/* Sky gradient — deep blue at top fading to a warm horizon */}
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'linear-gradient(to bottom,' +
          '  #0b1a36 0%,' +
          '  #1a2c52 18%,' +
          '  #3a3a6e 38%,' +
          '  #b35a47 58%,' +
          '  #e89150 68%,' +
          '  #f5b76a 72%,' +
          '  #b76a3e 76%,' +
          '  #2a2030 85%,' +
          '  #0e0a18 100%)',
      }} />
      {/* Sun bloom — anchored absolutely so it stays in the SAME world
          coordinates as the photo extends, like a real outpaint would */}
      <div style={{
        position: 'absolute',
        left: outW / 2 - outH * 0.35,
        top: outH * 0.55,
        width: outH * 0.7,
        height: outH * 0.7,
        background:
          'radial-gradient(circle, rgba(255,220,150,.95) 0%, rgba(255,180,90,.6) 18%, rgba(255,140,70,.25) 36%, transparent 60%)',
        filter: 'blur(2px)',
      }} />
      {/* A second softer glow band along the horizon */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: outH * 0.66,
        height: outH * 0.12,
        background: 'linear-gradient(to bottom, transparent, rgba(255,170,100,.4), transparent)',
      }} />
      {/* Faint mountain silhouette (a single soft band, not drawn shapes) */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: outH * 0.62,
        height: outH * 0.08,
        background:
          'linear-gradient(to bottom, rgba(20,15,30,0) 0%, rgba(20,15,30,.55) 70%, rgba(20,15,30,.85) 100%)',
        clipPath:
          'polygon(0% 100%, 0% 60%, 6% 45%, 12% 65%, 18% 30%, 26% 55%, 34% 25%, 42% 50%, 50% 20%, 58% 48%, 66% 30%, 74% 55%, 82% 35%, 90% 60%, 100% 40%, 100% 100%)',
      }} />
      {/* Water reflection — a faint horizontal banding */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: 0, height: outH * 0.3,
        background:
          'repeating-linear-gradient(to bottom, rgba(255,255,255,.04) 0px, rgba(255,255,255,.04) 1px, transparent 1px, transparent 4px),' +
          'linear-gradient(to bottom, rgba(8,8,16,.1), rgba(8,8,16,.5))',
      }} />
      {/* Subtle photo grain */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.18,
        mixBlendMode: 'overlay',
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
      }} />

      {/* Pass the original-area rect to consumers via a child render */}
      <div data-orig-region style={{
        position: 'absolute',
        left: ox, top: oy,
        width: origW, height: origH,
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Indicator variants ────────────────────────────────────────────
// Each takes the same geometry and renders an overlay that highlights
// the AI-generated region (everything OUTSIDE the centered original).
// They are designed to be informative WITHOUT obscuring the pixels.

// Helper: render the AI region as a CSS clip-path with the original
// box punched out. We use evenodd via two rectangles.
function AIShape({ outW, outH, ox, oy, origW, origH, children, style = {} }) {
  // Inset the punched-out hole by 0.5px so the seam doesn't anti-alias
  // and reveal the underlying pixels through a hairline gap.
  return (
    <div style={{
      position: 'absolute', inset: 0,
      clipPath:
        'polygon(' +
        '0 0, 100% 0, 100% 100%, 0 100%, 0 0,' +
        `${ox}px ${oy}px,` +
        `${ox}px ${oy + origH}px,` +
        `${ox + origW}px ${oy + origH}px,` +
        `${ox + origW}px ${oy}px,` +
        `${ox}px ${oy}px)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// 1. DASH — animated marching-ants stroke around the original frame.
//    Subtle outside, sharp where it meets the seam.
function IndicatorDash({ outW, outH, origW, origH }) {
  const ox = (outW - origW) / 2;
  const oy = (outH - origH) / 2;
  return (
    <>
      {/* Soft magenta vignette on the AI region — very low intensity */}
      <AIShape outW={outW} outH={outH} ox={ox} oy={oy} origW={origW} origH={origH}
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(236,72,153,0) 30%, rgba(236,72,153,.08) 70%, rgba(236,72,153,.14) 100%)',
          pointerEvents: 'none',
        }} />
      {/* The marching-ants border around the original */}
      <svg width={outW} height={outH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <rect x={ox + 0.5} y={oy + 0.5} width={origW - 1} height={origH - 1}
          fill="none" stroke="#ec4899" strokeWidth="1.5"
          strokeDasharray="6 4"
          style={{ animation: 'rf-march 1s linear infinite' }} />
        {/* Subtle outer halo to lift the dashes off varying photo tones */}
        <rect x={ox - 0.5} y={oy - 0.5} width={origW + 1} height={origH + 1}
          fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="1" />
      </svg>
    </>
  );
}

// 2. TINT — a soft magenta wash over the AI region. Reads instantly.
function IndicatorTint({ outW, outH, origW, origH }) {
  const ox = (outW - origW) / 2;
  const oy = (outH - origH) / 2;
  return (
    <>
      <AIShape outW={outW} outH={outH} ox={ox} oy={oy} origW={origW} origH={origH}
        style={{
          background: 'rgba(236,72,153,.22)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }} />
      {/* A crisper 1px line at the seam so the boundary is unambiguous */}
      <svg width={outW} height={outH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <rect x={ox} y={oy} width={origW} height={origH}
          fill="none" stroke="rgba(236,72,153,.9)" strokeWidth="1" shapeRendering="crispEdges" />
      </svg>
    </>
  );
}

// 3. SCAN — diagonal hatching pattern over the AI region. Photo-friendly
//    because the pattern is high frequency but low contrast.
function IndicatorScan({ outW, outH, origW, origH }) {
  const ox = (outW - origW) / 2;
  const oy = (outH - origH) / 2;
  return (
    <>
      <AIShape outW={outW} outH={outH} ox={ox} oy={oy} origW={origW} origH={origH}
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(236,72,153,.32) 0 2px, transparent 2px 8px)',
          mixBlendMode: 'normal',
          pointerEvents: 'none',
        }} />
      <svg width={outW} height={outH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <rect x={ox} y={oy} width={origW} height={origH}
          fill="none" stroke="#ec4899" strokeWidth="1.25" shapeRendering="crispEdges" />
      </svg>
    </>
  );
}

// 4. LABEL — Corner badges + thin seam, NO occlusion. The most "Studio
//    polite" option: doesn't tint pixels, just tags the regions.
function IndicatorLabel({ outW, outH, origW, origH }) {
  const ox = (outW - origW) / 2;
  const oy = (outH - origH) / 2;
  return (
    <>
      <svg width={outW} height={outH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <pattern id="rf-dashed" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(0)">
            <line x1="0" y1="0" x2="8" y2="0" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="4 2" />
          </pattern>
        </defs>
        {/* horizontal seams */}
        <line x1={ox} y1={oy} x2={ox + origW} y2={oy} stroke="#ec4899" strokeWidth="1.25" strokeDasharray="4 3" />
        <line x1={ox} y1={oy + origH} x2={ox + origW} y2={oy + origH} stroke="#ec4899" strokeWidth="1.25" strokeDasharray="4 3" />
        <line x1={ox} y1={oy} x2={ox} y2={oy + origH} stroke="#ec4899" strokeWidth="1.25" strokeDasharray="4 3" />
        <line x1={ox + origW} y1={oy} x2={ox + origW} y2={oy + origH} stroke="#ec4899" strokeWidth="1.25" strokeDasharray="4 3" />
      </svg>
      {/* Two badges on the AI region corners */}
      <RegionBadge style={{ left: 10, top: 10 }} kind="ai" />
      <RegionBadge style={{ left: ox + 10, top: oy + 10 }} kind="orig" />
    </>
  );
}

function RegionBadge({ kind, style }) {
  const isAi = kind === 'ai';
  return (
    <div style={{
      position: 'absolute',
      ...style,
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px 4px 6px',
      borderRadius: 4,
      fontFamily: 'var(--rf-mono)',
      fontSize: 11,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      color: isAi ? '#fff' : '#1f1f1f',
      background: isAi ? '#ec4899' : 'rgba(255,255,255,.92)',
      boxShadow: isAi ? '0 1px 3px rgba(0,0,0,.3)' : '0 1px 3px rgba(0,0,0,.2)',
      pointerEvents: 'none',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: 999,
        background: isAi ? '#fff' : '#1f1f1f',
      }} />
      {isAi ? 'AI generated' : 'Original'}
    </div>
  );
}

// 5. SPLIT — interactive reveal. Drag to wipe between the reframed
//    result and the original (which only fills its old footprint, with
//    transparent letterboxing outside it). Best for judging the seam.
function IndicatorSplit({ outW, outH, origW, origH, photo }) {
  // The wiper position is a % of width. Left side: original (with the
  // outpainted region greyed out / hatched). Right: full result.
  const [pos, setPos] = React.useState(58);
  const ox = (outW - origW) / 2;
  const oy = (outH - origH) / 2;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    setPos(Math.max(2, Math.min(98, (px / rect.width) * 100)));
  };
  const dragging = React.useRef(false);

  return (
    <div
      onMouseMove={(e) => dragging.current && onMove(e)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      style={{ position: 'absolute', inset: 0, cursor: 'ew-resize' }}
    >
      {/* Left half: show only the ORIGINAL footprint, rest is empty studio bg */}
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`,
      }}>
        {/* Empty AI region with hatched "missing" state */}
        <div style={{
          position: 'absolute', inset: 0,
          background:
            '#f5f4f0' +
            ' repeating-linear-gradient(45deg, rgba(0,0,0,.04) 0 6px, transparent 6px 12px)',
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(0,0,0,.05) 0 6px, transparent 6px 12px)',
        }} />
        {/* The original photo confined to its old rect */}
        <div style={{
          position: 'absolute', left: ox, top: oy, width: origW, height: origH,
          overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)',
        }}>
          {/* Re-render the underlying photo, then crop visually */}
          <div style={{ position: 'absolute', left: -ox, top: -oy, width: outW, height: outH }}>
            {photo}
          </div>
        </div>
        <div style={{
          position: 'absolute', left: 12, top: 12,
          fontFamily: 'var(--rf-mono)', fontSize: 11,
          color: '#1f1f1f', background: 'rgba(255,255,255,.92)',
          padding: '4px 8px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase',
        }}>Original</div>
      </div>
      {/* Right half: full reframed result */}
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: `polygon(${pos}% 0, 100% 0, 100% 100%, ${pos}% 100%)`,
      }}>
        <div style={{ position: 'absolute', left: 12, top: 12 }}>
          <RegionBadge kind="ai" style={{ position: 'static' }} />
        </div>
      </div>
      {/* The wiper itself */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: `calc(${pos}% - 1px)`, width: 2, background: '#ec4899',
      }}>
        <div
          onMouseDown={(e) => { dragging.current = true; e.preventDefault(); }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 32, height: 32, borderRadius: 999,
            background: '#ec4899', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,.3)',
            cursor: 'ew-resize',
            fontSize: 14, fontWeight: 600,
          }}
        >‹›</div>
      </div>
    </div>
  );
}

// 6. LENS — hover anywhere over the AI region to peek the original
//    (here shown as a "stamp" preview pinned to a corner so it works
//    statically too).
function IndicatorLens({ outW, outH, origW, origH, photo }) {
  const ox = (outW - origW) / 2;
  const oy = (outH - origH) / 2;
  return (
    <>
      <AIShape outW={outW} outH={outH} ox={ox} oy={oy} origW={origW} origH={origH}
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(236,72,153,0) 50%, rgba(236,72,153,.1) 100%)',
          pointerEvents: 'none',
        }} />
      <svg width={outW} height={outH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <rect x={ox} y={oy} width={origW} height={origH}
          fill="none" stroke="#ec4899" strokeWidth="1.25" strokeDasharray="3 3" />
      </svg>
      {/* Pinned thumbnail showing the original */}
      <div style={{
        position: 'absolute', right: 12, bottom: 12,
        width: 120, height: 120,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.2)',
        background: '#000',
      }}>
        <div style={{ position: 'absolute', left: -ox * (120 / origW), top: -oy * (120 / origH),
          width: outW * (120 / origW), height: outH * (120 / origH),
          transformOrigin: 'top left',
        }}>
          {photo}
        </div>
        <div style={{
          position: 'absolute', left: 6, top: 6,
          fontFamily: 'var(--rf-mono)', fontSize: 9,
          color: '#fff', background: 'rgba(0,0,0,.6)',
          padding: '2px 5px', borderRadius: 2, letterSpacing: '.05em', textTransform: 'uppercase',
        }}>Source</div>
      </div>
    </>
  );
}

// Crop overlay (different problem — show what's kept vs discarded)
function CropOverlay({ outW, outH, cropW, cropH }) {
  // Here outW/outH is the ORIGINAL image size, and cropW/cropH is the
  // smaller crop box centered inside it.
  const cx = (outW - cropW) / 2;
  const cy = (outH - cropH) / 2;
  return (
    <>
      {/* Darken discarded regions */}
      <AIShape outW={outW} outH={outH} ox={cx} oy={cy} origW={cropW} origH={cropH}
        style={{ background: 'rgba(0,0,0,.55)', pointerEvents: 'none' }} />
      {/* Crop frame with rule-of-thirds */}
      <svg width={outW} height={outH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <rect x={cx} y={cy} width={cropW} height={cropH}
          fill="none" stroke="#fff" strokeWidth="1.5" />
        <line x1={cx + cropW / 3} y1={cy} x2={cx + cropW / 3} y2={cy + cropH} stroke="rgba(255,255,255,.5)" strokeWidth="1" />
        <line x1={cx + (cropW * 2) / 3} y1={cy} x2={cx + (cropW * 2) / 3} y2={cy + cropH} stroke="rgba(255,255,255,.5)" strokeWidth="1" />
        <line x1={cx} y1={cy + cropH / 3} x2={cx + cropW} y2={cy + cropH / 3} stroke="rgba(255,255,255,.5)" strokeWidth="1" />
        <line x1={cx} y1={cy + (cropH * 2) / 3} x2={cx + cropW} y2={cy + (cropH * 2) / 3} stroke="rgba(255,255,255,.5)" strokeWidth="1" />
        {/* Handles at the corners */}
        {[[cx, cy], [cx + cropW, cy], [cx, cy + cropH], [cx + cropW, cy + cropH]].map(([x, y], i) => (
          <rect key={i} x={x - 4} y={y - 4} width={8} height={8} fill="#fff" />
        ))}
      </svg>
      <div style={{
        position: 'absolute', left: cx + 8, top: cy + 8,
        fontFamily: 'var(--rf-mono)', fontSize: 11,
        color: '#1f1f1f', background: 'rgba(255,255,255,.92)',
        padding: '4px 8px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase',
      }}>Keep · {cropW}×{cropH}</div>
    </>
  );
}

Object.assign(window, {
  Photo, IndicatorDash, IndicatorTint, IndicatorScan,
  IndicatorLabel, IndicatorSplit, IndicatorLens, CropOverlay, RegionBadge,
});
