import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';

const RubricForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState([
    { name: '', description: '', weight: 0 },
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) fetchRubric();
  }, [id]);

  const fetchRubric = async () => {
    try {
      const { data } = await api.get('/faculty/rubrics');
      if (data.success) {
        const rubric = data.rubrics.find((r) => r._id === id);
        if (rubric) {
          setTitle(rubric.title);
          setDescription(rubric.description);
          setCriteria(rubric.criteria);
        } else {
          navigate('/faculty/rubrics');
        }
      }
    } catch (err) {
      console.error('Failed to fetch rubric', err);
    }
  };

  const handleCriterionChange = (index, field, value) => {
    const newCriteria = [...criteria];
    newCriteria[index][field] = value;
    setCriteria(newCriteria);
  };

  const addCriterion = () => {
    setCriteria([...criteria, { name: '', description: '', weight: 0 }]);
  };

  const removeCriterion = (index) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (Math.abs(totalWeight - 100) > 0.1) {
      return setError('Total criteria weight must equal exactly 100%.');
    }

    setSaving(true);
    try {
      const payload = { title, description, criteria };
      if (isEditing) {
        await api.put(`/faculty/rubrics/${id}`, payload);
      } else {
        await api.post('/faculty/rubrics', payload);
      }
      navigate('/faculty/rubrics');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save rubric');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isEditing ? 'Edit Rubric' : 'Create New Rubric'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rubric Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Essay Evaluation Rubric"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows="2"
              placeholder="Briefly describe what this rubric is for..."
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Grading Criteria</h2>
              <p className="text-sm text-gray-500 mt-1">Define the attributes the AI should look for. Total weight must equal 100%.</p>
            </div>
            <div className={`font-bold text-lg ${Math.abs(totalWeight - 100) < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
              Total Weight: {totalWeight}%
            </div>
          </div>

          <div className="space-y-4">
            {criteria.map((c, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-200 relative">
                {criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                  >
                    &times; Remove
                  </button>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Criterion Name</label>
                    <input
                      type="text"
                      required
                      value={c.name}
                      onChange={(e) => handleCriterionChange(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      placeholder="e.g., Logical Flow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight (%)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={c.weight}
                      onChange={(e) => handleCriterionChange(index, 'weight', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description / AI Instructions</label>
                  <textarea
                    required
                    value={c.description}
                    onChange={(e) => handleCriterionChange(index, 'description', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    rows="2"
                    placeholder="Provide specific instructions for the AI on how to grade this criterion..."
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCriterion}
            className="mt-4 text-indigo-600 font-medium hover:text-indigo-800 text-sm flex items-center"
          >
            + Add Another Criterion
          </button>
        </div>

        <div className="pt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/faculty/rubrics')}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || Math.abs(totalWeight - 100) > 0.1}
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {saving ? 'Saving...' : 'Save Rubric'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RubricForm;
