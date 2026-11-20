"use client";

import Link from "next/link";
import { HeartIcon, useFavorites } from "@/components/favorites/FavoritesProvider";

const iconLink = "relative flex h-10 w-9 items-center justify-center text-black hover:text-neutral-600 max-[359px]:w-8 sm:w-10";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="notranslate absolute right-0 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Account, favorites and cart icons on the right of the menu bar. */
export function HeaderIcons({ cartCount, signedIn }: { cartCount: number; signedIn: boolean }) {
  const { handles } = useFavorites();
  return (
    <div className="flex items-center">
      <Link href={signedIn ? "/account" : "/account/login"} aria-label={signedIn ? "My account" : "Sign in or create an account"} title={signedIn ? "My account" : "Sign in"} className={iconLink}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20.5c1.2-3.8 4-5.7 7.5-5.7s6.3 1.9 7.5 5.7" strokeLinecap="round" />
        </svg>
        {/* Small dot = signed in */}
        {signedIn && <span aria-hidden className="absolute right-1.5 top-2 h-2 w-2 rounded-full border border-white bg-black" />}
      </Link>
      <Link href="/favorites" aria-label={`Favorites (${handles.length})`} title="Favorites" className={iconLink}>
        <HeartIcon size={22} />
        <Badge count={handles.length} />
      </Link>
      <Link href="/cart" aria-label={`Cart (${cartCount})`} title="Cart" className={`${iconLink} -mr-2 sm:mr-0`}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2.5 3.5h2.6l2.3 11h11.1l2-7.5H6.3" />
          <circle cx="9" cy="19.5" r="1.4" />
          <circle cx="17" cy="19.5" r="1.4" />
        </svg>
        <Badge count={cartCount} />
      </Link>
    </div>
  );
}
