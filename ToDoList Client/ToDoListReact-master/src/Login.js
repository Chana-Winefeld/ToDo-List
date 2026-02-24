import React, { useState } from 'react';
import service from './service';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await service.login(username, password);
            if (onLogin) onLogin();
        } catch (err) {
            setError('שם משתמש או סיסמה שגויים, נסי שוב.');
            console.error("Login failed", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-logo" style={{ width: '100%' }}>
            <div className="auth-logo" style={{ marginBottom: 0 }}>
                <h1>my<span>tasks</span></h1>
                <p>ברוכה הבאה חזרה</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form" style={{ marginTop: 32 }}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="שם משתמש"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        dir="rtl"
                    />
                </div>
                <div className="input-group">
                    <input
                        type="password"
                        placeholder="סיסמה"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        dir="rtl"
                    />
                </div>
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? '...' : 'כניסה'}
                </button>
            </form>
        </div>
    );
};

export default Login;