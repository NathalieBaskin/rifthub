export default function StartSida() {
  return (
    <>
      {/* Featured News */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-base font-bold mb-3">FEATURED NEWS</h2>

        {/* mobile-first: scroll på mobil, grid på desktop */}
        <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-3 md:overflow-visible">
          {[1, 2, 3].map((n) => (
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

      {/* Champion CTA */}
      <section className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-extrabold tracking-wide">CHOOSE YOUR CHAMPION</h2>
        <p className="mt-3 text-gray-700">
          Oavsett om du vill in i kaoset, supporta laget eller tänka strategiskt – det finns en plats för dig.
        </p>
        <a
          href="/champions"
          className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
        >
          DISCOVER MORE CHAMPIONS
        </a>
      </section>
    </>
  );
}
