export default function Footer() {
  return (
    <footer className="border-t border-rift-gold/15 bg-rift-bg/70">
      <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-gray-400 flex flex-wrap gap-x-6 gap-y-2 justify-center">
        <a href="https://www.leagueoflegends.com/en-gb/how-to-play/?_gl=1*1k2ux2u*_gcl_au*MTE4NzM0NjY2Ni4xNzU1NTkwMjQx" className="hover:text-gray-200">About LoL</a>
        <a href="https://support.riotgames.com/hc/en-us" className="hover:text-gray-200">Support</a>
        <a href="https://lolesports.com/en-GB/" className="hover:text-gray-200">Esports pro site</a>
        <a href="https://status.riotgames.com/?locale=en_US" className="hover:text-gray-200">Server status</a>
        <span className="text-gray-600">© {new Date().getFullYear()} RIFT HUB</span>
      </div>
    </footer>
  );
}
