// screens.jsx — composed states for each artboard.
// Each Screen* component renders inside an artboard at a fixed size.

const ARTBOARD_W = 1180;
const ARTBOARD_H = 760;
window.ARTBOARD_W = ARTBOARD_W;
window.ARTBOARD_H = ARTBOARD_H;

// Standard preview-area sizing helper
function fitPreview({ outRatio, areaW, areaH, originalRatio = '1:1' }) {
  const [tw, th] = outRatio.split(':').map(Number);
  const r = tw / th;
  let outW = areaW;
  let outH = outW / r;
  if (outH > areaH) { outH = areaH; outW = outH * r; }
  // Original sits centered, sized to fit the SAME pixels mapped through
  // the target box. We assume original was the "fitting" axis (here:
  // 1:1 original, target 16:9 means height matches, width gets extended)
  const [ow, oh] = originalRatio.split(':').map(Number);
  const origR = ow / oh;
  let origW, origH;
  if (r >= origR) {
    // target wider than original — height matches
    origH = outH;
    origW = origH * origR;
  } else {
    // target taller than original — width matches
    origW = outW;
    origH = origW / origR;
  }
  return { outW, outH, origW, origH };
}
window.fitPreview = fitPreview;

// ─── Preview canvas wrapper ────────────────────────────────────────
function PreviewArea({ children, toolbar, footer }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex', flexDirection: 'column',
      background: '#f5f4f0',
      minWidth: 0,
    }}>
      {toolbar && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 18px',
          borderBottom: '1px solid #e5e4df',
          background: '#fafaf7',
          minHeight: 44,
        }}>{toolbar}</div>
      )}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        minHeight: 0,
        background: 'radial-gradient(circle at 50% 50%, #faf9f5 0%, #efeee9 100%)',
        backgroundImage:
          'linear-gradient(45deg, #ececea 25%, transparent 25%),' +
          'linear-gradient(-45deg, #ececea 25%, transparent 25%),' +
          'linear-gradient(45deg, transparent 75%, #ececea 75%),' +
          'linear-gradient(-45deg, transparent 75%, #ececea 75%)',
        backgroundSize: '14px 14px',
        backgroundPosition: '0 0, 0 7px, 7px -7px, -7px 0px',
        backgroundColor: '#f5f4f0',
      }}>
        {children}
      </div>
      {footer}
    </div>
  );
}
window.PreviewArea = PreviewArea;

