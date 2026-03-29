import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Agendamentos from "./pages/Agendamentos.jsx";
import Clientes from "./pages/Clientes.jsx";
import Barbeiros from "./pages/Barbeiros.jsx";
import Caixa from "./pages/Caixa.jsx";
import Comissoes from "./pages/Comissoes.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="agendamentos" element={<Agendamentos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="barbeiros" element={<Barbeiros />} />
          <Route path="caixa" element={<Caixa />} />
          <Route path="comissoes" element={<Comissoes />} />
        </Route>

        {/* Qualquer rota desconhecida vai para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}