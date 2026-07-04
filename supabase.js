const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-public-key';

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initSupabaseAuth() {
    await handleSupabaseAuthRedirect();
    await syncSupabaseSession();
}

async function handleSupabaseAuthRedirect() {
    try {
        if (window.location.search.includes('access_token') || window.location.search.includes('code')) {
            const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
            if (error) {
                console.error('Supabase auth callback error:', error.message);
                return;
            }

            if (data?.session) {
                await syncSupabaseSession(data.session);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    } catch (error) {
        console.error('Supabase auth redirect error:', error);
    }
}

async function syncSupabaseSession(sessionData) {
    try {
        const session = sessionData || (await getSupabaseSession());
        if (!session) {
            return null;
        }

        const user = session.user;
        const tempRole = localStorage.getItem('tempUserRole');
        const existingRole = localStorage.getItem('userRole');
        const role = tempRole || existingRole || 'buyer';

        const userInfo = {
            sub: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            avatar: user.user_metadata?.avatar_url || ''
        };

        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        localStorage.setItem('userRole', role);
        localStorage.removeItem('tempUserRole');
        return userInfo;
    } catch (error) {
        console.error('Supabase session sync error:', error);
        return null;
    }
}

async function getSupabaseSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting Supabase session:', error.message);
        return null;
    }
    return data.session;
}

async function supabaseSignInWithGoogle(role, redirectPath) {
    try {
        if (role) {
            localStorage.setItem('tempUserRole', role);
        }

        const redirectTo = `${window.location.origin}${redirectPath}`;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo
            }
        });

        if (error) {
            console.error('Supabase Google sign-in error:', error.message);
            showNotification('Unable to start Google sign-in. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Supabase sign-in error:', error);
        showNotification('Unable to start Google sign-in. Please try again.', 'error');
    }
}

async function supabaseSignOut() {
    try {
        const { error } = await supabase.auth.signOut();
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userRole');
        localStorage.removeItem('tempUserRole');
        if (error) {
            console.error('Supabase sign-out error:', error.message);
        }
    } catch (error) {
        console.error('Error signing out of Supabase:', error);
    }
}

document.addEventListener('DOMContentLoaded', initSupabaseAuth);
