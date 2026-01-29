import React from 'react';
import ManageTrainings from '../admin/ManageTrainings';

// Reusing the Admin component as the functionality is identical for now
// In a real app, we might wrap this to restrict certain actions or customize the view
const TrainingPrograms: React.FC = () => {
    return <ManageTrainings />;
};

export default TrainingPrograms;
