import React, { useEffect, useState } from 'react';
import service from './service.js';
import Login from './Login';
import Register from './Register'; // ודאי שיצרת קובץ כזה עם הקוד שנתתי קודם

function App() {
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);
  
  // האם המשתמש מחובר? (בודק אם יש טוקן בזיכרון של הדפדפן)
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  
  // האם להציג עכשיו את דף ההרשמה?
  const [isRegistering, setIsRegistering] = useState(false);

  async function getTodos() {
    try {
      const todos = await service.getTasks();
      setTodos(todos);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setIsAuthenticated(false);
      }
    }
  }

  // פונקציה שנקראת אחרי התחברות מוצלחת ב-Login.js
  const onLogin = () => {
    setIsAuthenticated(true);
  };

  // פונקציית התנתקות
  const onLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setTodos([]);
  };

  async function createTodo(e) {
    e.preventDefault();
    if (!newTodo.trim()) return;
    await service.addTask(newTodo);
    setNewTodo("");
    await getTodos();
  }

  async function updateCompleted(todo, isComplete) {
    await service.setCompleted(todo.id, isComplete);
    await getTodos();
  }

  async function deleteTodo(id) {
    await service.deleteTask(id);
    await getTodos();
  }

  useEffect(() => {
    if (isAuthenticated) {
      getTodos();
    }
  }, [isAuthenticated]);

  // --- שלב הרינדור (מה רואים על המסך) ---

  // 1. אם המשתמש לא מחובר
  if (!isAuthenticated) {
    return (
      <div className="auth-wrapper">
        {isRegistering ? (
          /* דף הרשמה */
          <Register onBackToLogin={() => setIsRegistering(false)} />
        ) : (
          /* דף התחברות + כפתור מעבר להרשמה */
          <div style={{ textAlign: 'center' }}>
            <Login onLogin={onLogin} />
            <button 
              onClick={() => setIsRegistering(true)} 
              style={styles.switchButton}
            >
              עוד לא רשומה? הירשמי כאן
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. אם המשתמש מחובר - מציגים את רשימת המשימות
  return (
    <section className="todoapp">
      <header className="header">
        <div style={{ textAlign: 'right', padding: '10px' }}>
            <button onClick={onLogout} style={styles.logoutButton}>התנתקות</button>
        </div>
        <h1>todos</h1>
        <form onSubmit={createTodo}>
          <input 
            className="new-todo" 
            placeholder="מה יש לנו לעשות היום?" 
            value={newTodo} 
            onChange={(e) => setNewTodo(e.target.value)} 
          />
        </form>
      </header>
      <section className="main" style={{ display: "block" }}>
        <ul className="todo-list">
          {todos.map(todo => (
            <li className={todo.isComplete ? "completed" : ""} key={todo.id}>
              <div className="view">
                <input 
                  className="toggle" 
                  type="checkbox" 
                  checked={todo.isComplete} 
                  onChange={(e) => updateCompleted(todo, e.target.checked)} 
                />
                <label>{todo.name}</label>
                <button className="destroy" onClick={() => deleteTodo(todo.id)}></button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section >
  );
}

// עיצובים קטנים לכפתורים בתוך ה-App
const styles = {
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
    marginTop: '10px'
  },
  logoutButton: {
    padding: '5px 10px',
    backgroundColor: '#ff4d4d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  }
};

export default App;