    document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('no-js');

    if (typeof AOS !== 'undefined') {
        AOS.init();
    }

    // Menu Mobile Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links li a');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Fecha o menu ao clicar em um link
        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {
        // Lógica de Prazo: Bloqueia o formulário após 13/03/2026 às 23:59
        // O sufixo -03:00 garante que o horário seja respeitado no fuso de Brasília/Ceará
        const deadline = new Date('2026-03-13T23:59:59-03:00');
        const now = new Date();

        if (now > deadline) {
            const submitBtn = document.querySelector('.btn-submit');
            const inputs = registrationForm.querySelectorAll('input');
            const messageEl = document.getElementById('formMessage');

            // Desabilita o botão
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Inscrições Encerradas';
                submitBtn.style.background = '#444';
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.style.opacity = '0.7';
            }

            // Desabilita todos os campos
            inputs.forEach(input => {
                input.disabled = true;
                input.style.opacity = '0.6';
            });

            if (messageEl) {
                messageEl.textContent = 'O prazo para inscrições encerrou no dia 13/03 às 23:59.';
                messageEl.classList.add('error');
            }

            return; // Interrompe o código aqui para não adicionar o evento de submit
        }

        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = registrationForm.querySelector('.btn-submit');
            const messageEl = document.getElementById('formMessage');
            
            const teamName = document.getElementById('teamName').value.trim();
            
            if (!teamName) {
                Swal.fire({
                    title: 'Campo Obrigatório',
                    text: 'Por favor, preencha o nome da equipe.',
                    icon: 'warning',
                    confirmButtonColor: '#ff6b6b',
                    background: '#0a192f',
                    color: '#fff'
                });
                return;
            }
            if (teamName.length > 100) {
                Swal.fire({
                    title: 'Campo Muito Longo',
                    text: 'O nome da equipe deve ter no máximo 100 caracteres.',
                    icon: 'warning',
                    confirmButtonColor: '#ff6b6b',
                    background: '#0a192f',
                    color: '#fff'
                });
                return;
            }

            const names = registrationForm.querySelectorAll('.member-name');
            const matriculas = registrationForm.querySelectorAll('.member-matricula');
            const semestres = registrationForm.querySelectorAll('.member-semestre');
            const emails = registrationForm.querySelectorAll('.member-email');
            const phones = registrationForm.querySelectorAll('.member-phone');

            const members = [];
            for(let i = 0; i < 5; i++) {
                const name = names[i].value.trim();
                
                // Adiciona o integrante apenas se o campo de nome for preenchido
                if (name !== '') {
                    const matricula = matriculas[i].value.trim();
                    const semestre = semestres[i] ? semestres[i].value.trim() : '';
                    const email = emails[i].value.trim();
                    const phone = phones[i] ? phones[i].value.trim() : '';
                    let error = null;

                    // Validação: Se colocou o nome, obriga Semestre, Email e Telefone (Matrícula é opcional)
                    if (!semestre || !email || !phone) {
                        Swal.fire({
                            title: 'Dados Incompletos',
                            text: `Preencha Turma/Semestre, Email e Telefone para o integrante ${i + 1} (${name}).`,
                            icon: 'warning',
                            confirmButtonColor: '#ff6b6b',
                            background: '#0a192f',
                            color: '#fff'
                        });
                        return; // Para o envio do formulário
                    }
                    
                    // Validação de comprimento dos campos (frontend)
                    if (name.length > 100) error = `O nome do integrante ${i + 1} é muito longo (máx 100).`;
                    else if (matricula.length > 50) error = `A matrícula do integrante ${i + 1} é muito longa (máx 50).`;
                    else if (semestre.length > 50) error = `O campo Turma/Semestre do integrante ${i + 1} é muito longo (máx 50).`;
                    else if (email.length > 100) error = `O e-mail do integrante ${i + 1} é muito longo (máx 100).`;
                    else if (phone.length > 30) error = `O telefone do integrante ${i + 1} é muito longo (máx 30).`;

                    if (error) {
                        Swal.fire({ title: 'Campo Muito Longo', text: error, icon: 'warning', confirmButtonColor: '#ff6b6b', background: '#0a192f', color: '#fff' });
                        return;
                    }

                    members.push({
                        name: name,
                        matricula: matricula,
                        semestre: semestre,
                        email: email,
                        phone: phone
                    });
                }
            }

            if (members.length === 0) {
                Swal.fire({
                    title: 'Atenção',
                    text: 'Preencha os dados de pelo menos 1 integrante.',
                    icon: 'warning',
                    confirmButtonColor: '#ff6b6b',
                    background: '#0a192f',
                    color: '#fff'
                });
                return;
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
                    registrationForm.reset();
                } else {
                    Swal.fire({
                        title: 'Atenção!',
                        text: result.error,
                        icon: 'warning',
                        confirmButtonColor: '#ff6b6b',
                        background: '#0a192f',
                        color: '#fff'
                    });
                    console.error('Server returned an error:', result.error); // Linha adicionada para debug
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
