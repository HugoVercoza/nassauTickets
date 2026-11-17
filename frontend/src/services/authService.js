export async function Autenticar(login, senha) {
    const resposta = await fetch("http://localhost:3000/login",{
        method:"POST",
        headers:{"Content-Type": "application/json"
        },
        body: JSON.stringify({
            login: login,
            senha: senha
        })
    });

const data = await resposta.json()
if (!resposta.ok){

 throw new Error(data.message ?? 'Falha no login')}
 
    return data
}