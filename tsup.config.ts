import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  outDir: 'build',
  entry: ['src'],
  loader: {
    '.html': 'copy',
    '.css': 'copy',
    '.png': 'copy',
  },
})