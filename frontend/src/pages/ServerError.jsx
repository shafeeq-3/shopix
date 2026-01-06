import React from 'react';
import { Link } from 'react-router-dom';

const ServerError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-600">500</h1>
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Server Error</h2>
          <p className="text-gray-600 mb-8">
            Something went wrong on our end. We're working to fix it.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            to="/" 
            className="block w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Go Home
          </Link>
          <button 
            onClick={() => window.location.reload()}
            className="block w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
