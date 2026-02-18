import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

// Shop pages
import HomePage from "@/features/shop/pages/HomePage";
import CatalogPage from "@/features/shop/pages/CatalogPage";
import ProductDetailPage from "@/features/shop/pages/ProductDetailPage";
import AboutPage from "@/features/shop/pages/AboutPage";
import ContactPage from "@/features/shop/pages/ContactPage";
import AccountPage from "@/features/shop/pages/AccountPage";

// Auth pages
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";

// Checkout
import CheckoutPage from "@/features/checkout/pages/CheckoutPage";

// Admin
import AdminLayout from "@/features/admin/layout/AdminLayout";
import DashboardPage from "@/features/admin/pages/DashboardPage";
import ProductsPage from "@/features/admin/pages/ProductsPage";
import CategoriesPage from "@/features/admin/pages/CategoriesPage";
import BrandsPage from "@/features/admin/pages/BrandsPage";
import OrdersPage from "@/features/admin/pages/OrdersPage";
import BannersPage from "@/features/admin/pages/BannersPage";
import SettingsPage from "@/features/admin/pages/SettingsPage";
import PaymentAccountsPage from "@/features/admin/pages/PaymentAccountsPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Shop */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/producto/:slug" element={<ProductDetailPage />} />
            <Route path="/nosotros" element={<AboutPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/cuenta" element={<AccountPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="productos" element={<ProductsPage />} />
              <Route path="categorias" element={<CategoriesPage />} />
              <Route path="marcas" element={<BrandsPage />} />
              <Route path="pedidos" element={<OrdersPage />} />
              <Route path="banners" element={<BannersPage />} />
              <Route path="configuracion" element={<SettingsPage />} />
              <Route path="pagos" element={<PaymentAccountsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
