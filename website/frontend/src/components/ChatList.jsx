import { useState, useEffect } from 'react';
import './ChatList.css';

export function ChatList({ chats, groups, selectedChat, onSelectChat, onSelectGroup, onCreateGroup, socket, currentUserId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/search/${encodeURIComponent(query)}`
      );
      const results = await response.json();
      // Filter out current user
      setSearchResults(results.filter(u => u.userId !== currentUserId));
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h3>Conversations</h3>
        <div className="header-actions">
          <button onClick={onCreateGroup} className="new-group-btn" title="Create Group">
            👥 Group
          </button>
          <button onClick={() => setShowSearch(!showSearch)} className="new-chat-btn">
            + Chat
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="search-section">
          <input
            type="text"
            placeholder="Search users by nickname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="search-results">
            {searchResults.map(user => (
              <div
                key={user.userId}
                className="search-result-item"
                onClick={() => {
                  onSelectChat(user.userId, user.nickname);
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <span>👤</span>
                <span>{user.nickname}</span>
              </div>
            ))}
            {searchQuery && searchResults.length === 0 && (
              <div className="no-results">No users found</div>
            )}
          </div>
        </div>
      )}

      <div className="chats">
        {groups.length > 0 && (
          <div className="groups-section">
            <div className="section-header">Groups</div>
            {groups.map(group => (
              <div
                key={group.groupId}
                className={`chat-item ${selectedChat?.groupId === group.groupId ? 'selected' : ''}`}
                onClick={() => onSelectGroup(group.groupId, group.name)}
              >
                <div className="chat-avatar">👥</div>
                <div className="chat-info">
                  <div className="chat-name">{group.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {chats.length > 0 && (
          <div className="chats-section">
            <div className="section-header">Direct Messages</div>
            {chats.map(chat => (
              <div
                key={chat.userId}
                className={`chat-item ${selectedChat?.userId === chat.userId ? 'selected' : ''}`}
                onClick={() => onSelectChat(chat.userId, chat.nickname)}
              >
                <div className="chat-avatar">👤</div>
                <div className="chat-info">
                  <div className="chat-name">{chat.nickname}</div>
                  {chat.lastMessage && (
                    <div className="chat-preview">{chat.lastMessage}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {chats.length === 0 && groups.length === 0 && (
          <div className="no-chats">No conversations yet. Start a new chat!</div>
        )}
      </div>
    </div>
  );
}