// ─── 1. Initial / Empty state ──────────────────────────────────────
function ScreenInitial() {
  return (
    <Modal>
      <ControlsRail
        ratio={null}
        onRatio={() => {}}
        mode={null}
        onMode={() => {}}
        currentRatio="1:1"
        customX="3"
        customY="2"
        onCustom={() => {}}
      />
      <PreviewArea
        toolbar={
          <>
            <span style={{ fontSize: 12, color: '#6b6b6b' }}>
              Pick an aspect ratio to start
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#9a9a96' }}>
              hero-photo.jpg · 1080 × 1080
            </span>
          </>
        }
        footer={
          <div style={{
            display: 'flex', gap: 8, padding: '12px 18px',
            borderTop: '1px solid #e5e4df', background: '#fff',
          }}>
            <div style={{ marginLeft: 'auto' }}>
              <Btn variant="subtle">Cancel</Btn>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Photo outW={360} outH={360} origW={360} origH={360} />
          <div style={{
            fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b',
            letterSpacing: '.04em', textTransform: 'uppercase',
          }}>Source · 1:1 · 1080 × 1080</div>
        </div>
      </PreviewArea>
    </Modal>
  );
}
window.ScreenInitial = ScreenInitial;

// ─── 2. Ratio picked, awaiting generation ──────────────────────────
function ScreenAwaiting() {
  const { outW, outH, origW, origH } = fitPreview({
    outRatio: '16:9', areaW: 660, areaH: 440, originalRatio: '1:1',
  });
  return (
    <Modal>
      <ControlsRailWithState selectedRatio="16:9" selectedMode="outpaint" />
      <PreviewArea
        toolbar={
          <>
            <PillGroup
              value="orig"
              options={[
                { value: 'orig', label: 'Source' },
                { value: 'preview', label: 'Preview' },
              ]}
              onChange={() => {}}
            />
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b' }}>
              Will generate 480×1080 of new pixels (44% of output)
            </span>
          </>
        }
        footer={
          <div style={{
            display: 'flex', alignItems: 'center', padding: '12px 18px',
            borderTop: '1px solid #e5e4df', background: '#fff', gap: 8,
          }}>
            <div style={{
              fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon.image />
              Will replace hero.image
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Btn variant="subtle">Cancel</Btn>
              <Btn variant="primary" icon={<Icon.spark />}>Generate</Btn>
            </div>
          </div>
        }
      >
        <div style={{ position: 'relative' }}>
          {/* The full target box, but the AI region is empty (dashed placeholder) */}
          <div style={{
            position: 'relative',
            width: outW, height: outH,
            borderRadius: 4,
            background: '#fff',
            boxShadow: '0 8px 28px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.05)',
            overflow: 'hidden',
          }}>
            {/* AI region (empty) */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(236,72,153,.12) 0 6px, transparent 6px 14px)',
              background: 'repeating-linear-gradient(45deg, rgba(236,72,153,.12) 0 6px, rgba(250,250,247,.7) 6px 14px)',
            }} />
            {/* Original in the middle */}
            <div style={{
              position: 'absolute',
              left: (outW - origW) / 2, top: (outH - origH) / 2,
              width: origW, height: origH,
            }}>
              <Photo outW={origW} outH={origH} origW={origW} origH={origH} />
            </div>
            {/* Seam line */}
            <svg width={outW} height={outH} style={{ position: 'absolute', inset: 0 }}>
              <rect x={(outW - origW) / 2} y={(outH - origH) / 2}
                width={origW} height={origH}
                fill="none" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="6 4" />
            </svg>
            {/* Labels on the AI extensions */}
            <div style={{
              position: 'absolute', left: 12, top: 12,
              fontFamily: 'var(--rf-mono)', fontSize: 11,
              color: '#ec4899', background: 'rgba(255,255,255,.95)',
              padding: '4px 8px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase',
              border: '1px solid rgba(236,72,153,.3)',
            }}>← to generate</div>
            <div style={{
              position: 'absolute', right: 12, top: 12,
              fontFamily: 'var(--rf-mono)', fontSize: 11,
              color: '#ec4899', background: 'rgba(255,255,255,.95)',
              padding: '4px 8px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase',
              border: '1px solid rgba(236,72,153,.3)',
            }}>to generate →</div>
          </div>
          <Measurements outW={outW} outH={outH} origW={origW} origH={origH} />
        </div>
      </PreviewArea>
    </Modal>
  );
}
window.ScreenAwaiting = ScreenAwaiting;

function Measurements({ outW, outH, origW, origH, label = '16:9 · 1920 × 1080' }) {
  return (
    <>
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        bottom: -22, textAlign: 'center',
        fontFamily: 'var(--rf-mono)', fontSize: 10.5, color: '#6b6b6b',
        letterSpacing: '.04em', textTransform: 'uppercase',
      }}>{label}</div>
    </>
  );
}

