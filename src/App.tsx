// src/App.jsx
import React from 'react';
import './App.css';

export default function App() {
  return (
    <div className="container">
      <header>
        <h1>Smart News</h1>
        <p>Your personalized news dashboard</p>
      </header>
      <main>
        <section className="card">
          <h2>Featured Article</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            varius enim in eros elementum tristique.
          </p>
          <button>Read More</button>
        </section>
      </main>
      <footer>
        <p>&copy; 2025 Smart News</p>
      </footer>
    </div>
  );
}
