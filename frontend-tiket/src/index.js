import React from 'react';
import ReactDOM from 'react-dom/client'; // Mengimpor library ReactDOM
import App from './App'; // Mengimpor komponen utama

const root = ReactDOM.createRoot(document.getElementById('root')); // Membuat root
root.render(
    <React.StrictMode>
        <App /> {/* Merender komponen utama */}
    </React.StrictMode>
);
