import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ 
  icon = '📦', 
  title = 'Nothing here yet', 
  message = 'Start adding items to see them here.',
  actionText,
  actionLink
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-8xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">{message}</p>
      {actionText && actionLink && (
        <Link 
          to={actionLink}
          className="bg-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
