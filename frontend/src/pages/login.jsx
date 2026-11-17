import {useState} from "react"
import "../styles/login.css"
import Botao from "../components/botao";
import { Eye, EyeOff } from "lucide-react";
import { Autenticar } from "../services/authService";
import {useNavigate} from "react-router-dom"


export default function Login({onLogin}) {
    const[login, setLogin] = useState('');
    const[senha, setSenha] = useState('');
    const[error, setError]= useState('');
    const[mostrarSenha, setMostrarSenha]= useState(false)
    const[loading, setLoading]= useState(false)
    const navegar= useNavigate()
    


    const handleSubmit= async (e) =>{
        e.preventDefault();
        setError('');

        if (!senha || !login){
            setError("Preencha todos os campos")
            return;
        }
        setLoading(true)

        try{
            const data = await Autenticar(login, senha);
            console.log("Usuário recebido:", data.usuario);
            console.log("Tipo de usuário:", data.usuario.tipo);
            onLogin(data.usuario);
            if (data.usuario.tipo === "GESTOR"){
                navegar("/adm", { replace: true });
            } else if (data.usuario.tipo === "ATENDENTE"){
                navegar("/guiche", { replace: true });
            } else{
                setError("Tipo de usuário não reconhecido");
            };

            
         
    } catch (erro) {
    setError(erro.message);

} finally {
    setLoading(false);
}}
    
    function Visibilidade(){
        setMostrarSenha(!mostrarSenha);
        }  
        
    


    return( 
            
        <div className="formulario1">   
            <h1>Login</h1>
            {error && <p>{error}</p>}

            <form onSubmit={handleSubmit}>
                <p></p>
                <label className="label" htmlFor="email">User</label> 
                
                <input className="email"  id="email" placeholder="User" value={login} onChange={(evento) => setLogin(evento.target.value)} ></input>

                <label className="label" htmlFor="senha">Senha</label>
            
                <div className="campo-senha">
                <input className= "senha" type={mostrarSenha ? "text":"password"} id="senha" placeholder="Senha" value={senha} onChange={(evento) => setSenha(evento.target.value)}  ></input>
                    <Botao className="btnsenha" onClick={Visibilidade} type= "button" texto={mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}></Botao>
                </div>     
                
                    <Botao className="botao" texto={loading ? "Entrando...":"Entrar"} type = "submit" disabled= {loading} ></Botao>
                
            </form>
                
          
          
        
        </div>
    )}
