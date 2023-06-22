/** @jsxImportSource react */
import { useState, useCallback, useRef } from 'react';
import '../../styles/stork-default.css';
import './Search.css';

import { createPortal } from 'react-dom';
import SearchModal from './SearchModal/SearchModal.jsx';

export default function Search() {
	const [isOpen, setIsOpen] = useState(false);

	const openSearch = useCallback(() => {
		setIsOpen(true);
	}, [setIsOpen]);

	const closeSearch = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	return (
		<>
			<button type="button" onClick={openSearch} className="search-input">
				<svg width="24" height="24" fill="none">
					<path
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>

				<span>Search</span>

				<span className="search-hint">
					<span className="sr-only">Press </span>

					<kbd>/</kbd>

					<span className="sr-only"> to search</span>
				</span>
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
