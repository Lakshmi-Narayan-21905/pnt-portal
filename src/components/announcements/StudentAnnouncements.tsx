import React, { useState, useEffect } from 'react';
import { AnnouncementService } from '../../services/announcementService';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement } from '../../types';
import { Calendar, Megaphone, User } from 'lucide-react';

const StudentAnnouncements: React.FC = () => {
    const { userProfile } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStudentAnnouncements = async () => {
        if (!userProfile) return;
        try {
            setLoading(true);
            const data = await AnnouncementService.getAnnouncementsForStudent(userProfile.department);
            setAnnouncements(data);
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentAnnouncements();
        // Mark as read
        localStorage.setItem('lastReadAnnouncementTime', Date.now().toString());
        window.dispatchEvent(new Event('announcementsRead'));
    }, [userProfile]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                <p className="text-gray-500">Stay updated with latest news and drives</p>
            </div>

            {announcements.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Megaphone className="w-8 h-8 text-brand-blue" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Announcements</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {announcements.map((ann) => (
                        <div
                            key={ann.id}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center
                                        ${ann.type === 'DRIVE' ? 'bg-purple-100 text-purple-600' :
                                            ann.type === 'TRAINING' ? 'bg-green-100 text-green-600' :
                                                'bg-blue-100 text-blue-600'}
                                    `}>
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{ann.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {ann.authorName} ({ann.authorRole})
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(ann.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {ann.type !== 'GENERAL' && (
                                    <span className={`
                                        px-3 py-1 rounded-full text-xs font-bold tracking-wide
                                        ${ann.type === 'DRIVE' ? 'bg-purple-50 text-purple-700' :
                                            ann.type === 'TRAINING' ? 'bg-green-50 text-green-700' :
                                                'bg-blue-50 text-blue-700'}
                                    `}>
                                        {ann.type}
                                    </span>
                                )}
                            </div>

                            <div className="pl-13 ml-13 border-l-2 border-gray-50 pl-4">
                                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                                    {ann.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentAnnouncements;
