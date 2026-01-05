import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { GroupChatWindow } from './GroupChatWindow';
import { CreateGroup } from './CreateGroup';
import './ChatScreen.css';

export function ChatScreen({ user, onLogout }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { socket, connected } = useSocket(user.userId);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming one-to-one messages
    socket.on('receive-message', async (data) => {
      setChats(prev => {
        const existing = prev.find(c => c.userId === data.senderId);
        if (existing) {
          return prev;
        }
        // Fetch sender info
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/${data.senderId}`)
          .then(res => res.json())
          .then(sender => {
            setChats(prev => {
              const updated = [...prev];
              const idx = updated.findIndex(c => c.userId === data.senderId);
              if (idx >= 0) {
                updated[idx] = { ...updated[idx], ...sender };
              } else {
                updated.push({ userId: data.senderId, nickname: sender.nickname });
              }
              return updated;
            });
          });
        return prev;
      });
    });

    // Listen for incoming group messages
    socket.on('receive-group-message', async (data) => {
      setGroups(prev => {
        const existing = prev.find(g => g.groupId === data.groupId);
        if (existing) {
          return prev;
        }
        // Fetch group info
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/groups/${data.groupId}?userId=${user.userId}`)
          .then(res => {
            if (!res.ok) {
              throw new Error('Failed to fetch group');
            }
            return res.json();
          })
          .then(groupData => {
            setGroups(prev => {
              const updated = [...prev];
              const idx = updated.findIndex(g => g.groupId === data.groupId);
              if (idx >= 0) {
                updated[idx] = { ...updated[idx], name: groupData.name };
              } else {
                updated.push({ groupId: data.groupId, name: groupData.name });
              }
              return updated;
            });
          });
        return prev;
      });
    });

    return () => {
      socket.off('receive-message');
      socket.off('receive-group-message');
    };
  }, [socket, user.userId]);

  const handleStartChat = (userId, nickname) => {
    setSelectedChat({ userId, nickname, type: 'one-to-one' });
  };

  const handleSelectGroup = (groupId, name) => {
    setSelectedChat({ groupId, name, type: 'group' });
  };

  const handleGroupCreated = (group) => {
    setGroups(prev => [...prev, group]);
    setSelectedChat({ groupId: group.groupId, name: group.name, type: 'group' });
    setShowCreateGroup(false);
  };

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <div className="header-left">
          <h2>🔐 Secure Chat</h2>
          <span className="user-info">@{user.nickname}</span>
        </div>
        <div className="header-right">
          <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Online' : '🔴 Offline'}
          </span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="chat-container">
        <ChatList
          chats={chats}
          groups={groups}
          selectedChat={selectedChat}
          onSelectChat={handleStartChat}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={() => setShowCreateGroup(true)}
          socket={socket}
          currentUserId={user.userId}
        />
        
        {selectedChat ? (
          selectedChat.type === 'group' ? (
            <GroupChatWindow
              group={selectedChat}
              user={user}
              socket={socket}
              connected={connected}
            />
          ) : (
            <ChatWindow
              chat={selectedChat}
              user={user}
              socket={socket}
              connected={connected}
            />
          )
        ) : (
          <div className="no-chat-selected">
            <p>Select a chat or start a new conversation</p>
          </div>
        )}
      </div>

      {showCreateGroup && (
        <CreateGroup
          user={user}
          onGroupCreated={handleGroupCreated}
          onCancel={() => setShowCreateGroup(false)}
        />
      )}
    </div>
  );
}
