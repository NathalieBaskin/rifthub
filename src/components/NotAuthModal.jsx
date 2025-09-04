// src/components/NotAuthModal.jsx
export default function NotAuthModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex justify-center items-start"
      onClick={onClose}
    >
      <div
        className="mt-32 bg-white border border-rift-gold/60 rounded-xl shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-rift-gold mb-3">
          You need to log in
        </h2>
        <p className="text-gray-700 mb-4">
          This feature is only available for logged-in members.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-gray-400/50 text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
          <a
            href="/auth"
            className="px-3 py-1.5 rounded border border-rift-gold/60 text-rift-gold hover:bg-yellow-50"
          >
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}
