function redirectIndex() {
    window.location.href = "/index";
}

function redirectPagar() {
    window.location.href = "/boleto";
}

function redirectTransferir() {
    window.location.href = "/transfer";
}

function redirectSaque() {
    window.location.href = "/saque";
}

function redirectEmprestimo() {
    window.location.href = "/emprestimo";
}

function redirectDeposito() {
    window.location.href = '/deposito';
}

function redirectHistorico() {
    window.location.href = "/historico";
}

function redirectConfiguracoes() {
    window.location.href = "/config";
}

function redirectCartoes() {
    window.location.href = "/cartoes";
}

function redirectSaques() {
    window.location.href = "/saques";
}

function toggleDropdown() {
    const dropdown = document.getElementById("dropdownMenu");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}


window.onclick = function(event) {
    if (!event.target.matches('.fas.fa-cog')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.style.display === "block") {
                openDropdown.style.display = "none";
            }
        }
    }
}

function redirectLogin() {
    window.location.href = "/login";
}

function redirectCadastro() {
    window.location.href = "/cadastro";
}


function showErrorPopup(message) {
    const popup = document.getElementById('errorPopup');
    popup.querySelector('.popup-content').innerText = message;
    popup.style.display = 'block';

    setTimeout(() => {
        popup.style.display = 'none';
    }, 3000);
}

function adquirirCartao() {
    const usuarioId = 1;

    fetch('/adquirir_cartao', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario_id: usuarioId })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);

        if (data.message === 'Cartão gerado com sucesso!') {

            alert('Cartão gerado com sucesso!');
            const cartao = data.numero_cartao;
            const validade = data.validade;
            const cvv = data.cvv;

            console.log('CVV:', cvv);


            document.querySelector('.credit-card-info').innerHTML = `
                <h3>Informações do Cartão</h3>
                <div class="info">
                    <p><strong>Número do Cartão:</strong> ${cartao}</p>
                    <p><strong>Validade:</strong> ${validade}</p>
                    <p><strong>CVV:</strong> ${cvv}</p>
                </div>
            `;

            document.querySelector('#adquirir-cartao').style.display = 'none';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao adquirir cartão:', error);
        alert('Ocorreu um erro ao gerar o cartão.');
    });
}
