AOS.init();

document.getElementById('registrationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = document.querySelector('.btn-submit');
    const messageEl = document.getElementById('formMessage');
    
    // Coleta dados do time
    const teamName = document.getElementById('teamName').value;
    
    // Coleta dados dos membros (seleciona todos os inputs por classe)
    const names = document.querySelectorAll('.member-name');
    const matriculas = document.querySelectorAll('.member-matricula');
    const emails = document.querySelectorAll('.member-email');
    const phones = document.querySelectorAll('.member-phone'); // Apenas o líder tem telefone obrigatório no HTML, mas pegamos todos se houver

    const members = [];
    for(let i = 0; i < 5; i++) {
        members.push({
            name: names[i].value,
            matricula: matriculas[i].value,
            email: emails[i].value,
            phone: phones[i] ? phones[i].value : '' // Pega telefone se existir input para aquele indice
        });
    }

    const formData = {
        teamName: teamName,
        members: members
    };

    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    messageEl.textContent = '';
    messageEl.className = 'message';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            Swal.fire({
                title: 'Sucesso!',
                text: result.message,
                icon: 'success',
                confirmButtonColor: '#007bff',
                background: '#0a192f',
                color: '#fff'
            });
            document.getElementById('registrationForm').reset();
        } else {
            Swal.fire({
                title: 'Atenção!',
                text: result.error,
                icon: 'warning',
                confirmButtonColor: '#ff6b6b',
                background: '#0a192f',
                color: '#fff'
            });
        }

    } catch (error) {
        console.error('Erro:', error);
        messageEl.textContent = 'Erro ao conectar com o servidor.';
        messageEl.classList.add('error');
    } finally {
        submitBtn.textContent = 'Confirmar Inscrição da Equipe';
        submitBtn.disabled = false;
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
