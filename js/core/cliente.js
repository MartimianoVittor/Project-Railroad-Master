import { SUPABASE } from '../config/supabase.js?v=mesa-44';

let promessaCliente;

export function obterCliente() {
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE.url.trim())
        || !/^(sb_publishable_|eyJ)/.test(SUPABASE.publishableKey.trim())) {
        return Promise.reject(new Error('Configure a URL e a chave pública do Supabase.'));
    }

    promessaCliente ??= import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm')
        .then(({ createClient }) => createClient(
            SUPABASE.url.trim(), SUPABASE.publishableKey.trim(),
            { auth: { storageKey: 'railroad-mestre-auth-v1', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
        ))
        .catch((erro) => {
            promessaCliente = null;
            throw erro;
        });

    return promessaCliente;
}

export function exigir(resultado) {
    if (resultado.error) throw new Error(resultado.error.message);
    return resultado.data;
}

export async function iniciarAutenticacao(cliente, aoAlterar) {
    cliente.auth.onAuthStateChange((evento, sessao) => {
        if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT'].includes(evento))
            queueMicrotask(() => { void aoAlterar(sessao?.user ?? null); });
    });

    const { data, error } = await cliente.auth.getSession();
    if (error) throw error;
    await aoAlterar(data.session?.user ?? null);
}

export async function entrarComGoogle(cliente) {
    const { error } = await cliente.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}${location.pathname}`, queryParams: { prompt: 'select_account' } },
    });
    if (error) throw error;
}

export async function sairDaConta(cliente) {
    const { error } = await cliente.auth.signOut();
    if (error) throw error;
}
