export async function Autenticar(email, senha) {
    const resposta = await fetch("",{
        method:"POST",
        headers:{"Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            senha: senha
        })
    });

const data = await resposta.json()
if (!response.ok) throw new Error(data.message ?? 'Falha no login')
 
    return data
}