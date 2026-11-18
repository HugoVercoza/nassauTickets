import Botao from '../components/botao';
import '../styles/emissao.css';
import {useState} from 'react';
import { emitirSenha, listarSenhas } from '../services/atendimentoService';




export default function Emissao(){

    const [atendimento, setAtendimento] = useState('');
    function AtendimentoGeral(){
        setAtendimento('Atendimento Geral');
        
    }
    function AtendimentoPrioritario(){
        setAtendimento('Atendimento Prioritário');
        
    }   
    function AtendimentoExame(){
        setAtendimento('Atendimento Exame');
        
    }


    
    const [Senha ,setSenha] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    async function EmitirSenha(){
        if (enviando) return;
        let tipo = '';
        if (atendimento ==='Atendimento Geral'){
            tipo= 'SG';
            
        }
        else if (atendimento === 'Atendimento Prioritário'){
            tipo= 'SP';         
        }
        else if (atendimento === 'Atendimento Exame'){
            tipo= 'SE';
            
            
        }
        else if (atendimento === ''){
            alert('Selecione o tipo de atendimento antes de emitir a senha');
            return;
        }
        setEnviando(true); setErro('');
        try {
        const senha = await emitirSenha(tipo);
        console.log(senha.numero)

        
        setSenha(senha.numero);
        void listarSenhas().catch(() => {});
        } catch (e) { setErro(e.message); } finally { setEnviando(false); }
      
    }

    function Reiniciar(){
        setAtendimento('');
        setSenha('');


    } 

    
    
    

    return(
        
        <div className="container">
        <div>
            <h1>Escolha o tipo de atendimento: </h1>
            <Botao className={atendimento === 'Atendimento Geral' ? "botaoSelecionado" : "botao"} texto="Atendimento Geral" onClick={AtendimentoGeral}></Botao>
            <Botao className={atendimento === 'Atendimento Prioritário' ? "botaoSelecionado" : "botao"} texto="Atendimento Prioritário" onClick={AtendimentoPrioritario}></Botao>
            <Botao className={atendimento === 'Atendimento Exame' ? "botaoSelecionado" : "botao"} texto="Atendimento Exame" onClick={AtendimentoExame}></Botao>
        </div>
        <div>
            <h2>Emitir Senha</h2>
            {enviando && <p role="status">Emitindo senha...</p>}
            {erro && <p role="alert">{erro} Clique em Emitir Senha para tentar novamente.</p>}
            <Botao className="botao" texto="Emitir Senha" disabled={enviando} onClick={EmitirSenha} ></Botao>
            <h2 className="senha">{Senha && `Senha Emitida: ${Senha}`}</h2>
            <Botao className="botao" texto= "Reiniciar" onClick= {Reiniciar} ></Botao>
        </div>
        </div>
    )   
    
}
