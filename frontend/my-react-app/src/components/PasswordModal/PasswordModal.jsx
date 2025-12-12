import { useState } from "react";
import styles from "./PasswordModal.module.scss";

export default function PasswordModal({ users, onClose, onSave, isSaving }) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    const text = users.map((user, index) => 
      `${index + 1}. Логин: ${user.username} | Пароль: ${user.password}`
    ).join('\n');
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      })
      .catch(() => alert("Не удалось скопировать"));
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Созданные пользователи</h2>
          <button className={styles.closeBtn} onClick={onClose} disabled={isSaving}>
            ✕
          </button>
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
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Логин: ${user.username}\nПароль: ${user.password}`
                      ).then(() => alert("Скопировано"));
                    }}
                  >
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
              disabled={isSaving}
            >
              {copiedAll ? "Скопировано" : "Копировать все"}
            </button>
            
            <button 
              className={styles.saveBtn}
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? "Сохраняем" : "Сохранить и закрыть"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}