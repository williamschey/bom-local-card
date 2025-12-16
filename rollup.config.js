import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/bom-local-radar-card.ts',
  output: {
    file: 'dist/bom-local-radar-card.js',
    format: 'es',
  },
  onwarn(warning, warn) {
    if (warning.code === 'THIS_IS_UNDEFINED') {
      return;
    }
    warn(warning);
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
  // Dependencies are bundled (not external) so the card works in HA
  // HA doesn't provide lit or custom-card-helpers globally
};







