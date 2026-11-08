import QRCode from 'qrcode';

interface RenderQrOptions {
  canvas: HTMLCanvasElement | null;
  payload: string;
  margin: number;
  fgColor: string;
  bgColor: string;
  logoImage: string | null;
}

export function renderQrToCanvas({
  canvas,
  payload,
  margin,
  fgColor,
  bgColor,
  logoImage,
}: RenderQrOptions) {
  if (!canvas) return;
  QRCode.toCanvas(
    canvas,
    payload,
    {
      width: 300,
      margin,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: 'H',
    },
    (error) => {
      if (error) {
        console.error('Failed to render QR Code:', error);
        return;
      }

      if (logoImage) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = logoImage;
        img.onload = () => {
          const logoSize = canvas.width * 0.22;
          const x = (canvas.width - logoSize) / 2;
          const y = (canvas.height - logoSize) / 2;

          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 4, 0, Math.PI * 2);
          ctx.fillStyle = bgColor;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#E4E9DC';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, x, y, logoSize, logoSize);
          ctx.restore();
        };
      }
    }
  );
}

interface DownloadQrOptions {
  payload: string;
  margin: number;
  fgColor: string;
  bgColor: string;
  logoImage: string | null;
  exportFormat: 'png' | 'svg';
  exportSize: number;
}

export async function downloadQrCode({
  payload,
  margin,
  fgColor,
  bgColor,
  logoImage,
  exportFormat,
  exportSize,
}: DownloadQrOptions) {
  if (exportFormat === 'svg') {
    try {
      const svgString = await QRCode.toString(payload, {
        type: 'svg',
        margin,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: 'H',
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `urlref-qr-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate SVG:', err);
    }
  } else {
    const offscreenCanvas = document.createElement('canvas');
    await QRCode.toCanvas(offscreenCanvas, payload, {
      width: exportSize,
      margin,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: 'H',
    });

    if (logoImage) {
      const ctx = offscreenCanvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = logoImage;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const logoSize = offscreenCanvas.width * 0.22;
            const x = (offscreenCanvas.width - logoSize) / 2;
            const y = (offscreenCanvas.height - logoSize) / 2;

            ctx.save();
            ctx.beginPath();
            ctx.arc(offscreenCanvas.width / 2, offscreenCanvas.height / 2, logoSize / 2 + 8, 0, Math.PI * 2);
            ctx.fillStyle = bgColor;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#E4E9DC';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(offscreenCanvas.width / 2, offscreenCanvas.height / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, x, y, logoSize, logoSize);
            ctx.restore();
            resolve();
          };
        });
      }
    }

    const pngUrl = offscreenCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `urlref-qr-${exportSize}px.png`;
    a.click();
  }
}
