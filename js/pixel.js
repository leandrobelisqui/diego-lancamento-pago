/**
 * Meta Pixel + Conversions API - Imersao Clinica 100K+
 * Tracking: PageView, Lead | Parametros: UTMs, fbclid, user data
 */
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // CONFIGURACAO
    // ═══════════════════════════════════════════════════════════
    const PIXEL_ID = '1225035805917010';
    const CAPI_TOKEN = 'EAARuvhuUh70BQZBFXbFXelF2LZCgqhtSmD26YpnqQLtMUedX1RFcZBFJlwtQYuSrN96OzQWin0kdquiijFYvllCzPWwKAsxNDKf0ztZAitFQGROI2GzVrKo8D3npCtzVasHzjFD1cLLZCdJKgdErf52PMZC84rG3HK852cLFNXCVscHdE3jLZCI4I45ZBaeXXwZDZD';
    // TEST_EVENT_CODE removido - producao ativa
    const CAPI_URL = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

    // ═══════════════════════════════════════════════════════════
    // UTILIDADES
    // ═══════════════════════════════════════════════════════════
    function getUrlParams() {
        const params = {};
        const search = window.location.search.substring(1);
        if (!search) return params;
        search.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
        return params;
    }

    function generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    async function sha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text.toLowerCase().trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function parseName(fullName) {
        const parts = fullName.split(' ').filter(p => p.length > 0);
        return { fn: parts[0] || '', ln: parts.slice(1).join(' ') || '' };
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        return parts.length === 2 ? parts.pop().split(';').shift() : null;
    }

    // ═══════════════════════════════════════════════════════════
    // PIXEL BROWSER
    // ═══════════════════════════════════════════════════════════
    function initPixel() {
        const script = document.createElement('script');
        script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${PIXEL_ID}');fbq('track', 'PageView');`;
        document.head.appendChild(script);
    }

    function trackPixelEvent(eventName, params = {}, eventId = null) {
        if (typeof fbq === 'undefined') { console.warn('[Pixel] fbq nao carregado'); return; }
        const eventData = eventId ? [eventName, params, { eventID: eventId }] : [eventName, params];
        fbq('track', ...eventData);
        console.log('[Pixel] Evento:', eventName, params, eventId);
    }

    // ═══════════════════════════════════════════════════════════
    // CONVERSIONS API
    // ═══════════════════════════════════════════════════════════
    async function trackCAPIEvent(eventName, userData = {}, customData = {}, eventId = null) {
        const urlParams = getUrlParams();
        const evtId = eventId || generateEventId();
        const hashedUserData = {};

        if (userData.email) hashedUserData.em = await sha256(userData.email);
        if (userData.telefone) hashedUserData.ph = await sha256(userData.telefone);
        if (userData.nome) {
            const { fn, ln } = parseName(userData.nome);
            if (fn) hashedUserData.fn = await sha256(fn);
            if (ln) hashedUserData.ln = await sha256(ln);
        }

        const fbc = getCookie('_fbc') || urlParams.fbclid || null;
        const fbp = getCookie('_fbp') || null;
        const eventSourceUrl = window.location.href.split('?')[0];

        const payload = {
            data: [{
                event_name: eventName,
                event_time: Math.floor(Date.now() / 1000),
                event_id: evtId,
                event_source_url: eventSourceUrl,
                action_source: 'website',
                user_data: {
                    ...hashedUserData,
                    client_user_agent: navigator.userAgent,
                    ...(fbc && { fbc }),
                    ...(fbp && { fbp })
                },
                custom_data: customData
            }],
            access_token: CAPI_TOKEN
        };

        console.log('[CAPI] Enviando:', eventName, payload);

        try {
            const response = await fetch(CAPI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            console.log('[CAPI] Resposta:', result);
            return { success: true, eventId: evtId, result };
        } catch (error) {
            console.error('[CAPI] Erro:', error);
            return { success: false, error };
        }
    }

    // ═══════════════════════════════════════════════════════════
    // EVENTOS PUBLICOS
    // ═══════════════════════════════════════════════════════════
    async function trackPageView() {
        const eventId = generateEventId();
        const urlParams = getUrlParams();
        trackPixelEvent('PageView', { content_name: 'Imersao Clinica 100K+', content_category: 'Landing Page', ...urlParams }, eventId);
        await trackCAPIEvent('PageView', {}, { content_name: 'Imersao Clinica 100K+', content_category: 'Landing Page', ...urlParams }, eventId);
        console.log('[Tracking] PageView registrado');
    }

    async function trackLead(userData) {
        const eventId = generateEventId();
        const urlParams = getUrlParams();
        const customData = { content_name: 'Imersao Clinica 100K+', content_category: 'Lead', currency: 'BRL', value: 0, ...urlParams };
        trackPixelEvent('Lead', customData, eventId);
        await trackCAPIEvent('Lead', userData, customData, eventId);
        console.log('[Tracking] Lead registrado:', userData);
        return eventId;
    }

    // ═══════════════════════════════════════════════════════════
    // PARAMETROS PARA CHECKOUT
    // ═══════════════════════════════════════════════════════════
    function getCheckoutParams() {
        const urlParams = getUrlParams();
        const fbc = getCookie('_fbc') || urlParams.fbclid || null;
        const fbp = getCookie('_fbp') || null;
        const checkoutParams = { ...urlParams };
        if (fbc) checkoutParams.fbclid = fbc;
        if (fbp) checkoutParams.fbp = fbp;
        return checkoutParams;
    }

    function addTrackingParams(checkoutUrl) {
        const url = new URL(checkoutUrl);
        const trackingParams = getCheckoutParams();
        Object.keys(trackingParams).forEach(key => {
            if (trackingParams[key]) url.searchParams.set(key, trackingParams[key]);
        });
        return url.toString();
    }

    // ═══════════════════════════════════════════════════════════
    // INICIALIZACAO
    // ═══════════════════════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPixel);
    } else {
        initPixel();
    }

    window.MetaTracking = { trackPageView, trackLead, getCheckoutParams, addTrackingParams, getUrlParams };
})();
