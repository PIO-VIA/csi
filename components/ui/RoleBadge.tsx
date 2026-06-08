import React from 'react';
import Badge from './Badge';
import { UserRole } from '@/types';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  switch (role) {
    case 'ADMIN':
      return <Badge variant="success" className={className}>Admin</Badge>;
    case 'ASSURE':
      return <Badge variant="info" className={className}>Assuré</Badge>;
    case 'GENERALISTE':
      return <Badge variant="neutral" className={className}>Généraliste</Badge>;
    case 'SPECIALISTE':
      return <Badge variant="warning" className={className}>Spécialiste</Badge>;
    default:
      return <Badge variant="neutral" className={className}>{role}</Badge>;
  }
}

export default RoleBadge;
