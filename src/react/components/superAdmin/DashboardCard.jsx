import React from "react";

export default function DashboardCard({
  title,
  value,
  icon,
  description,
  loading = false,
}) {
  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <div>
          <span className="dashboard-card__title">
            {title}
          </span>

          <strong className="dashboard-card__value">
            {loading ? "..." : value}
          </strong>
        </div>

        <span className="dashboard-card__icon">
          {icon}
        </span>
      </div>

      {description && (
        <p className="dashboard-card__description">
          {description}
        </p>
      )}
    </article>
  );
}