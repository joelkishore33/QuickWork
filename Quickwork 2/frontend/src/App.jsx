import React from "react";
import { useSession } from "./state/SessionContext.jsx";
import SignIn from "./pages/SignIn.jsx";
import StudentApp from "./pages/StudentApp.jsx";
import ListerApp from "./pages/ListerApp.jsx";
import AdminApp from "./pages/AdminApp.jsx";
import { Spinner } from "./components/ui.jsx";

export default function App() {
  const { user, loading } = useSession();

  if (loading) return <Spinner label="Loading QuickWork…" />;
  if (!user) return <SignIn />;

  if (user.role === "STUDENT") return <StudentApp />;
  if (user.role === "LISTER") return <ListerApp />;
  return <AdminApp />;
}
