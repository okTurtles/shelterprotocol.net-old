/** @jsxImportSource preact */
import { useState, useEffect, useRef } from 'preact/hooks'
import { classNames } from '../../../utils.ts'
import { STORK } from '../../../consts.ts'
import './SearchModal.css'

const { registrationName } = STORK
/* This is a search-box modal component hooked up with stork-search(https://stork-search.net/docs) library */
export default function SearchModal ({
  closeModal,
  onInput = null,
  classes = ''
}) {
  // local state
  const [searchStr, setSearchStr] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isIndexReady, setIsIndexReady] = useState(false)

  // methods
  const handleFormSubmit = (e) => {
    e.preventDefault()
  }
  const handleInput = (e) => {
    const { value = '' } = e.target

    onInput && onInput(e)
    setSearchStr(value)
  }
  const handleBgClick = (e) => {
    const element = document.elementFromPoint(e.clientX, e.clientY).closest('.search-modal__interface')

    if (!element) {
      closeModal()
    }
  }
  const initStork = async () => {
    try {
      const result = await stork.register(
        registrationName,
        window.location.origin + '/search-index/index_en.st',
        {
          forceOverwrite: true,
          minimumQueryLength: 2
        }
      )

      setIsIndexReady(true)
    } catch (e) {
      alert('An error occured while loading/preparing the search indexes: ', e.message)
    }
  }

  // effects
  useEffect(() => {
    initStork()
  }, [])

  const formElClass = classNames(
    'search-modal__input-container',
    {
      'is-focused': isInputFocused,
      'is-disabled': !isIndexReady
    }
  )

  return (
    <div className={`search-modal ${classes}`}
      onClick={handleBgClick}>
      <div className='search-modal__backdrop'></div>

      <div className='search-modal__interface stork-wrapper'>
        <form onSubmit={handleFormSubmit}
          noValidate={true}
          className={formElClass}>
          <label className='search-modal__input-label' htmlFor='search-input'>
            <svg className='search-modal__search-icon' width="24" height="24" fill="none">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </label>

          <input className='search-modal__input'
            id='search-input'
            autoComplete='off'
            type='text'
            placeholder='Search...'
            data-stork={registrationName}
            onInput={handleInput}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)} />

          <button className='search-modal__cancel-btn'
            type='button'
            onClick={() => closeModal()}>
            Cancel
          </button>
        </form>

        <div className='search-modal__output-container stork-output'
          data-stork={`${registrationName}-output`}>
        </div>
      </div>
    </div>
  )
}
