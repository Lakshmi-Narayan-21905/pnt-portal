import React, { useState, useEffect } from 'react';
import { AnnouncementService } from '../../services/announcementService';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement } from '../../types';
import { Plus, Trash2, Megaphone, Calendar, Users, Briefcase } from 'lucide-react';

const DEPARTMENTS = [
    'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'
];

const ManageAnnouncements: React.FC = () => {
    const { userProfile } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetDepts, setTargetDepts] = useState<string[]>(['all']);

    const fetchMyAnnouncements = async () => {
        if (!userProfile) return;
        try {
            setLoading(true);
            const data = await AnnouncementService.getAnnouncementsByAuthor(userProfile.uid);
            setAnnouncements(data);
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userProfile) {
            fetchMyAnnouncements();
            // Mark as read (Managers also see valid unread badge if they are target)
            localStorage.setItem('lastReadAnnouncementTime', Date.now().toString());
            window.dispatchEvent(new Event('announcementsRead'));
        }
    }, [userProfile]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        try {
            await AnnouncementService.createAnnouncement({
                title,
                content,
                targetDepts, // New Array schema
                authorId: userProfile.uid,
                authorName: userProfile.displayName || 'Coordinator',
                authorRole: userProfile.role,
                type: 'GENERAL'
            });

            // Reset form
            setTitle('');
            setContent('');
            setTargetDepts(['all']);
            setIsCreating(false);
            fetchMyAnnouncements();
        } catch (error) {
            console.error("Failed to create announcement", error);
            alert("Failed to create announcement");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            try {
                await AnnouncementService.deleteAnnouncement(id);
                fetchMyAnnouncements();
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    const toggleDept = (dept: string) => {
        if (dept === 'all') {
            if (targetDepts.includes('all')) {
                setTargetDepts([]);
            } else {
                setTargetDepts(['all']);
            }
            return;
        }

        let newDepts = [...targetDepts];
        if (newDepts.includes('all')) {
            newDepts = newDepts.filter(d => d !== 'all');
        }

        if (newDepts.includes(dept)) {
            newDepts = newDepts.filter(d => d !== dept);
        } else {
            newDepts.push(dept);
        }

        if (newDepts.length === 0) setTargetDepts(['all']); // Default back to all if empty? Or allow empty?
        else setTargetDepts(newDepts);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Announcements</h1>
                    <p className="text-gray-500">Create and manage announcements for students</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Create New
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-down">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
                                placeholder="Announcement Title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Departments</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTargetDepts(['all'])}
                                    className={`px-3 py-1 rounded-full text-sm border ${targetDepts.includes('all') ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    All Departments
                                </button>
                                {DEPARTMENTS.map(dept => (
                                    <button
                                        key={dept}
                                        type="button"
                                        onClick={() => toggleDept(dept)}
                                        className={`px-3 py-1 rounded-full text-sm border ${targetDepts.includes(dept) ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-600 border-gray-200'}`}
                                    >
                                        {dept}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <textarea
                                required
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
                                placeholder="Write your announcement here..."
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-brand-blue text-white rounded-xl hover:bg-blue-700 font-medium"
                            >
                                Post Announcement
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full mx-auto"></div>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No announcements created yet</p>
                    </div>
                ) : (
                    announcements.map(ann => (
                        <div key={ann.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{ann.title}</h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(ann.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {ann.targetDepts?.join(', ') || ann.targetDept || 'All'}
                                        </span>
                                        {ann.type !== 'GENERAL' && (
                                            <span className="px-2 py-0.5 bg-blue-50 text-brand-blue rounded text-xs font-medium">
                                                {ann.type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(ann.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-gray-600 whitespace-pre-wrap">{ann.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ManageAnnouncements;
