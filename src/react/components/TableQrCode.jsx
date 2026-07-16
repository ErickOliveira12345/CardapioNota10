import React, {
  useEffect,
  useState,
} from "react";

import QRCode from "qrcode";

export function TableQrCode({
  value,
  tableNumber,
}) {
  const [qrCodeUrl, setQrCodeUrl] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function generateQrCode() {
      try {
        setError("");

        const imageUrl =
          await QRCode.toDataURL(value, {
            width: 280,
            margin: 2,
            errorCorrectionLevel: "M",
          });

        if (mounted) {
          setQrCodeUrl(imageUrl);
        }
      } catch (generationError) {
        console.error(
          "Erro ao gerar QR Code:",
          generationError,
        );

        if (mounted) {
          setError(
            "Não foi possível gerar o QR Code.",
          );
        }
      }
    }

    if (value) {
      generateQrCode();
    }

    return () => {
      mounted = false;
    };
  }, [value]);

  function downloadQrCode() {
    if (!qrCodeUrl) return;

    const link =
      document.createElement("a");

    link.href = qrCodeUrl;
    link.download =
      `mesa-${tableNumber}-qrcode.png`;

    link.click();
  }

  if (error) {
    return (
      <p className="table-qrcode-error">
        {error}
      </p>
    );
  }

  if (!qrCodeUrl) {
    return (
      <p className="table-qrcode-loading">
        Gerando QR Code...
      </p>
    );
  }

  return (
    <div className="table-qrcode">
      <img
        src={qrCodeUrl}
        alt={`QR Code da Mesa ${tableNumber}`}
      />

      <button
        type="button"
        className="category-action-btn"
        onClick={downloadQrCode}
      >
        Baixar QR Code
      </button>
    </div>
  );
}