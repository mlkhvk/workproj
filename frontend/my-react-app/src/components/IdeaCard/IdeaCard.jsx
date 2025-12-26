import styles from "./IdeaCard.module.scss";

//Компонент карточки идеи с поддержкой административных действий
export default function IdeaCard({ 
  idea, 
  showAdminActions, 
  showAuthorInfo = false, // Новый параметр: показывать ли информацию об авторе
  onApprove, 
  onHide, 
  onUnhide, 
  searchQuery, 
  onIdeaClick 
}) {
  //Если идея не передана, отображаем сообщение об ошибке
  if (!idea) {
    return <div className={styles.card}>Идея не найдена</div>;
  }

  //Функция расчета общего рейтинга (разница между голосами "за" и "против")
  const getVoteCount = () => (idea.votes_for || 0) - (idea.votes_against || 0);
  
  //Формирование CSS-класса карточки в зависимости от состояния идеи
  const cardClass = `${styles.card} ${idea.is_approved ? styles.approved : ''} ${idea.is_hidden ? styles.hidden : ''}`;
  
  //Функция для подсветки найденного текста в названии идеи
  const renderHighlightedTitle = () => {
    //Если нет поискового запроса или названия, возвращаем обычное название
    if (!searchQuery || !idea.title) {
      return idea.title || 'Без названия';
    }
    
    const title = idea.title;
    //Создаем регулярное выражение для поиска (без учета регистра)
    const searchRegex = new RegExp(`(${searchQuery})`, 'gi');
    //Разделяем заголовок на части по поисковому запросу
    const parts = title.split(searchRegex);
    
    //Рендерим части с подсветкой совпадений
    return parts.map((part, index) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={index} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    );
  };

  //Функция для получения отображаемого имени автора
  const getAuthorDisplayName = () => {
    if (idea.author_info) {
      if (idea.author_info.full_name) {
        return idea.author_info.full_name;
      } else if (idea.author_info.username) {
        return idea.author_info.username;
      }
    }
    return `Пользователь #${idea.author_id || 'Неизвестен'}`;
  };

  //Функция для получения дополнительной информации об авторе
  const getAuthorAdditionalInfo = () => {
    if (idea.author_info) {
      if (idea.author_info.full_name && idea.author_info.username) {
        return `(${idea.author_info.username})`;
      }
    }
    return '';
  };

  //Обработчик клика по карточке идеи
  const handleCardClick = () => {
    if (onIdeaClick) {
      onIdeaClick(idea);
    }
  };

  //Обработчик административных действий (останавливает всплытие события)
  const handleAdminAction = (e, action) => {
    e.stopPropagation();//Предотвращаем срабатывание клика по карточке
    action?.(idea.id);//Вызываем переданное действие с ID идеи
  };
  
  return (
    //Основной контейнер карточки идеи с обработчиком клика
    <div className={cardClass} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      {/*Шапка карточки с заголовком и ID*/}
      <div className={styles.header}>
        <h3>{renderHighlightedTitle()}</h3>
        <span className={styles.ideaId}>#{idea.id}</span>
      </div>
      
      {/*Информация об авторе (только если showAuthorInfo = true) */}
      {showAuthorInfo && (
        <div className={styles.authorInfo}>
          <span className={styles.authorLabel}>Автор:</span>
          <span className={styles.authorName}>
            {getAuthorDisplayName()}
          </span>
          {getAuthorAdditionalInfo() && (
            <span className={styles.authorAdditional}>
              {getAuthorAdditionalInfo()}
            </span>
          )}
        </div>
      )}
      
      {/*Мета-информация: категория и дата создания*/}
      <div className={styles.meta}>
        <span className={styles.category}>{idea.category || 'Без категории'}</span>
        <span className={styles.date}>
          {idea.created_at ? new Date(idea.created_at).toLocaleDateString('ru-RU') : 'Дата не указана'}
        </span>
      </div>
      
      {/*Статистика: голоса и комментарии*/}
      <div className={styles.stats}>
        <div className={styles.votes}>
          <span className={styles.voteCount}>👍 {idea.votes_for || 0}</span>
          <span className={styles.voteCount}>👎 {idea.votes_against || 0}</span>
          <span className={styles.totalRating}>Рейтинг: {getVoteCount()}</span>
        </div>
        <span className={styles.commentsCount}>
          💬 {Array.isArray(idea.comments) ? idea.comments.length : 0}
        </span>
      </div>
      
      {/*Статус идеи*/}
      <div className={styles.ideaStatus}>
        {idea.is_approved ? (
          <span className={styles.statusApproved}>Одобрена</span>
        ) : (
          <span className={styles.statusPending}>На рассмотрении</span>
        )}
        {idea.is_hidden && (
          <span className={styles.statusHidden}>Скрыта</span>
        )}
      </div>
      
      {/*Предупреждение о скрытой идее*/}
      {idea.is_hidden && (
        <div className={styles.hiddenWarning}>
          Идея скрыта от обычных пользователей
        </div>
      )}
      
      {/*УБРАН БЛОК: Бейдж одобренной идеи */}
      
      {/*Административные действия*/}
      {showAdminActions && (
        <div className={styles.adminActions}>
          {/*Кнопка одобрения (только для неодобренных идей)*/}
          {!idea.is_approved && (
            <button 
              onClick={(e) => handleAdminAction(e, onApprove)}
              className={styles.approveBtn}
              title="Одобрить идею">
              Одобрить
            </button>
          )}
          {/*Кнопки скрытия/показа в зависимости от текущего состояния*/}
          {!idea.is_hidden ? (
            <button 
              onClick={(e) => handleAdminAction(e, onHide)}
              className={styles.hideBtn}
              title="Скрыть идею">
              Скрыть
            </button>
          ) : (
            <button
              onClick={(e) => handleAdminAction(e, onUnhide)}
              className={styles.showBtn}
              title="Показать идею">
              Показать
            </button>
          )}
        </div>
      )}
    </div>
  );
}