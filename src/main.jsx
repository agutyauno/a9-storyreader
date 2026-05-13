import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { setupAssetFallback } from './utils/assetFallback.js'

// Initialize the global asset fallback error handler
setupAssetFallback();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
