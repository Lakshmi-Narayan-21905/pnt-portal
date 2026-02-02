import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AnnouncementService } from '../../services/announcementService';
import type { Announcement } from '../../types';
import { Bell, Calendar, User } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';
import { useTheme } from '../../hooks/useTheme';

const StudentAnnouncements: React.FC = () => {
    const theme = useTheme();
    const { userProfile } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile && userProfile.department) {
            fetchAnnouncements();
            // Mark as read
            localStorage.setItem('lastReadAnnouncementTime', Date.now().toString());
            window.dispatchEvent(new Event('announcementsRead'));
        }
    }, [userProfile]);

    const fetchAnnouncements = async () => {
        if (!userProfile?.department) return;
        try {
            setLoading(true);
            // Pass the student's department to get 'all' + 'dept' targeted announcements
            const data = await AnnouncementService.getAnnouncementsForStudent(userProfile.department);
            setAnnouncements(data);
        } catch (err) {
            console.error("Failed to fetch announcements", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading announcements...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-indigo-600" />
                    Announcements
                </h1>
                <p className="text-gray-500 text-sm mt-1">Updates from Training & Placement Cell</p>
            </div>

            {announcements.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Announcements Yet</h3>
                    <p className="text-gray-500 mt-2">You're all caught up! Check back later for updates.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((ann) => (
                        <div key={ann.id} className={`bg-white rounded-xl shadow-sm border ${theme.border} p-6 hover:shadow-md transition-shadow`}>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold text-gray-900">{ann.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${ann.authorRole.includes('HEAD')
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {ann.authorRole === 'TRAINING_HEAD' ? 'Training Cell' :
                                        ann.authorRole === 'PLACEMENT_HEAD' ? 'Placement Cell' : 'Dept Coordinator'}
                                </span>
                            </div>

                            <p className="text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed">
                                {ann.content}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-50 pt-3">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDateTime(ann.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    To: {ann.targetDepts?.includes('all') ? 'All Depts' : (ann.targetDepts?.join(', ') || 'Me')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentAnnouncements;
