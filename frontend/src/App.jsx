import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Emissao from "./pages/emissao";
import Home from "./pages/home";
import Guiche from "./pages/guiche";
import Historico from "./pages/historico";
import Painel from "./pages/painel";
import Login from "./pages/login";
import Adm from "./pages/adm";
import MenuNavegacao from "./components/MenuNavegacao";
import ProtectedRoute from "./components/protectedRoute";
import dados from "./data/dados.json";

function App() {
  useEffect(() => {
    const key = "senhas";
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(dados));
    }
  }, []);

  const [sessao, setSessao] = useState(() => {
    const sessaoSalva = localStorage.getItem("sessao");
    return sessaoSalva != null ? JSON.parse(sessaoSalva) : null;
  });

  function iniciarSessao(usuario) {
    setSessao(usuario);
    localStorage.setItem("sessao", JSON.stringify(usuario));
  }

  function encerrarSessao() {
    setSessao(null);
    localStorage.removeItem("sessao");
  }

  return (
    <BrowserRouter>
      <MenuNavegacao sessao={sessao} encerrarSessao={encerrarSessao} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogin={iniciarSessao} />} />
        <Route path="/emissao" element={<Emissao />} />
        <Route
          path="/guiche"
          element={
            <ProtectedRoute sessao={sessao}>
              <Guiche />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historico"
          element={
            <ProtectedRoute sessao={sessao}>
              <Historico />
            </ProtectedRoute>
          }
        />
        <Route path="/painel" element={<Painel />} />
        <Route
          path="/adm"
          element={
            <ProtectedRoute sessao={sessao} apenasGestor={true}>
              <Adm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;