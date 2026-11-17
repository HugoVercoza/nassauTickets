import { BrowserRouter, Routes, Route } from "react-router-dom";
import Emissao from "./pages/emissao";
import Home from "./pages/home";
import Guiche from "./pages/guiche";
import Historico from "./pages/historico";
import dados from "./data/dados.json";
import MenuNavegacao from "./components/MenuNavegacao";
import Painel from './pages/painel';
import Login from './pages/login';
import Adm from './pages/adm';
import { useEffect, useState } from "react";
import ProtectedRoute from "./components/protectedRoute";

function App() {
  useEffect(() => {
    const key = "senhas";

    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(dados));
      console.log("localStorage criado");
    }
  }, []);
  

  const [sessao, setSessao] = useState(()=>{
    const sessaoSalva = localStorage.getItem("sessao");
    if (sessaoSalva!= null){
      return JSON.parse(sessaoSalva)
    }
    else{
      return null;
    }
})

  function iniciarSessao(usuario){
    setSessao(usuario);
    localStorage.setItem("sessao", JSON.stringify(usuario));  

  }

  function encerrarSessao(){
    setSessao(null);
    localStorage.removeItem("sessao");
  
  }

  return (
    <BrowserRouter>
      <MenuNavegacao sessao={sessao} encerrarSessao={encerrarSessao}/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogin= {iniciarSessao}/>} />
        <Route path="/emissao" element={<Emissao />} />
        <Route path="/guiche" element={<ProtectedRoute sessao={sessao} tipoPermitido="ATENDENTE"><Guiche/></ProtectedRoute>
          } />
        <Route path="/historico" element={<ProtectedRoute sessao={sessao} tipoPermitido="GESTOR"><Historico /></ProtectedRoute>} />
        <Route path="/painel" element={<Painel />}/>
        <Route path="/adm" element={<ProtectedRoute sessao={sessao} tipoPermitido="GESTOR"> <Adm/> </ProtectedRoute>}/>
        
        
        </Routes>
    </BrowserRouter>
  );
}

export default App;
