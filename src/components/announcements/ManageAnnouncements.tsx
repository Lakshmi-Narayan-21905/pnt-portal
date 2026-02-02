import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AnnouncementService } from '../../services/announcementService';
import type { Announcement } from '../../types';
import { Send, Trash2, AlertCircle, Calendar, User } from 'lucide-react';

const ManageAnnouncements: React.FC = () => {
    const { userProfile } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [myAnnouncements, setMyAnnouncements] = useState<Announcement[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (userProfile) {
            fetchMyAnnouncements();
        }
    }, [userProfile]);

    const fetchMyAnnouncements = async () => {
        if (!userProfile) return;
        try {
            setFetching(true);
            const data = await AnnouncementService.getAnnouncementsByAuthor(userProfile.uid);
            setMyAnnouncements(data);
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Determine targetDept based on role
            let targetDept = 'all';
            if (userProfile.role === 'DEPT_COORDINATOR') {
                if (!userProfile.department) {
                    throw new Error("Your profile does not have a department assigned.");
                }
                targetDept = userProfile.department;
            }

            await AnnouncementService.createAnnouncement({
                title,
                content,
                authorId: userProfile.uid,
                authorRole: userProfile.role,
                authorName: userProfile.displayName || 'Staff',
                targetDept
            });

            setSuccess('Announcement published successfully.');
            setTitle('');
            setContent('');
            fetchMyAnnouncements(); // Refresh list
        } catch (err: any) {
            setError(err.message || "Failed to publish announcement.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;
        try {
            await AnnouncementService.deleteAnnouncement(id);
            setMyAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            alert("Failed to delete.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-600" />
                    Create Announcement
                </h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g., Upcoming Infosys Drive"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Enter announcement details..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Target: <span className="font-semibold text-gray-700">
                                {userProfile?.role === 'DEPT_COORDINATOR' ? `Only ${userProfile.department} Students` : 'All Students'}
                            </span>
                        </span>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'Publishing...' : 'Publish Announcement'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">You Recently Posted</h3>

                {fetching ? (
                    <div className="text-center py-8 text-gray-400">Loading history...</div>
                ) : myAnnouncements.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">No announcements posted yet.</div>
                ) : (
                    <div className="space-y-4">
                        {myAnnouncements.map((ann) => (
                            <div key={ann.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900">{ann.title}</h4>
                                    <button
                                        onClick={() => handleDelete(ann.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">{ann.content}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(ann.date).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        To: {ann.targetDept === 'all' ? 'All Depts' : ann.targetDept}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageAnnouncements;
