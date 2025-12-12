import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import { checkServerHealth } from "./api/api";
import styles from "./App.module.scss";

//Компонент шапки приложения (условное отображение)
function Header({ user, setUser }) {
  const location = useLocation();//Получаем текущий путь
  const isAdminPage = location.pathname.startsWith('/admin');//Проверяем админскую страницу
  
  //Не показываем шапку на админских страницах
  if (isAdminPage) {
    return null;
  }

  return (
    <header className={styles.header}>
      <h1>Название компании</h1>
      {user && (
        <div className={styles.userInfo}>
          <span>Привет, {user.username}</span>
          {/*Ссылка в админ-панель для администраторов*/}
          {user.role === "admin" && (
            <a href="/admin" className={styles.adminLink}>Админ-панель</a>
          )}
          <button 
            onClick={() => {
              localStorage.removeItem("user");//Удаляем пользователя из хранилища
              setUser(null);//Сбрасываем состояние пользователя
            }}
            className={styles.logoutBtn}
          >
            Выйти
          </button>
        </div>
      )}
    </header>
  );
}

//Компонент подвала приложения
function Footer() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  //Не показываем подвал на админских страницах
  if (isAdminPage) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p>&copy; 2025 Название компании. Все права защищены.</p>
      </div>
    </footer>
  );
}

//Основной компонент содержимого приложения
function AppContent() {
  //Состояние для хранения данных пользователя
  const [user, setUser] = useState(null);
  //Состояние для отслеживания загрузки
  const [loading, setLoading] = useState(true);
  //Состояние для статуса сервера
  const [serverStatus, setServerStatus] = useState("loading");

  //Эффект для проверки сервера и загрузки пользователя
  useEffect(() => {
    const checkServer = async () => {
      try {
        //Проверяем доступность сервера
        const health = await checkServerHealth();
        setServerStatus(health.status === "ok" ? "connected" : "error");
        
        //Только после проверки сервера загружаем пользователя
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            localStorage.removeItem("user");//Очищаем поврежденные данные
          }
        }
      } catch {
        setServerStatus("error");//Ошибка соединения с сервером
      } finally {
        setLoading(false);//Завершаем загрузку
      }
    };
    
    checkServer();
  }, []);

  //Обработчик успешной авторизации
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  //Отображение состояния загрузки
  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  //Отображение ошибки недоступности сервера
  if (serverStatus === "error") {
    return (
      <div className={styles.serverError}>
        <h2>⚠️ Сервер недоступен</h2>
        <button onClick={() => window.location.reload()}>Обновить</button>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      {/*Шапка приложения*/}
      <Header user={user} setUser={setUser} />
      
      {/*Основное содержимое*/}
      <main className={styles.mainContent}>
        <Routes>
          {/*Маршрут входа (всегда доступен)*/}
          <Route 
            path="/login" 
            element={<Login onLogin={handleLogin} />} />
          
          {/*Главная страница (только для авторизованных)*/}
          <Route
            path="/"
            element={
              user ? <Home user={user} /> : <Navigate to="/login" replace />
            }/>
          
          {/*Административная панель (только для администраторов)*/}
          <Route 
            path="/admin/*" 
            element={
              user && user.role === "admin" ? (
                <AdminDashboard user={user} />
              ) : (
                <Navigate to="/" replace />
              )
            }/>

          {/*Редирект для всех остальных путей*/}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/*Подвал приложения*/}
      <Footer />
    </div>
  );
}

//Основной компонент приложения с роутером
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}