import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const RubricsList = () => {
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRubrics();
  }, []);

  const fetchRubrics = async () => {
    try {
      const { data } = await api.get('/faculty/rubrics');
      if (data.success) {
        setRubrics(data.rubrics);
      }
    } catch (err) {
      console.error('Failed to fetch rubrics', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRubric = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rubric?')) return;
    try {
      const { data } = await api.delete(`/faculty/rubrics/${id}`);
      if (data.success) {
        setRubrics(rubrics.filter((r) => r._id !== id));
      }
    } catch (err) {
      alert('Error deleting rubric');
    }
  };

  if (loading) return <div className="text-center py-10">Loading rubrics...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Rubrics</h1>
          <p className="text-gray-600 mt-2">Manage grading criteria for your evaluations.</p>
        </div>
        <button
          onClick={() => navigate('/faculty/rubrics/new')}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          + Create Rubric
        </button>
      </div>

      {rubrics.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No custom rubrics found. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rubrics.map((rubric) => (
            <div key={rubric._id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{rubric.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                {rubric.description || 'No description provided.'}
              </p>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Criteria Breakdown:</h4>
                <div className="space-y-1">
                  {rubric.criteria.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-600">
                      <span>{c.name}</span>
                      <span className="font-medium">{c.weight}%</span>
                    </div>
                  ))}
                  {rubric.criteria.length > 3 && (
                    <div className="text-xs text-gray-400 italic">+{rubric.criteria.length - 3} more...</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                <span className="text-xs text-gray-400">
                  {new Date(rubric.createdAt).toLocaleDateString()}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => navigate(`/faculty/rubrics/${rubric._id}/edit`)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRubric(rubric._id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RubricsList;
