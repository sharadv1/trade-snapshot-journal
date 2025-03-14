
import { Navigate } from 'react-router-dom';

// This page is now replaced by Dashboard.tsx
export default function Index() {
  return <Navigate to="/" replace />;
}
