const PAGE_FILENAME_MAP: Record<string, string> = {
  '/quarters/requests': 'Quarters_Requests_Export',
  '/quarters/manager': 'Quarters_Manager_Export',
  '/quarters/rent': 'Quarters_Rent_Export',
  '/quarters': 'Quarters_Freeview_Export',
  '/properties': 'FAMS_Properties_Export',
  '/manager': 'FAMS_Manager_Export',
  '/check-in': 'FAMS_CheckIn_Export',
  '/maintenance': 'FAMS_Maintenance_Export',
  '/bookings': 'FAMS_Bookings_Export',
  '/admin': 'FAMS_Admin_Export',
  '/dashboard': 'FMS_Dashboard_Export',
};

const PAGE_TITLE_MAP: Record<string, string> = {
  '/quarters/requests': 'Government Quarters — Allotment Requests',
  '/quarters/manager': 'Estate Manager — Quarters Dashboard',
  '/quarters/rent': 'Quarters — Rent & Payments',
  '/quarters': 'Quarters — Inventory Overview',
  '/properties': 'FAMS — Properties',
  '/manager': 'FAMS — Manager Dashboard',
  '/check-in': 'FAMS — Check-In',
  '/maintenance': 'FAMS — Maintenance',
  '/bookings': 'FAMS — Bookings',
  '/admin': 'FAMS — Administration',
  '/dashboard': 'FMS — Dashboard',
};

function resolveFilename(pathname: string): string {
  for (const [route, name] of Object.entries(PAGE_FILENAME_MAP)) {
    if (pathname === route || pathname.startsWith(route + '/')) return name;
  }
  return 'FMS_Export';
}

function resolveTitle(pathname: string): string {
  for (const [route, title] of Object.entries(PAGE_TITLE_MAP)) {
    if (pathname === route || pathname.startsWith(route + '/')) return title;
  }
  return 'FMS — Export';
}

function collectInlineStyles(): string {
  const parts: string[] = [];
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = Array.from(sheet.cssRules ?? []);
        for (const rule of rules) {
          parts.push(rule.cssText);
        }
      } catch {
        // Cross-origin sheet — skip
      }
    }
  } catch {
    // Ignore
  }
  return parts.join('\n');
}

function hideTransientElements(): (() => void) {
  const selectors = [
    '[data-toast]',
    '[role="status"]',
    '[data-radix-popper-content-wrapper]',
    '[role="dialog"]',
    '.animate-ping',
    '[data-vite-dev-id]',
  ];
  const hidden: Array<{ el: HTMLElement; prev: string }> = [];
  for (const sel of selectors) {
    document.querySelectorAll<HTMLElement>(sel).forEach(el => {
      hidden.push({ el, prev: el.style.display });
      el.style.display = 'none';
    });
  }
  return () => {
    for (const { el, prev } of hidden) {
      el.style.display = prev;
    }
  };
}

function cleanHtml(raw: string): string {
  let s = raw;
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<link[^>]+rel=["']modulepreload["'][^>]*\/?>/gi, '');
  s = s.replace(/<link[^>]+href=["'][^"']*\.js["'][^>]*\/?>/gi, '');
  s = s.replace(/<vite-error-overlay[^>]*>[\s\S]*?<\/vite-error-overlay>/gi, '');
  s = s.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');
  return s;
}

function buildDocument(bodyContent: string, docTitle: string, _pathname: string, inlineStyles: string): string {
  const isoDate = new Date().toISOString().slice(0, 10);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${docTitle} — Exported on ${isoDate}" />
  <title>${docTitle}</title>
  <style>
${inlineStyles}

/* ── Export document overrides ───────────────────────────────── */
::-webkit-scrollbar { display: none; }
* { scrollbar-width: none; }

body {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

@media print {
  button:not([data-print-keep]),
  [role="menu"],
  [role="menuitem"],
  [data-toast],
  [role="status"],
  [data-radix-popper-content-wrapper],
  [role="dialog"],
  .animate-ping,
  [aria-label="Filter"],
  [aria-label="Sort"] {
    display: none !important;
  }

  [class*="rounded-xl"],
  [class*="rounded-lg"] {
    page-break-inside: avoid;
  }
}
  </style>
</head>
<body>

${bodyContent}

</body>
</html>`;
}

export interface DownloadHtmlOptions {
  title?: string;
  includeTimestamp?: boolean;
}

export function downloadElementAsHtml(
  element: HTMLElement,
  title: string,
  filenameBase: string = 'FMS_Export',
): void {
  const inlineStyles = collectInlineStyles();
  const rawHtml = cleanHtml(element.outerHTML);
  const bodyContent = `<body>${rawHtml}</body>`;
  const datePart = new Date().toISOString().slice(0, 10);
  const filename = `${filenameBase}_${datePart}.html`;
  const html = buildDocument(bodyContent, title, '', inlineStyles);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadPageAsHtml(
  pathname: string = window.location.pathname,
  options: DownloadHtmlOptions = {},
): void {
  const inlineStyles = collectInlineStyles();

  const restoreHidden = hideTransientElements();
  const rawHtml = document.documentElement.outerHTML;
  restoreHidden();

  const cleaned = cleanHtml(rawHtml);

  const bodyMatch = cleaned.match(/<body[\s\S]*<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[0] : `<body>${cleaned}</body>`;

  const baseName = resolveFilename(pathname);
  const docTitle = options.title ?? resolveTitle(pathname);

  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  const filename = options.includeTimestamp === false
    ? `${baseName}.html`
    : `${baseName}_${datePart}.html`;

  const html = buildDocument(bodyContent, docTitle, pathname, inlineStyles);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
