/** @jsxImportSource preact */

import { useEffect, useRef } from 'preact/hooks'
import { createPortal } from 'preact/compat';
import { initTurtleAnimation } from './turtle-animation'
import './PageBottomAnimation.scss'

const PAGE_EXTENSION_DELAY = 1000
const PAGE_EXTENSION_MAX_COUNT = 7

// helper method
const isPageFullyScrolled = () => {
  // reference: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled
  const rootHtml = document.documentElement
  const isPageScrollable = rootHtml.scrollHeight - rootHtml.clientHeight > 1

  return isPageScrollable
    ? Math.abs(rootHtml.scrollHeight - rootHtml.clientHeight - rootHtml.scrollTop) < 2
    : true
}

function BottomPageAnimation () {
  // local-state
  const rootEl = useRef(null) // A ref instance for the root el of this component
  const canvasEl = useRef(null)
  const audioEl = useRef(null)
  const extensionCount = useRef(0)
  const timerId = useRef(null)

  // methods
  const extendPageAfterDelay = () => {
    clearTimeout(timerId.current)
    timerId.current = setTimeout(() => {
      if (isPageFullyScrolled()) {
        // if the scroll-bar still stays at the bottom of the page after the delay, extend the page.
        extensionCount.current += 1
        rootEl.current.style.height = `${extensionCount.current * 100}vh`
        rootEl.current.classList.add('is-active')

        if (extensionCount.current === 1) {
          // initialize the turtle animation if this is the first time extending the page.
          initTurtleAnimation(canvasEl.current, audioEl.current, extensionCount)
        }
      }
    }, PAGE_EXTENSION_DELAY)
  }

  const pageScrollHandler = (e) => {
    console.log('@@  page scrolling!!')
    if (isPageFullyScrolled() &&
      extensionCount.current < PAGE_EXTENSION_MAX_COUNT) {
        extendPageAfterDelay()
    }
  }

  const pageResizeHandler = (e) => {
    if (extensionCount.current > 0) { // if the animation is active, make sure to the canvas size is always the same as the viewport
      canvasEl.current.width = document.body.clientWidth
      canvasEl.current.height = innerHeight
    }
  }

  // effects
  useEffect(() => {
    console.log('@@ component mounted!!')
    window.addEventListener('scroll', pageScrollHandler)
    window.addEventListener('resize', pageResizeHandler)
    pageScrollHandler()

    return () => { 
      window.removeEventListener('scroll', pageScrollHandler)
      window.removeEventListener('resize', pageResizeHandler)
    }
  }, [])

  return (
    <div ref={rootEl} className='page-bottom-animation-container'>
      <canvas id='turtle-canvas' ref={canvasEl}></canvas>
      <audio id='turtle-audio' ref={audioEl}></audio>
    </div>
  )
}

export default function Portal () {
  return (
    createPortal(
      <BottomPageAnimation />,
      document.body
    )
  )
}
