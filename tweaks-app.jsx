// Echor Tweaks panel — swap palette, hero copy variant, motion intensity, garden density.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "warm",
  "heroVariant": "a",
  "motionSpeed": 1,
  "driftIntensity": 1,
  "showOrbs": true
}/*EDITMODE-END*/;

function EchorTweaks(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // body class — palette
  React.useEffect(() => {
    document.body.classList.remove('palette-warm','palette-paper','palette-mist');
    document.body.classList.add('palette-' + t.palette);
  }, [t.palette]);

  // hero copy
  React.useEffect(() => {
    if(window.__echor && window.__echor.setHero){
      window.__echor.setHero(t.heroVariant);
    }
  }, [t.heroVariant]);

  // motion vars
  React.useEffect(() => {
    document.documentElement.style.setProperty('--m-speed', 1 / Math.max(t.motionSpeed, 0.3));
    document.documentElement.style.setProperty('--m-drift', 1 / Math.max(t.driftIntensity, 0.3));
  }, [t.motionSpeed, t.driftIntensity]);

  // orbs visibility
  React.useEffect(() => {
    const g = document.querySelector('.garden');
    if(g) g.style.display = t.showOrbs ? '' : 'none';
  }, [t.showOrbs]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Voice & Copy" />
      <TweakRadio
        label="Hero コピー"
        value={t.heroVariant}
        options={['a','b','c']}
        onChange={(v) => setTweak('heroVariant', v)}
      />

      <TweakSection label="Palette" />
      <TweakRadio
        label="トーン"
        value={t.palette}
        options={['warm','paper','mist']}
        onChange={(v) => setTweak('palette', v)}
      />

      <TweakSection label="Motion" />
      <TweakSlider
        label="フェード"
        value={t.motionSpeed}
        min={0.4} max={2} step={0.1}
        onChange={(v) => setTweak('motionSpeed', v)}
      />
      <TweakSlider
        label="漂い"
        value={t.driftIntensity}
        min={0.4} max={2} step={0.1}
        onChange={(v) => setTweak('driftIntensity', v)}
      />

      <TweakSection label="Sections" />
      <TweakToggle
        label="箱庭を表示"
        value={t.showOrbs}
        onChange={(v) => setTweak('showOrbs', v)}
      />
    </TweaksPanel>
  );
}

const __root = document.createElement('div');
document.body.appendChild(__root);
ReactDOM.createRoot(__root).render(<EchorTweaks />);
