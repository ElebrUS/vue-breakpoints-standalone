/** A map of named, minimum-width breakpoints. */
export type NumericBreakpoints = Record<string, number>;

export type DetectBreakpointStrategy =
  'auto' | 'width' | 'client-hints' | 'user-agent';

export interface DetectBreakpointOptions {
  /** Named minimum-width breakpoints, for example `{ sm: 640, lg: 1024 }`. */
  breakpoints: NumericBreakpoints;
  /** An explicit viewport width. */
  width?: number;
  /** A request User-Agent value. */
  userAgent?: string;
  /** Request headers from any runtime; names are matched case-insensitively. */
  headers?: Headers | Record<string, string>;
  /** Value returned when no detection source is usable. */
  fallback?: string;
  /** Restrict automatic detection to one source. @default 'auto' */
  strategy?: DetectBreakpointStrategy;
}

function sortedBreakpoints(breakpoints: NumericBreakpoints) {
  return Object.entries(breakpoints)
    .filter(([, width]) => Number.isFinite(width))
    .sort(([, left], [, right]) => left - right);
}

function header(
  headers: DetectBreakpointOptions['headers'],
  name: string,
): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === 'function')
    return (headers as Headers).get(name) ?? undefined;

  const record = headers as Record<string, string>;
  const match = Object.keys(record).find((key) => key.toLowerCase() === name);
  return match ? record[match] : undefined;
}

function validWidth(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) && value >= 0;
}

function widthFromHeaders(headers: DetectBreakpointOptions['headers']) {
  const value =
    header(headers, 'sec-ch-viewport-width') ??
    header(headers, 'viewport-width');
  const width = value === undefined ? Number.NaN : Number.parseFloat(value);
  return validWidth(width) ? width : undefined;
}

function breakpointForWidth(points: Array<[string, number]>, width: number) {
  return (
    points.filter(([, minimum]) => width >= minimum).at(-1)?.[0] ??
    points[0]![0]
  );
}

function breakpointForUserAgent(
  points: Array<[string, number]>,
  userAgent: string | undefined,
) {
  if (!userAgent) return undefined;
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent))
    return breakpointForWidth(points, 768);
  if (/Mobi|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(userAgent))
    return points[0]![0];
  return points.at(-1)![0];
}

/**
 * Detect the closest configured minimum-width breakpoint without relying on a
 * framework, browser globals, or runtime dependencies.
 */
export function detectBreakpoint(options: DetectBreakpointOptions): string {
  try {
    const points = sortedBreakpoints(options.breakpoints);
    const fallback = options.fallback ?? points.at(-1)?.[0] ?? '';
    if (!points.length) return fallback;

    const strategy = options.strategy ?? 'auto';
    if (
      (strategy === 'auto' || strategy === 'width') &&
      validWidth(options.width)
    )
      return breakpointForWidth(points, options.width!);

    if (strategy === 'auto' || strategy === 'client-hints') {
      const hintedWidth = widthFromHeaders(options.headers);
      if (hintedWidth !== undefined)
        return breakpointForWidth(points, hintedWidth);

      const mobileHint = header(options.headers, 'sec-ch-ua-mobile');
      if (mobileHint === '?1') return points[0]![0];
      if (mobileHint === '?0') return points.at(-1)![0];
    }

    if (strategy === 'auto' || strategy === 'user-agent')
      return breakpointForUserAgent(points, options.userAgent) ?? fallback;

    return fallback;
  } catch {
    return options.fallback ?? '';
  }
}
