// app.jsx — design canvas with all artboards

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="indicator-variants"
        title="Generated-region indicator — 5 options"
        subtitle="The single most important detail. Same outpainted image, five different ways to mark what the AI added. Try the toolbar pill in any artboard."
      >
        <DCArtboard id="dash" label="A · Marching outline (default)"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenPreviewReady indicator="dash" />
        </DCArtboard>
        <DCArtboard id="tint" label="B · Magenta tint"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenPreviewReady indicator="tint" />
        </DCArtboard>
        <DCArtboard id="scan" label="C · Diagonal hatch"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenPreviewReady indicator="scan" />
        </DCArtboard>
        <DCArtboard id="label" label="D · Region badges (no occlusion)"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenPreviewReady indicator="label" />
        </DCArtboard>
        <DCArtboard id="split" label="E · Compare slider (interactive)"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenPreviewReady indicator="split" />
        </DCArtboard>
        <DCArtboard id="lens" label="F · Pinned source thumb"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenPreviewReady indicator="lens" />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="states"
        title="The other states"
        subtitle="Empty → ratio picked → generating → ready → error. Plus the crop branch."
      >
        <DCArtboard id="initial" label="01 · Just opened"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenInitial />
        </DCArtboard>
        <DCArtboard id="awaiting" label="02 · Ratio picked, awaiting generation"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenAwaiting />
        </DCArtboard>
        <DCArtboard id="generating" label="03 · Generating"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenGenerating />
        </DCArtboard>
        <DCArtboard id="crop" label="04 · Crop mode preview"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenCropPreview />
        </DCArtboard>
        <DCArtboard id="error" label="05 · Error"
          width={ARTBOARD_W} height={ARTBOARD_H}
        >
          <ScreenError />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
