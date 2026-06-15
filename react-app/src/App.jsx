import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Contact from "./pages/Contact";
import Brand from "./pages/Brand";
import ScrollManager from "./components/ScrollManager";

import AdminApp from "./pages/admin/AdminApp";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import SuperOnly from "./pages/admin/SuperOnly";
import AdminBrands from "./pages/admin/AdminBrands";

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen font-sans dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollManager />
      <Routes>
        {/* 公开页面 */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/brands" element={<Brand />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* admin 登录页 */}
        <Route path="/admin/login" element={<AdminApp />} />

        {/* admin 后台 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminProducts />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route
            path="users"
            element={
              <SuperOnly>
                <AdminUsers />
              </SuperOnly>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
