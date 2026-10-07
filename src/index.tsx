/**
 * Main React Entry Point (Bootstrap).
 * This file acts as the mandatory bridge between the traditional HTML document (index.html)
 * and the dynamic React application (App.tsx).
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * 1. Target Identification: Locate the empty <div id="root"> element inside index.html.
 * This element will serve as the mounting point for the entire React virtual DOM.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find the root element to mount the React application.");
}

/**
 * 2. Application Rendering: Create a React root and inject the <App /> component inside it.
 * React.StrictMode is used during development to highlight potential problems, 
 * identify deprecated lifecycle methods, and detect unsafe side effects.
 */
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);