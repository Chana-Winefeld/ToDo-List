import axios from 'axios';

// הגדרת כתובת ה-API כברירת מחדל
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

// Interceptor להוספת הטוקן לכל בקשה
axios.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor לטיפול בשגיאות (כמו 401 - לא מחובר)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      alert("פג תוקף החיבור, נא להתחבר שוב");
      window.location.href = "/login"; // העברה לדף התחברות
    }
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default {
  getTasks: async () => {
    const result = await axios.get("/items");
    return result.data;
  },
   addTask: async (name) => {
    // שליחת אובייקט עם שם המשימה וסטטוס התחלתי
    const result = await axios.post(`/items`, { name: name, isComplete: false });
    return result.data;
  },

  setCompleted: async (id, isComplete) => {
    // עדכון משימה קיימת בשרת
    const result = await axios.put(`/items/${id}`, { isComplete: isComplete });
    return result.data;
  },

  deleteTask: async (id) => {
    // מחיקת משימה מהשרת ובסיס הנתונים
    const result = await axios.delete(`/items/${id}`);
    return result.data;
  },
  // פונקציה להתחברות
  login: async (username, password) => {
    const result = await axios.post("/login", { username, password });
    localStorage.setItem("token", result.data.token); // שמירת הטוקן
    return result.data;
  },
  register: async (username, password) => {
  const result = await axios.post("/register", { username, password });
  return result.data;
}
};