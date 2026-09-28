import React, { useState } from 'react';
import { submitFeedback } from '../api';
import { Send, CheckCircle, Star } from 'lucide-react';

export default function StudentDashboard() {
  const [formData, setFormData] = useState({
    department: '',
    semester: '',
    subject: '',
    rating: 5,
    text: '',
    worked_well: [],
    needs_improvement: []
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const workedWellOptions = [
    "Clear explanation", "Good examples", "Practical work",
    "Good pace", "Helpful faculty", "Good resources"
  ];

  const needsImprovementOptions = [
    "More practicals", "Too fast", "Too much theory",
    "Difficult topic", "More examples needed", "Better resources", "Infrastructure issue"
  ];

  const toggleChip = (category, option) => {
    setFormData(prev => {
      const current = prev[category];
      const updated = current.includes(option) 
        ? current.filter(item => item !== option)
        : [...current, option];
      return { ...prev, [category]: updated };
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitFeedback(formData);
      setMessage('Feedback submitted successfully! Thank you.');
      setFormData({ department: '', semester: '', subject: '', rating: 5, text: '', worked_well: [], needs_improvement: [] });
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage('Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <h2 className="text-3xl font-extrabold relative z-10">Student Feedback Portal</h2>
          <p className="mt-2 text-indigo-100 relative z-10">Your voice matters. Help us improve the learning experience.</p>
        </div>
        
        <div className="p-8 sm:p-10">
          {message && (
            <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.includes('success') && <CheckCircle size={20} />}
              <p className="font-medium">{message}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                <select 
                  name="department" 
                  value={formData.department} 
                  onChange={handleChange} 
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none" 
                  required
                >
                  <option value="" disabled>Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Semester</label>
                <select 
                  name="semester" 
                  value={formData.semester} 
                  onChange={handleChange} 
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none" 
                  required
                >
                  <option value="" disabled>Select Semester</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <select 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleChange} 
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none" 
                  required
                >
                  <option value="" disabled>Select Subject</option>
                  <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                  <option value="Database Management">Database Management</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                <div className="flex items-center h-[50px] gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setFormData({...formData, rating: num})}
                      className={`p-2 rounded-full transition-all ${formData.rating >= num ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-200'}`}
                    >
                      <Star fill={formData.rating >= num ? "currentColor" : "none"} size={28} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">What worked well?</label>
                <div className="flex flex-wrap gap-2">
                  {workedWellOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleChip('worked_well', opt)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.worked_well.includes(opt)
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">What needs improvement?</label>
                <div className="flex flex-wrap gap-2">
                  {needsImprovementOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleChip('needs_improvement', opt)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.needs_improvement.includes(opt)
                          ? 'bg-rose-100 text-rose-700 border-2 border-rose-500'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Detailed Feedback <span className="text-gray-400 font-normal">(Optional)</span></label>
              <textarea name="text" value={formData.text} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl h-24 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none" placeholder="Please share any other thoughts..."></textarea>
            </div>
            
            <button disabled={loading} className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-70 mt-8 text-lg">
              {loading ? 'Submitting...' : (
                <>
                  <Send size={20} />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
