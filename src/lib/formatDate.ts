export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  
  // Extract just the YYYY-MM-DD part if it's an ISO string or datetime
  const datePart = dateString.split('T')[0].split(' ')[0];
  
  // Parse YYYY-MM-DD
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
}
