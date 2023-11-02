/** @jsxImportSource preact */
import { useState, useCallback } from 'preact/hooks';
import '@/styles/stork-default.scss';
import './Search.scss';

import { createPortal } from 'preact/compat';
import SearchModal from './search-modal/SearchModal.jsx';

export default function Search() {
	const [isOpen, setIsOpen] = useState(false);

	const openSearch = () => {
		setIsOpen(true);
	};

	const closeSearch = useCallback(() => {
		setIsOpen(false);
	}, []);

	return (
		<>
			<button type="button" onClick={openSearch} className="search-input">
        <svg aria-label="Search" class="astro-gkc36pom astro-lq7oo3uf" width="16" height="16" viewBox="0 0 24 24"
          fill="currentColor" style="--sl-icon-size: 1em;">
            <path d="M21.71 20.29 18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a.999.999 0 0 0 1.42 0 1 1 0 0 0 0-1.39ZM11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"></path>
        </svg>

				<span>Search</span>

				<svg aria-label="(Press / to Search)" class="sl-hidden md:sl-block astro-gkc36pom astro-lq7oo3uf" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="--sl-icon-size: 1em;">
          <path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Zm3 15a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10Z"></path>
          <path d="M15.293 6.707a1 1 0 1 1 1.414 1.414l-8.485 8.486a1 1 0 0 1-1.414-1.415l8.485-8.485Z"></path>
        </svg>
			</button>

			{isOpen &&
				createPortal(
					<SearchModal
						closeModal={closeSearch} />,
					document.body
				)}
		</>
	);
}
