import { Navigate, Link } from 'react-router-dom';

export default function ProtectedRoute({ children, apenasGestor = false }) {
  const dadosSalvos = localStorage.getItem('sessao') || localStorage.getItem('usuario');

  let sessao = null;
  try {
    sessao = dadosSalvos ? JSON.parse(dadosSalvos) : null;
  } catch {
    sessao = null;
  }

  const token = sessao?.token || localStorage.getItem('token');
  const tipo = sessao?.tipo || sessao?.usuario?.tipo;

  if (!sessao && !token) {
    return <Navigate to="/login" replace />;
  }

  if (apenasGestor && tipo !== 'GESTOR') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <h2>403 — Acesso Negado</h2>
        <p>Esta área é exclusiva para usuários com perfil <strong>GESTOR</strong>.</p>
        <Link to="/guiche" style={{ color: '#3498db', fontWeight: 'bold' }}>
          Voltar para o Terminal do Atendente
        </Link>
      </div>
    );
  }

  return children;
}