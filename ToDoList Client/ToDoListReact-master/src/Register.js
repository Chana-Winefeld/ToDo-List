import React, { useState } from 'react';
import service from './service';

const Register = ({ onBackToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            await service.register(username, password);
            setMessage('נרשמת בהצלחה! מעביר לדף הכניסה...');
            setTimeout(() => onBackToLogin(), 2000);
        } catch (err) {
            setError('ההרשמה נכשלה. יתכן ששם המשתמש כבר תפוס.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <div className="auth-logo" style={{ marginBottom: 0 }}>
                <h1>my<span>tasks</span></h1>
                <p>צרי חשבון חדש</p>
            </div>

            <form onSubmit={handleRegister} className="auth-form" style={{ marginTop: 32 }}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="בחרי שם משתמש"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        dir="rtl"
                    />
                </div>
                <div className="input-group">
                    <input
                        type="password"
                        placeholder="בחרי סיסמה"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        dir="rtl"
                    />
                </div>
                {message && <div className="auth-success">{message}</div>}
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? '...' : 'הרשמה'}
                </button>
                <div className="auth-divider"><span>או</span></div>
                <button type="button" className="auth-switch-btn" onClick={onBackToLogin}>
                    יש לי כבר חשבון — להתחברות
                </button>
            </form>
        </div>
    );
};

export default Register;