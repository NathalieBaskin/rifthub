// src/context/FavoritesContext.jsx
import { createContext, useEffect, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const FavoritesContext = createContext(undefined);

// Sätt till true om du vill se debug i konsolen
const DEBUG = false;

const log = (...args) => DEBUG && console.log("[Favorites]", ...args);

function storageKey(userId) {
  return `favorites_user_${userId || "guest"}`;
}

function normalizeId(id) {
  const n = Number(id);
  return Number.isNaN(n) ? id : n;
}

export function FavoritesProvider({ children, me }) {
  const [favorites, setFavorites] = useState([]);

  // 1) Ladda initialt: backend om inloggad, annars LS
  useEffect(() => {
    const load = async () => {
      const key = storageKey(me?.id);
      if (me?.id) {
        try {
          const r = await fetch(`http://localhost:5000/api/favorites/${me.id}`);
          if (r.ok) {
            const data = await r.json();
            const norm = Array.isArray(data)
              ? data.map(p => ({ ...p, id: normalizeId(p.id) }))
              : [];
            setFavorites(norm);
            localStorage.setItem(key, JSON.stringify(norm));
            log("Loaded from backend:", norm);
            return;
          }
        } catch (e) {
          log("Backend load failed, falling back to LS:", e);
        }
      }
      const stored = localStorage.getItem(key);
      const parsed = stored ? JSON.parse(stored) : [];
      const normLS = parsed.map(p => ({ ...p, id: normalizeId(p.id) }));
      setFavorites(normLS);
      log("Loaded from LS:", normLS);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  const persist = (next) => {
    const key = storageKey(me?.id);
    localStorage.setItem(key, JSON.stringify(next));
  };

  // 2) Toggle – optimistisk uppd, robust id-jämförelse, backend best-effort
  async function toggleFavorite(product) {
    if (!product?.id) {
      log("Toggle ignored: product saknar id", product);
      return false;
    }

    const prod = {
      id: normalizeId(product.id),
      name: product.name,
      price: product.price,
      image_url: product.image_url ?? null,
      isNew: !!product.isNew,
    };

    let addedNow = false;

    setFavorites((prev) => {
      const exists = prev.some((p) => normalizeId(p.id) === prod.id);
      let next;
      if (exists) {
        next = prev.filter((p) => normalizeId(p.id) !== prod.id);
        addedNow = false;
      } else {
        next = [...prev, prod];
        addedNow = true;
      }
      persist(next);
      log("Toggle:", { product: prod, exists, next });
      return next;
    });

    if (me?.id) {
      try {
        const res = await fetch("http://localhost:5000/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: me.id, productId: prod.id }),
        });
        // Vi bryr oss inte om svaret för UI:t – optimistiskt läge vinner
        if (!res.ok) log("Backend toggle non-OK:", res.status);
      } catch (e) {
        log("Backend toggle failed:", e);
      }
    }

    return addedNow;
  }

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}
