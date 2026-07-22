import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// ─── CSS Zoom Coordinate Correction ──────────────────────────────────────────
//
// Problem: CSS `html { zoom: 0.75 }` scales the page visually, but JavaScript
// coordinate APIs still return VISUAL pixels (post-zoom), while CSS positions
// are set in pre-zoom CSS pixels. This causes a mismatch:
//
//   MUI reads anchorEl.getBoundingClientRect() → gets visual px
//   MUI sets popup `left: visual_px` CSS inside zoomed html
//   Browser renders popup at visual_px * 0.75 → shifted left!
//
// Fix: Patch the two JS APIs that MUI relies on for layout:
//   1. getBoundingClientRect → return CSS px (visual px / zoom)
//   2. window.innerWidth/Height → return CSS-coordinate viewport size
//
// With these patches, MUI positions are computed in the same coordinate space
// as CSS, so popups, menus, tab indicators, and tooltips all render correctly.
//
// ─────────────────────────────────────────────────────────────────────────────
const DESKTOP_ZOOM = 0.75;
const DESKTOP_BREAKPOINT_PX = 960;

function applyZoomCoordinatePatches() {
  if (typeof window === 'undefined') return;
  if (window.innerWidth < DESKTOP_BREAKPOINT_PX) return;

  const factor = 1 / DESKTOP_ZOOM; // 1.3333...

  // 1. Patch Element.prototype.getBoundingClientRect
  //    Returns CSS coordinate-space values instead of visual pixel values.
  const _origGetBCR = Element.prototype.getBoundingClientRect;

  // Expose the original on window so components can call raw visual-px BCR
  // for elements in position:fixed ancestors (which are already in CSS px space
  // and must NOT be corrected a second time).
  (window as any).__origGetBCR = _origGetBCR;
  (window as any).__desktopZoom = DESKTOP_ZOOM;

  Element.prototype.getBoundingClientRect = function () {
    const r = _origGetBCR.call(this);
    const scaled: DOMRect = {
      top:    r.top    * factor,
      right:  r.right  * factor,
      bottom: r.bottom * factor,
      left:   r.left   * factor,
      width:  r.width  * factor,
      height: r.height * factor,
      x:      r.x      * factor,
      y:      r.y      * factor,
      toJSON() {
        return {
          top: this.top, right: this.right, bottom: this.bottom,
          left: this.left, width: this.width, height: this.height,
          x: this.x, y: this.y,
        };
      },
    } as DOMRect;
    return scaled;
  };

  // 2. Patch window.innerWidth / window.innerHeight (both on instance and prototype)
  const patchWindowProp = (prop: string) => {
    const desc = Object.getOwnPropertyDescriptor(Window.prototype, prop) || 
                 Object.getOwnPropertyDescriptor(window, prop);
    if (desc?.get) {
      const getter = desc.get;
      const patchedGetter = function(this: any) {
        return Math.round(getter.call(this) * factor);
      };
      
      try {
        Object.defineProperty(window, prop, {
          get: patchedGetter,
          configurable: true,
        });
      } catch (e) {}
      
      try {
        Object.defineProperty(Window.prototype, prop, {
          get: patchedGetter,
          configurable: true,
        });
      } catch (e) {}
    }
  };
  
  patchWindowProp('innerWidth');
  patchWindowProp('innerHeight');

  // 3. Patch document.documentElement clientWidth / clientHeight
  //    MUI Popover sometimes fallback to clientWidth/clientHeight of the html element.
  const patchHtmlProp = (prop: string) => {
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, prop);
    if (desc?.get) {
      const getter = desc.get;
      try {
        Object.defineProperty(document.documentElement, prop, {
          get: function(this: any) {
            return Math.round(getter.call(this) * factor);
          },
          configurable: true,
        });
      } catch (e) {}
    }
  };

  patchHtmlProp('clientWidth');
  patchHtmlProp('clientHeight');
}

applyZoomCoordinatePatches();
// ─────────────────────────────────────────────────────────────────────────────

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <App />
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
