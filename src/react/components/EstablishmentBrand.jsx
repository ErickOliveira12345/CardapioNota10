import React from "react";

export function EstablishmentBrand({
  logoUrl = "",
  establishmentName = "Estabelecimento",
  secondaryText = "",
  fallbackText = "E",
  className = "",
}) {
  const fallback =
    String(
      fallbackText ||
        establishmentName ||
        "E",
    )
      .trim()
      .charAt(0)
      .toUpperCase() || "E";

  return (
    <div
      className={
        `admin-sidebar__account ${className}`.trim()
      }
    >
      <div className="admin-sidebar__account-icon">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`Logotipo de ${establishmentName}`}
            onLoad={() => {
              console.log(
                "Imagem do estabelecimento carregada:",
                logoUrl,
              );
            }}
            onError={(event) => {
              console.error(
                "Erro ao exibir imagem do estabelecimento:",
                logoUrl,
              );

              event.currentTarget.style.display =
                "none";
            }}
          />
        ) : (
          fallback
        )}
      </div>

      <div className="admin-sidebar__account-info">
        <strong title={establishmentName}>
          {establishmentName}
        </strong>

        {secondaryText && (
          <span title={secondaryText}>
            {secondaryText}
          </span>
        )}
      </div>
    </div>
  );
}