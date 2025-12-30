import { useState } from "react";
import styles from "./PasswordModal.module.scss";

export default function PasswordModal({ users, onClose, onSave, isSaving }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const copyToClipboard = async (text) => {
    // Способ 1: Современный Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        
      }
    }
    
    // Способ 2: Старый метод, который был до этого
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return success;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  };

  const handleCopyAll = async () => {
    const text = users.map((user, index) => 
      `${index + 1}. Логин: ${user.username} | Пароль: ${user.password}`
    ).join('\n');
    
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      alert("Все логины и пароли скопированы в буфер обмена!");
    } else {
      prompt("Скопируйте этот текст вручную:", text);
    }
  };

  const handleCopySingle = async (username, password) => {
    const text = `Логин: ${username}\nПароль: ${password}`;
    const success = await copyToClipboard(text);
    
    if (success) {
      alert("Скопировано в буфер обмена");
    } else {
      prompt("Скопируйте этот текст вручную:", text);
    }
  };

  const handleDownloadCSV = () => {
    const headers = "№,Логин,Пароль\n";
    const content = users.map((user, index) => 
      `${index + 1},${user.username},${user.password}`
    ).join('\n');
    
    const csvContent = headers + content;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Созданные пользователи</h2>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.warning}>
            <strong>Внимание!</strong> Сохраните эти логины и пароли. После закрытия окна пароли будут недоступны и больше не будут отображаться.
          </div>
          
          <div className={styles.usersList}>
            <div className={styles.tableHeader}>
              <div className={styles.col}>№</div>
              <div className={styles.col}>Логин</div>
              <div className={styles.col}>Пароль</div>
              <div className={styles.col}>Действия</div>
            </div>
            
            {users.map((user, index) => (
              <div key={user.id} className={styles.userRow}>
                <div className={styles.col}>{index + 1}</div>
                <div className={styles.col}>
                  <code className={styles.username}>{user.username}</code>
                </div>
                <div className={styles.col}>
                  <code className={styles.password}>{user.password}</code>
                </div>
                <div className={styles.col}>
                  <button 
                    className={styles.copyBtn}
                    onClick={() => handleCopySingle(user.username, user.password)}>
                    Копировать
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.stats}>
            Всего создано: <strong>{users.length}</strong> пользователей
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.copyAllBtn}
              onClick={handleCopyAll}
              disabled={isSaving}>
              {copiedAll ? "Скопировано" : "Копировать все"}
            </button>
            
            <button 
              className={styles.saveBtn}
              onClick={onSave}
              disabled={isSaving}>
              {isSaving ? "Сохраняем..." : "Сохранить и закрыть"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}