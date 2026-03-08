export default function QuantityStepper({ value, max, onChange }) {
  function update(nextValue) {
    const clamped = Math.max(0, Math.min(max, nextValue));
    onChange(clamped);
  }

  return (
    <div className="quantity-stepper">
      <button type="button" onClick={() => update(value - 1)}>
        −
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => update(value + 1)}>
        +
      </button>
    </div>
  );
}
