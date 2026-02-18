(function () {
    'use strict';

    const WEBHOOK_URL = 'https://srv772985.hstgr.cloud/api/w/automacoes/jobs/run/f/f/imersao_clinica_100k/novo_lead';
    const WEBHOOK_TOKEN = '0DFn6iuIVixXZyfVzU0sNawUYancFPZL';
    const CHECKOUT_BASE = 'https://pay.kirvano.com/9810a5f6-6966-4d78-93fa-7e213459999c';

    const overlay = document.getElementById('leadModal');
    const form = document.getElementById('leadForm');
    const btnSubmit = form.querySelector('.modal-submit');
    const inputNome = document.getElementById('leadNome');
    const inputEmail = document.getElementById('leadEmail');
    const inputTel = document.getElementById('leadTel');

    // ─── Open / Close ───
    function openModal(e) {
        e.preventDefault();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(function () { inputNome.focus(); }, 300);
    }

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    document.querySelector('.modal-close').addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    // ─── Connect all CTA buttons ───
    document.querySelectorAll('.cta-btn, .bar-cta').forEach(function (btn) {
        btn.addEventListener('click', openModal);
    });

    // ─── Phone mask (BR mobile): (XX) XXXXX-XXXX ───
    inputTel.addEventListener('input', function () {
        var v = this.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);

        if (v.length > 6) {
            v = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
        } else if (v.length > 2) {
            v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
        } else if (v.length > 0) {
            v = '(' + v;
        }
        this.value = v;
    });

    // ─── Validation ───
    function validateNome() {
        var val = inputNome.value.trim();
        var err = inputNome.parentElement.querySelector('.field-error');
        if (val.length < 3) {
            inputNome.classList.add('input-error');
            err.textContent = 'Informe seu nome completo';
            return false;
        }
        inputNome.classList.remove('input-error');
        err.textContent = '';
        return true;
    }

    function validateEmail() {
        var val = inputEmail.value.trim();
        var err = inputEmail.parentElement.querySelector('.field-error');
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(val)) {
            inputEmail.classList.add('input-error');
            err.textContent = 'Informe um e-mail válido';
            return false;
        }
        inputEmail.classList.remove('input-error');
        err.textContent = '';
        return true;
    }

    function validateTel() {
        var raw = inputTel.value.replace(/\D/g, '');
        var err = inputTel.parentElement.querySelector('.field-error');
        // BR mobile: 11 digits, 3rd digit must be 9
        if (raw.length !== 11 || raw[2] !== '9') {
            inputTel.classList.add('input-error');
            err.textContent = 'Informe um celular válido com DDD';
            return false;
        }
        inputTel.classList.remove('input-error');
        err.textContent = '';
        return true;
    }

    inputNome.addEventListener('blur', validateNome);
    inputEmail.addEventListener('blur', validateEmail);
    inputTel.addEventListener('blur', validateTel);

    // ─── Collect URL params ───
    function getUrlParams() {
        var params = {};
        var search = window.location.search.substring(1);
        if (!search) return params;
        search.split('&').forEach(function (pair) {
            var parts = pair.split('=');
            if (parts[0]) {
                params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
            }
        });
        return params;
    }

    // ─── Build checkout URL ───
    function buildCheckoutUrl(nome, email, telefone) {
        var url = new URL(CHECKOUT_BASE);
        url.searchParams.set('name', nome);
        url.searchParams.set('email', email);
        url.searchParams.set('phone', telefone);

        var urlParams = getUrlParams();
        Object.keys(urlParams).forEach(function (key) {
            url.searchParams.set(key, urlParams[key]);
        });

        return url.toString();
    }

    // ─── Submit ───
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var v1 = validateNome();
        var v2 = validateEmail();
        var v3 = validateTel();
        if (!v1 || !v2 || !v3) return;

        var nome = inputNome.value.trim();
        var email = inputEmail.value.trim();
        var telefone = inputTel.value.replace(/\D/g, '');

        btnSubmit.disabled = true;
        btnSubmit.classList.add('loading');

        var checkoutUrl = buildCheckoutUrl(nome, email, telefone);

        var payload = { nome: nome, email: email, telefone: telefone };
        console.log('[Lead Modal] Enviando webhook…', payload);

        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + WEBHOOK_TOKEN
            },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                console.log('[Lead Modal] Status:', res.status, res.statusText);
                return res.text();
            })
            .then(function (body) {
                console.log('[Lead Modal] Resposta:', body);
                window.location.href = checkoutUrl;
            })
            .catch(function (err) {
                console.error('[Lead Modal] Erro no webhook:', err);
                window.location.href = checkoutUrl;
            });
    });
})();
