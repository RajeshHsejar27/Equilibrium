import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeMockData } from './lib/mockData'

// Original implementation (retained mock data for better user experience):
initializeMockData().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})



// Conditional loading: mock data only in development
// const initializeApp = async () => {
//   // Only load mock data in development
//   if (import.meta.env.DEV) {
//     await initializeMockData()
//   }
  
//   ReactDOM.createRoot(document.getElementById('root')!).render(
//     <React.StrictMode>
//       <App />
//     </React.StrictMode>,
//   )
// }

// initializeApp()
