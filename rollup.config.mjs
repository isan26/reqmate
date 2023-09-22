import typescript from '@rollup/plugin-typescript';

export default [{
    input: 'src/index.ts',
    output: [
        { file: 'lib/reqmate.esm.js', format: 'es' },
        { file: 'lib/reqmate.umd.js', format: 'umd', name: 'reqmate' },
        { file: 'lib/reqmate.cjs.js', format: 'cjs' }
    ],
    plugins: [typescript()]
}];
