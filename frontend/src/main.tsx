// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

const rootElement = document.getElementById('root'); // Находим элемент

if (!rootElement) {
  throw new Error("Failed to find the root element with ID 'root'"); // Добавим проверку
}

// Используем createRoot
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);