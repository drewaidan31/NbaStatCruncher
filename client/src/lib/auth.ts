// Authentication utility functions with proper error handling

interface AuthResponse {
  success?: boolean;
  user?: any;
  error?: string;
  authenticated?: boolean;
}

const API_BASE = '';

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return { error: errorData.error || 'Login failed' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Network error during login' };
  }
}

export async function registerUser(email: string, password: string, firstName?: string, lastName?: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return { error: errorData.error || 'Registration failed' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Network error during registration' };
  }
}

export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/user`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Not authenticated' }));
      return { authenticated: false, error: errorData.error };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get user error:', error);
    return { authenticated: false, error: 'Network error' };
  }
}

export async function logoutUser(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Logout failed' }));
      return { error: errorData.error || 'Logout failed' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Logout error:', error);
    return { error: 'Network error during logout' };
  }
}