// ─── 3. Generating ─────────────────────────────────────────────────
function ScreenGenerating() {
  const { outW, outH, origW, origH } = fitPreview({
    outRatio: '16:9', areaW: 660, areaH: 440, originalRatio: '1:1',
  });
  return (
    <Modal>
      <ControlsRailWithState selectedRatio="16:9" selectedMode="outpaint" disabled />
      <PreviewArea
        toolbar={
          <>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#ec4899',
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>
              <Spinner /> Generating · ~8s remaining
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b' }}>
              gpt-image-2 · seed 4f3a91
            </span>
          </>
        }
        footer={
          <div style={{
            display: 'flex', alignItems: 'center', padding: '12px 18px',
            borderTop: '1px solid #e5e4df', background: '#fff', gap: 8,
          }}>
            <div style={{
              fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b',
            }}>4 credits will be charged on accept</div>
            <div style={{ marginLeft: 'auto' }}>
              <Btn variant="ghost">Cancel generation</Btn>
            </div>
          </div>
        }
      >
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'relative',
            width: outW, height: outH,
            borderRadius: 4,
            background: '#fff',
            boxShadow: '0 8px 28px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.05)',
            overflow: 'hidden',
          }}>
            {/* Original */}
            <div style={{
              position: 'absolute',
              left: (outW - origW) / 2, top: (outH - origH) / 2,
              width: origW, height: origH,
            }}>
              <Photo outW={origW} outH={origH} origW={origW} origH={origH} />
            </div>
            {/* AI regions with shimmering progress */}
            <div style={{
              position: 'absolute',
              left: 0, top: 0, width: (outW - origW) / 2, height: outH,
            }}>
              <ShimmerPanel />
            </div>
            <div style={{
              position: 'absolute',
              right: 0, top: 0, width: (outW - origW) / 2, height: outH,
            }}>
              <ShimmerPanel />
            </div>
            {/* Seam highlight */}
            <svg width={outW} height={outH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <rect x={(outW - origW) / 2} y={(outH - origH) / 2}
                width={origW} height={origH}
                fill="none" stroke="rgba(236,72,153,.9)" strokeWidth="1.25"
                strokeDasharray="6 4"
                style={{ animation: 'rf-march 1s linear infinite' }} />
            </svg>
          </div>
          {/* Progress bar */}
          <div style={{
            marginTop: 20,
            width: outW,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              height: 4, borderRadius: 2,
              background: '#e5e4df',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '62%', height: '100%',
                background: 'linear-gradient(to right, #ec4899, #f472b6)',
                borderRadius: 2,
                animation: 'rf-pulse 1.6s ease-in-out infinite',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--rf-mono)', fontSize: 10.5, color: '#6b6b6b',
            }}>
              <span>Inferring scene · Extending sky</span>
              <span>62%</span>
            </div>
          </div>
        </div>
      </PreviewArea>
    </Modal>
  );
}
window.ScreenGenerating = ScreenGenerating;

function ShimmerPanel() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background:
        'linear-gradient(110deg, rgba(31,31,31,.06) 8%, rgba(236,72,153,.18) 18%, rgba(31,31,31,.06) 33%)',
      backgroundSize: '200% 100%',
      animation: 'rf-shimmer 1.8s linear infinite',
    }} />
  );
}

function Spinner({ size = 12 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size,
      borderRadius: 999,
      border: '1.5px solid rgba(236,72,153,.3)',
      borderTopColor: '#ec4899',
      animation: 'rf-spin 0.8s linear infinite',
    }} />
  );
}
window.Spinner = Spinner;

// ─── 4. Preview ready (the CENTERPIECE) ────────────────────────────
function ScreenPreviewReady({ indicator = 'dash' }) {
  const { outW, outH, origW, origH } = fitPreview({
    outRatio: '16:9', areaW: 720, areaH: 460, originalRatio: '1:1',
  });
  const photo = <Photo outW={outW} outH={outH} origW={origW} origH={origH} />;
  return (
    <Modal>
      <ControlsRailWithState selectedRatio="16:9" selectedMode="outpaint" />
      <PreviewArea
        toolbar={<PreviewToolbar indicator={indicator} />}
        footer={<ActionBar mode="outpaint" />}
      >
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'relative',
            width: outW, height: outH,
            borderRadius: 4,
            boxShadow: '0 8px 28px rgba(0,0,0,.2), 0 0 0 1px rgba(0,0,0,.08)',
            overflow: 'hidden',
            background: '#000',
          }}>
            {photo}
            <IndicatorByName name={indicator}
              outW={outW} outH={outH} origW={origW} origH={origH} photo={photo} />
          </div>
          <FooterCaption outW={outW} origW={origW} origH={origH} />
        </div>
      </PreviewArea>
    </Modal>
  );
}
window.ScreenPreviewReady = ScreenPreviewReady;

function IndicatorByName({ name, outW, outH, origW, origH, photo }) {
  const props = { outW, outH, origW, origH, photo };
  switch (name) {
    case 'tint':  return <IndicatorTint {...props} />;
    case 'scan':  return <IndicatorScan {...props} />;
    case 'label': return <IndicatorLabel {...props} />;
    case 'split': return <IndicatorSplit {...props} />;
    case 'lens':  return <IndicatorLens {...props} />;
    case 'off':   return null;
    case 'dash':
    default:      return <IndicatorDash {...props} />;
  }
}
window.IndicatorByName = IndicatorByName;

