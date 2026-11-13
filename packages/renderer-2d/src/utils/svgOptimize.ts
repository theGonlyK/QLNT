import { optimize, type Config as SvgoConfig } from 'svgo';

export function optimizeSvgString(svgString: string, options?: SvgoConfig): string {
  const result = optimize(svgString, {
    multipass: true,
    plugins: [
      'preset-default',
      'removeDimensions',
    ],
    ...options,
  });
  return result.data;
}
