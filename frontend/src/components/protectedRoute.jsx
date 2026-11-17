import { Navigate } from "react-router-dom";

export default function ProtectedRoute({children, sessao, tipoPermitido}){
    const autenticado = !!sessao;
    if (!autenticado){
        return <Navigate to="/login" replace/>
    }
    if(sessao.tipo !==tipoPermitido){
        return <Navigate to="/painel" replace />
    }
    
    return children;
}