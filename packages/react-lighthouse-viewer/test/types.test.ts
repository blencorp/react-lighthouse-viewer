import { expectTypeOf, test } from 'vitest';
import type { RendererOptions } from '../src/index.ts';

type CallbackOptionName = {
  [Name in keyof RendererOptions]-?: NonNullable<RendererOptions[Name]> extends Function
    ? Name
    : never;
}[keyof RendererOptions];

// LighthouseViewer passes each callback option by name. If a Lighthouse update adds a callback
// option, this test fails until the component passes the new one too.
test('LighthouseViewer handles every callback option', () => {
  expectTypeOf<CallbackOptionName>().toEqualTypeOf<
    | 'getStandaloneReportHTML'
    | 'onPageAnchorRendered'
    | 'onPrintOverride'
    | 'onSaveFileOverride'
    | 'onViewTrace'
  >();
});
