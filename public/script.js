AOS.init();

document.getElementById('registrationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = document.querySelector('.btn-submit');
    const messageEl = document.getElementById('formMessage');
    
    const formData = {
        name: document.getElementById('name').value,
        matricula: document.getElementById('matricula').value,
        turma: document.getElementById('turma').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value
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
        submitBtn.textContent = 'Confirmar Inscrição';
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
