import React, { useEffect, useState } from 'react';
import service from './service.js';
import Login from './Login';
import Register from './Register';

function App() {
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
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

  const onLogin = () => {
    setIsAuthenticated(true);
  };

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
    if (isAuthenticated) getTodos();
  }, [isAuthenticated]);

  const completedCount = todos.filter(t => t.isComplete).length;

  // ── AUTH ──
  if (!isAuthenticated) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          {isRegistering ? (
            <Register onBackToLogin={() => setIsRegistering(false)} />
          ) : (
            <>
              <Login onLogin={onLogin} />
              <div className="auth-divider" style={{ marginTop: 20 }}><span>חדשה כאן?</span></div>
              <button
                className="auth-switch-btn"
                style={{ width: '100%', marginTop: 0 }}
                onClick={() => setIsRegistering(true)}
              >
                יצירת חשבון חינם
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── MAIN APP ──
  return (
    <div className="todoapp">
      <div className="app-header">
        <h1 className="app-title">my<span>tasks</span></h1>
        <button className="logout-btn" onClick={onLogout}>התנתקות</button>
      </div>

      <form className="add-todo-form" onSubmit={createTodo}>
        <div className="add-todo-wrapper">
          <input
            className="new-todo"
            placeholder="הוסיפי משימה חדשה..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            dir="rtl"
          />
          <button type="submit" className="add-btn">+ הוסיפי</button>
        </div>
      </form>

      {todos.length > 0 && (
        <div className="todo-stats" dir="rtl">
          <strong>{todos.length}</strong> משימות •
          <strong>{completedCount}</strong> הושלמו
        </div>
      )}

      <ul className="todo-list">
        {todos.map((todo, index) => (
          <li
            className={todo.isComplete ? "completed" : ""}
            key={todo.id}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <input
              className="toggle"
              type="checkbox"
              checked={todo.isComplete}
              onChange={(e) => updateCompleted(todo, e.target.checked)}
            />
            <label className="todo-label" dir="rtl">{todo.name}</label>
            <button className="destroy" onClick={() => deleteTodo(todo.id)}>×</button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <p>אין משימות עדיין — הוסיפי את הראשונה!</p>
        </div>
      )}
    </div>
  );
}

export default App;