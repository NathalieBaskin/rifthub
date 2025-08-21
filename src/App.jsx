export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-lg font-extrabold tracking-wide">RIFT HUB</div>
          <nav className="hidden md:flex gap-4 text-sm">
            <a className="hover:text-blue-600" href="#">Summoner's Hall</a>
            <a className="hover:text-blue-600" href="#">The Rift Tavern</a>
            <a className="hover:text-blue-600" href="#">Legends Browser</a>
          </nav>
          <button className="md:hidden p-2 rounded hover:bg-gray-200" aria-label="Open menu">☰</button>
        </div>
      </header>

      {/* FEATURED NEWS */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="text-base font-bold mb-3">FEATURED NEWS</h2>

          {/* mobile-first: horisontell scroll på mobil, grid på desktop */}
          <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-3 md:overflow-visible">
            {[1,2,3].map((n) => (
              <article key={n} className="min-w-[85%] md:min-w-0 bg-white rounded-lg shadow overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/rifthub${n}/800/400`}
                  alt={`news ${n}`}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold mb-1">Nyhet {n}: Rubrik</h3>
                  <p className="text-sm text-gray-600">
                    Kort beskrivning av nyheten. Den klipps efter ett par rader.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CHAMPION CTA */}
        <section className="max-w-3xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-extrabold tracking-wide">CHOOSE YOUR CHAMPION</h2>
          <p className="mt-3 text-gray-700">
            Oavsett om du vill in i kaoset, supporta laget eller tänka strategiskt – det finns en plats för dig.
          </p>
          <button className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow">
            DISCOVER MORE CHAMPIONS
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-200 text-sm text-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          © 2025 RIFT HUB
        </div>
      </footer>
    </div>
  );
}
