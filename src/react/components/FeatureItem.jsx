import React from "react";

export function FeatureItem({
  label,
  enabled = false,
  value = null,
}) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "";

  return (
    <li
      className={`feature-item ${
        enabled ? "enabled" : "disabled"
      }`}
    >
      <span
        className="feature-item__icon"
        aria-hidden="true"
      >
        {enabled ? "✓" : "×"}
      </span>

      <span className="feature-item__label">
        {label}
      </span>

      {hasValue && (
        <strong className="feature-item__value">
          {value}
        </strong>
      )}
    </li>
  );
}

export default FeatureItem;