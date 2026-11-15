import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Books from './pages/Books.jsx'
import MyBorrows from './pages/MyBorrows.jsx'
import StaffIssue from './pages/staff/StaffIssue.jsx'
import StaffBorrows from './pages/staff/StaffBorrows.jsx'
import StaffStudents from './pages/staff/StaffStudents.jsx'

const STAFF = ['employee', 'admin']

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* logged-in pages share the navbar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Books />} />
          <Route path="/my-borrows" element={<MyBorrows />} />

          {/* staff only */}
          <Route element={<ProtectedRoute roles={STAFF} />}>
            <Route path="/staff/issue" element={<StaffIssue />} />
            <Route path="/staff/borrows" element={<StaffBorrows />} />
            <Route path="/staff/students" element={<StaffStudents />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
