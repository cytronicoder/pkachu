### pKachu

A small web app for searching and exploring IUPAC pKa dissociation constants data curated by [Zheng, Jonathan W. and Lafontant-Joseph, Olivier](../README.md). This tool provides an intuitive interface for chemists and researchers to query, filter, and export pKa values from the comprehensive IUPAC database.

As they say, gotta catch 'em all!

#### Features

With p(i)Kachu, you can:

- Search by compound name, SMILES notation, pKa value, or any other field
- Filter by pKa type, value range, temperature, assessment status, and more
- Sort by any column with multi-level sorting support
- Export filtered results to CSV or JSON formats
- Works seamlessly on desktop and mobile devices
- Built with screen reader support and keyboard navigation
- Debounced search and memoized calculations for smooth user experience

#### Installation

**Prerequisites**: Node.js (version 16 or higher) + npm or pnpm

To **set up** the project locally:

1. Clone the repository:

   ```bash
   git clone https://github.com/IUPAC/Dissociation-Constants.git
   cd Dissociation-Constants/web
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

#### Project Structure

```
web/
├── public/
│   ├── data.csv          # pKa database
│   └── pkachu.png        # App logo
├── src/
│   ├── components/
│   │   ├── About.jsx     # About page
│   │   └── SearchInterface.jsx  # Main search component
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # App entry point
│   ├── styles.css        # Global styles
│   └── index.html        # HTML template
├── package.json
└── vite.config.js
```

#### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

When contributing, please ensure to:

1. Follow the existing code style
2. Add tests for new features
3. Ensure accessibility compliance
4. Update documentation as needed

#### License

Please refer to the [main repository](https://github.com/IUPAC/Dissociation-Constants) for licensing information.

![Pikachu doing chemistry](/web/public/pkachu.png)
