import React, { useState } from 'react';
import service from './service';

const Register = ({ onBackToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            await service.register(username, password);
            setMessage('נרשמת בהצלחה! עכשיו אפשר להתחבר.');
            // אפשר להוסיף השהייה קלה ואז להחזיר לדף הלוגין
            setTimeout(() => onBackToLogin(), 2000);
        } catch (err) {
            setError('ההרשמה נכשלה. יתכן ששם המשתמש כבר תפוס.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>הרשמה למערכת</h2>
                <form onSubmit={handleRegister} style={styles.form}>
                    <input 
                        type="text" 
                        placeholder="בחר שם משתמש" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="בחר סיסמה" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    {message && <p style={styles.success}>{message}</p>}
                    {error && <p style={styles.error}>{error}</p>}
                    <button type="submit" style={styles.button}>הירשמי עכשיו</button>
                </form>
                <button onClick={onBackToLogin} style={styles.linkButton}>חזרה להתחברות</button>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' },
    card: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '350px' },
    title: { textAlign: 'center', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column' },
    input: { padding: '12px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ddd' },
    button: { padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    success: { color: 'green', textAlign: 'center', marginBottom: '10px' },
    error: { color: 'red', textAlign: 'center', marginBottom: '10px' },
    linkButton: { marginTop: '15px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', width: '100%' }
};

export default Register;