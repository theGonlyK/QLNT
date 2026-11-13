import { optimizeSvgString } from './svgOptimize';

export const DEFAULT_SVG_BUDGET_BYTES = 50 * 1024; // 50 KB (< 50 KB constraint)
export const ICON_SVG_BUDGET_BYTES = 5 * 1024; // 5 KB

export interface SvgBudgetAuditResult {
  rawSize: number;
  optimizedSize: number;
  isUnderBudget: boolean;
  budgetBytes: number;
  compressionRatio: number;
  optimizedSvg: string;
}

/**
 * Audits an SVG string against a size budget (defaults to 50 KB)
 * after passing through SVGO optimization.
 */
export function auditSvgSizeBudget(
  svgString: string,
  budgetBytes: number = DEFAULT_SVG_BUDGET_BYTES
): SvgBudgetAuditResult {
  const rawSize = Buffer.byteLength(svgString, 'utf8');
  const optimizedSvg = optimizeSvgString(svgString);
  const optimizedSize = Buffer.byteLength(optimizedSvg, 'utf8');
  const isUnderBudget = optimizedSize <= budgetBytes;
  const compressionRatio = rawSize > 0 ? (rawSize - optimizedSize) / rawSize : 0;

  return {
    rawSize,
    optimizedSize,
    isUnderBudget,
    budgetBytes,
    compressionRatio,
    optimizedSvg,
  };
}
