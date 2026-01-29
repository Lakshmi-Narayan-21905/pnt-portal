import React from 'react';
import ManageCoordinators from '../placement/ManageCoordinators';

// Reusing Placement component for consistency, as they both view Dept Coordinators
const TrainingCoordinators: React.FC = () => {
    return <ManageCoordinators />;
};

export default TrainingCoordinators;
