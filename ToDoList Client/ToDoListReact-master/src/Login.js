import React, { useState } from 'react';
import service from './service'; // ודאי שהנתיב ל-service.js נכון

const Login = ({ onLogin }) => { // מקבלים את הפונקציה onLogin מה-App
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault(); 
        setError(''); 

        try {
            // 1. קריאה לשרת וקבלת טוקן
            await service.login(username, password);
            
            // 2. עדכון הסטייט ב-App שההתחברות הצליחה
            if (onLogin) {
                onLogin(); 
            }
        } catch (err) {
            setError('שם משתמש או סיסמה שגויים, נסי שוב.');
            console.error("Login failed", err);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>כניסה למערכת</h2>
                <form onSubmit={handleLogin} style={styles.form}>
                    <input 
                        type="text" 
                        placeholder="שם משתמש" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="סיסמה" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    {error && <p style={styles.error}>{error}</p>}
                    <button type="submit" style={styles.button}>התחברי</button>
                </form>
            </div>
        </div>
    );
};

// עיצוב משופר קצת שיראה טוב יותר
const styles = {
    container: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        backgroundColor: '#f5f5f5' 
    },
    card: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '350px'
    },
    title: { textAlign: 'center', marginBottom: '20px', color: '#333' },
    form: { display: 'flex', flexDirection: 'column' },
    input: { 
        padding: '12px', 
        marginBottom: '15px', 
        borderRadius: '4px', 
        border: '1px solid #ddd',
        fontSize: '16px'
    },
    button: { 
        padding: '12px', 
        backgroundColor: '#007bff', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    },
    error: { color: '#e74c3c', fontSize: '14px', marginBottom: '10px', textAlign: 'center' }
};

export default Login;