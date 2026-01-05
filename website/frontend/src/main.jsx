import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

// Clear any existing content in root
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.innerHTML = ''; // Clear fallback content
}

// Ensure root element exists
if (!rootElement) {
  document.body.innerHTML = `
    <div style="
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 2rem;
    ">
      <h1>⚠️ Root Element Not Found</h1>
      <p>Make sure index.html has &lt;div id="root"&gt;&lt;/div&gt;</p>
    </div>
  `;
  throw new Error('Root element not found');
}

// Render React app
try {
  console.log('🚀 Starting React app...');
  console.log('Root element:', rootElement);
  console.log('React version:', React.version);
  
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('✅ React app rendered successfully');
} catch (error) {
  console.error('❌ Failed to render app:', error);
  
  // Show error in UI
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
        padding: 2rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      ">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Failed to Load Application</h1>
        <p style="margin: 1rem 0; font-size: 1.1rem;">${error.message || 'Unknown error'}</p>
        <p style="margin: 0.5rem 0; font-size: 0.9rem; opacity: 0.8;">Check browser console (F12) for details</p>
        <button onclick="window.location.reload()" style="
          padding: 0.75rem 1.5rem;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 600;
          margin-top: 1rem;
        ">Reload Page</button>
      </div>
    `;
  }
}
