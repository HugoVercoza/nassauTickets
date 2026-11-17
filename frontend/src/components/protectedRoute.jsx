import { Navigate } from "react-router-dom";

export default function ProtectedRoute({children, sessao}){
    const autenticado = !!sessao;
    if (!autenticado){
        return <Navigate to="/login"/>
    }return children;
}