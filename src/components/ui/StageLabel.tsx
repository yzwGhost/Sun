type StageLabelProps = {
  interiorMode: boolean;
};

export function StageLabel({ interiorMode }: StageLabelProps) {
  return (
    <section className="stage-label">
      <span className="stage-label__eyebrow">
        {interiorMode ? "Interior Mode" : "Phase 2"}
      </span>
      <h1>{interiorMode ? "Solar Interior" : "Photosphere"}</h1>
      <p>
        {interiorMode
          ? "Scientific cutaway view of the Sun with transparent photosphere and layered core, radiative, and convection zones."
          : "NASA-grade photosphere visualization with granulation, convective flow, limb darkening, and HDR bloom."}
      </p>
      <div className="stage-label__meta">
        React Three Fiber · GLSL · HDR Post FX
      </div>
      {interiorMode ? (
        <div className="stage-label__legend">
          <span className="stage-label__dot stage-label__dot--core" />
          Core
          <span className="stage-label__dot stage-label__dot--radiative" />
          Radiative Zone
          <span className="stage-label__dot stage-label__dot--convection" />
          Convection Zone
        </div>
      ) : null}
    </section>
  );
}
