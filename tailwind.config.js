module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/routes/**/*.{svelte,js,ts}',
    './src/lib/**/*.{svelte,js,ts}'
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        'montfort': 'repeat(12, minmax(0, 1fr))',
      }
    }
  },
  plugins: [],
}
