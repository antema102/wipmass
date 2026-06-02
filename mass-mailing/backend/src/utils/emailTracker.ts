/**
 * Utilitaires pour injecter le tracking dans le HTML des e-mails.
 * - Pixel d'ouverture (1x1 gif invisible)
 * - Remplacement des liens par des URLs de tracking (redirect)
 * - Lien de désabonnement dans le footer
 */

// ─── Pixel de tracking ouverture ─────────────────────────────────────────────

export const injectTrackingPixel = (
  html: string,
  logId: string,
  baseUrl: string
): string => {
  const pixelUrl = `${baseUrl}/api/track/open/${logId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;outline:none;" />`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`);
  }
  return html + pixel;
};

// ─── Tracking des clics ───────────────────────────────────────────────────────

export const injectClickTracking = (
  html: string,
  logId: string,
  baseUrl: string
): string => {
  // Remplace href="https://..." par le lien de tracking
  // Exception : les liens de désabonnement (/api/unsubscribe/...) ne sont pas wrappés
  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (_match, url: string) => {
    if (url.includes('/api/unsubscribe/') || url.includes('/api/track/')) {
      return `href="${url}"`;
    }
    const trackingUrl = `${baseUrl}/api/track/click/${logId}?url=${encodeURIComponent(url)}`;
    return `href="${trackingUrl}"`;
  });
};

// ─── Lien de désabonnement ────────────────────────────────────────────────────

export const injectUnsubscribeLink = (
  html: string,
  token: string,
  baseUrl: string
): string => {
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${token}`;

  const footer = `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;font-family:sans-serif;">
  Vous recevez cet e-mail car vous faites partie de notre liste de contacts.<br/>
  <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Se désabonner</a>
</div>`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${footer}</body>`);
  }
  return html + footer;
};
