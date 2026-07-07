type ModeToggleProps = {
  interiorMode: boolean;
  onToggle: () => void;
};

export function ModeToggle({ interiorMode, onToggle }: ModeToggleProps) {
  return (
    <button className="mode-toggle" type="button" onClick={onToggle}>
      <span className="mode-toggle__label">内部结构</span>
      <span className="mode-toggle__value">
        {interiorMode ? "Interior Mode" : "Normal Mode"}
      </span>
    </button>
  );
}