function PreviewToolbar({ indicator }) {
  return (
    <>
      <div style={{
        fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: 999, background: '#16a34a',
          boxShadow: '0 0 0 3px rgba(22,163,74,.15)',
        }} />
        Generated · 11.4s · seed 4f3a91
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: '#6b6b6b' }}>Show generated regions</span>
        <PillGroup
          value={indicator}
          options={[
            { value: 'dash',  label: 'Outline', dot: '#ec4899' },
            { value: 'tint',  label: 'Tint',    dot: '#ec4899' },
            { value: 'scan',  label: 'Hatch',   dot: '#ec4899' },
            { value: 'label', label: 'Labels',  dot: '#ec4899' },
            { value: 'split', label: 'Compare', dot: '#ec4899' },
            { value: 'off',   label: 'Off' },
          ]}
          onChange={() => {}}
        />
      </div>
    </>
  );
}
window.PreviewToolbar = PreviewToolbar;

function FooterCaption({ outW, origW, origH }) {
  return (
    <div style={{
      position: 'absolute',
      left: 0, right: 0,
      bottom: -28,
      display: 'flex', justifyContent: 'space-between',
      fontFamily: 'var(--rf-mono)', fontSize: 10.5, color: '#6b6b6b',
      letterSpacing: '.04em', textTransform: 'uppercase',
    }}>
      <span><span style={{ color: '#1f1f1f' }}>16:9</span> · 1920 × 1080</span>
      <span><span style={{ color: '#ec4899' }}>■</span> AI · {Math.round(((outW - origW) / outW) * 100)}% of frame</span>
      <span>Source <span style={{ color: '#1f1f1f' }}>1:1</span> · 1080 × 1080</span>
    </div>
  );
}

// ─── 5. Crop preview ───────────────────────────────────────────────
function ScreenCropPreview() {
  // For crop: target is wider but we have a tall original; we crop a
  // smaller box. Here we'll show a 4:5 crop of the 1:1 original.
  const origSize = 460;
  const cropW = origSize;
  const cropH = origSize * 1.25; // wait — 4:5 means w/h = 0.8 -> taller
  // Actually let's do 16:9 needs outpaint; do 4:3 which fits-by-crop
  // 4:3 of 1:1 → crop height: width=1, height=0.75
  const cw = origSize;
  const ch = origSize * 0.75;
  return (
    <Modal>
      <ControlsRailWithState selectedRatio="4:3" selectedMode="crop" />
      <PreviewArea
        toolbar={
          <>
            <div style={{
              fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon.crop /> Crop mode · drag to reposition
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <PillGroup
                value="center"
                options={[
                  { value: 'center', label: 'Center' },
                  { value: 'top', label: 'Top' },
                  { value: 'bottom', label: 'Bottom' },
                  { value: 'manual', label: 'Manual' },
                ]}
                onChange={() => {}}
              />
            </div>
          </>
        }
        footer={<ActionBar mode="crop" />}
      >
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'relative',
            width: origSize, height: origSize,
            borderRadius: 4,
            boxShadow: '0 8px 28px rgba(0,0,0,.2), 0 0 0 1px rgba(0,0,0,.08)',
            overflow: 'hidden',
            background: '#000',
          }}>
            <Photo outW={origSize} outH={origSize} origW={origSize} origH={origSize} />
            <CropOverlay outW={origSize} outH={origSize} cropW={cw} cropH={ch} />
          </div>
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: -28,
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--rf-mono)', fontSize: 10.5, color: '#6b6b6b',
            letterSpacing: '.04em', textTransform: 'uppercase',
          }}>
            <span>Source 1:1 · 1080 × 1080</span>
            <span>Result 4:3 · 1080 × 810</span>
          </div>
        </div>
      </PreviewArea>
    </Modal>
  );
}
window.ScreenCropPreview = ScreenCropPreview;

