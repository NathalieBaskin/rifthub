import { useNavigate } from "react-router-dom";

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const go = () => navigate(`/shop/product/${product.id}`);

  return (
    <div
      className="relative bg-white rounded-2xl shadow hover:shadow-lg transition p-4 
                 flex flex-col items-center justify-between h-72 w-full cursor-pointer"
      onClick={go}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && go()}
    >
      {/* Produktbild */}
      <div className="relative flex items-center justify-center w-full h-48">
        <img
          src={product.image_url}
          alt={product.name}
          className="max-h-full max-w-full object-contain rounded"
        />

        {product.isNew && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            NEW
          </span>
        )}
      </div>

      {/* Produktnamn */}
      <p className="mt-3 text-center text-black font-medium line-clamp-2">
        {product.name}
      </p>
    </div>
  );
}
