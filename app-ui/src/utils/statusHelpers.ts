export function getStatusBadgeClass(appointmentStatusId: number): string {
  switch (appointmentStatusId) {
    case 1: return 'bg-amber-100 text-amber-800';    // Proposed
    case 2: return 'bg-green-100 text-green-800';     // Confirmed
    case 3: return 'bg-slate-100 text-slate-600';     // Cancelled
    case 4: return 'bg-gray-100 text-gray-600';       // Completed
    case 5: return 'bg-red-100 text-red-800';         // NoShow
    case 6: return 'bg-blue-100 text-blue-800';       // CheckedIn
    case 7: return 'bg-purple-100 text-purple-800';   // InTherapy
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(statusName: string): string {
  const labels: Record<string, string> = {
    'Proposed': 'Proposed',
    'Confirmed': 'Confirmed',
    'Cancelled': 'Cancelled',
    'Completed': 'Completed',
    'NoShow': 'No Show',
    'CheckedIn': 'Checked In',
    'InTherapy': 'In Therapy',
  };
  return labels[statusName] || statusName;
}

export function getStatusDotColor(appointmentStatusId: number): string {
  switch (appointmentStatusId) {
    case 1: return 'bg-amber-400';
    case 2: return 'bg-green-400';
    case 3: return 'bg-slate-400';
    case 4: return 'bg-gray-400';
    case 5: return 'bg-red-400';
    case 6: return 'bg-blue-400';
    case 7: return 'bg-purple-400';
    default: return 'bg-gray-400';
  }
}