// ─── 6. Error ──────────────────────────────────────────────────────
function ScreenError() {
  const { outW, outH, origW, origH } = fitPreview({
    outRatio: '16:9', areaW: 660, areaH: 440, originalRatio: '1:1',
  });
  return (
    <Modal>
      <ControlsRailWithState selectedRatio="16:9" selectedMode="outpaint" />
      <PreviewArea
        toolbar={
          <>
            <div style={{
              fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#b91c1c',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon.alert /> Generation failed
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: 'var(--rf-mono)', fontSize: 11, color: '#6b6b6b' }}>
              Request id 9c2a-4f31
            </div>
          </>
        }
        footer={
          <div style={{
            display: 'flex', alignItems: 'center', padding: '12px 18px',
            borderTop: '1px solid #e5e4df', background: '#fff', gap: 8,
          }}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Btn variant="subtle">Cancel</Btn>
              <Btn variant="ghost">Report</Btn>
              <Btn variant="primary" icon={<Icon.refresh />}>Try again</Btn>
            </div>
          </div>
        }
      >
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'relative',
            width: outW, height: outH,
            borderRadius: 4,
            background: '#fff',
            boxShadow: '0 8px 28px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.05)',
            overflow: 'hidden',
            opacity: 0.5,
          }}>
            <div style={{
              position: 'absolute',
              left: (outW - origW) / 2, top: (outH - origH) / 2,
              width: origW, height: origH,
            }}>
              <Photo outW={origW} outH={origH} origW={origW} origH={origH} />
            </div>
            <div style={{
              position: 'absolute',
              left: 0, top: 0, width: (outW - origW) / 2, height: outH,
              background: 'repeating-linear-gradient(45deg, rgba(185,28,28,.08) 0 8px, rgba(250,250,247,.7) 8px 16px)',
            }} />
            <div style={{
              position: 'absolute',
              right: 0, top: 0, width: (outW - origW) / 2, height: outH,
              background: 'repeating-linear-gradient(45deg, rgba(185,28,28,.08) 0 8px, rgba(250,250,247,.7) 8px 16px)',
            }} />
          </div>
          {/* Error card overlay */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 360,
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #fecaca',
            padding: '18px 18px 16px',
            boxShadow: '0 12px 36px rgba(185,28,28,.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 6,
                background: '#fef2f2', color: '#b91c1c',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon.alert /></span>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Couldn't extend image</div>
            </div>
            <div style={{ fontSize: 12.5, color: '#1f1f1f', lineHeight: 1.5, marginBottom: 8 }}>
              The model returned a content policy violation for the prompt
              inferred from this image. No credits were charged.
            </div>
            <div style={{
              padding: '8px 10px',
              background: '#fafaf7',
              border: '1px solid #e5e4df',
              borderRadius: 5,
              fontFamily: 'var(--rf-mono)', fontSize: 10.5, color: '#6b6b6b',
              marginBottom: 12,
            }}>
              gpt-image-2 · err.policy · 9c2a-4f31
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <SuggestChip>Try a different ratio</SuggestChip>
              <SuggestChip>Switch to crop</SuggestChip>
              <SuggestChip>New seed</SuggestChip>
            </div>
          </div>
        </div>
      </PreviewArea>
    </Modal>
  );
}
window.ScreenError = ScreenError;

function SuggestChip({ children }) {
  return (
    <button style={{
      padding: '4px 10px',
      border: '1px solid #e5e4df',
      borderRadius: 999,
      background: '#fff',
      fontSize: 11.5,
      cursor: 'pointer',
      font: 'inherit',
      color: '#1f1f1f',
    }}>{children}</button>
  );
}

// ─── Helper: ControlsRail prefilled for a state ────────────────────
function ControlsRailWithState({ selectedRatio, selectedMode, disabled }) {
  const [r, setR] = React.useState(selectedRatio);
  const [m, setM] = React.useState(selectedMode);
  const [cx, setCx] = React.useState('3');
  const [cy, setCy] = React.useState('2');
  return (
    <div style={{ position: 'relative' }}>
      <ControlsRail
        ratio={r} onRatio={setR}
        mode={m} onMode={setM}
        currentRatio="1:1"
        customX={cx} customY={cy}
        onCustom={(a, b) => { setCx(a); setCy(b); }}
      />
      {disabled && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,.6)',
          backdropFilter: 'blur(1px)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}
window.ControlsRailWithState = ControlsRailWithState;
