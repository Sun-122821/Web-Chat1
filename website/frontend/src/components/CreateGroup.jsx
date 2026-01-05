import { useState, useEffect } from 'react';
import { generateAESKey, exportAESKey, importRSAPublicKey } from '../utils/crypto-utils';
import './CreateGroup.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function CreateGroup({ user, onGroupCreated, onCancel }) {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [creating, setCreating] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/users/search/${encodeURIComponent(query)}`
      );
      const results = await response.json();
      // Filter out current user and already selected members
      setSearchResults(
        results.filter(
          u => u.userId !== user.userId && !selectedMembers.find(m => m.userId === u.userId)
        )
      );
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleAddMember = (member) => {
    if (!selectedMembers.find(m => m.userId === member.userId)) {
      setSelectedMembers([...selectedMembers, member]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers(selectedMembers.filter(m => m.userId !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert('Please enter a group name and add at least one member');
      return;
    }

    setCreating(true);

    try {
      // Generate shared AES key for the group
      const groupKey = await generateAESKey();
      const groupKeyString = await exportAESKey(groupKey);

      // Get public keys for all members (including creator)
      const allMembers = [...selectedMembers, { userId: user.userId }];
      const memberPublicKeys = await Promise.all(
        allMembers.map(async (member) => {
          const response = await fetch(`${API_URL}/api/users/${member.userId}`);
          const data = await response.json();
          return { userId: member.userId, publicKey: data.publicKey };
        })
      );

      // Encrypt group key with each member's public key
      const encryptedKeys = await Promise.all(
        memberPublicKeys.map(async ({ userId, publicKey }) => {
          const publicKeyObj = await importRSAPublicKey(publicKey);
          const exportedKey = await window.crypto.subtle.exportKey('raw', groupKey);
          
          const encryptedKey = await window.crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKeyObj,
            exportedKey
          );

          return {
            userId,
            encryptedKey: arrayBufferToBase64(encryptedKey)
          };
        })
      );

      // Create group
      const response = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          adminId: user.userId,
          memberIds: allMembers.map(m => m.userId),
          encryptedKeys
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const groupData = await response.json();
      
      // Save group key locally
      const { saveGroupKey } = await import('../utils/storage');
      saveGroupKey(groupData.groupId, groupKeyString);

      onGroupCreated({
        groupId: groupData.groupId,
        name: groupData.name,
        type: 'group'
      });
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="create-group-overlay">
      <div className="create-group-modal">
        <h2>Create New Group</h2>

        <div className="form-group">
          <label>Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            maxLength={100}
            disabled={creating}
          />
        </div>

        <div className="form-group">
          <label>Add Members</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by nickname..."
            disabled={creating}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(user => (
                <div
                  key={user.userId}
                  className="search-result-item"
                  onClick={() => handleAddMember(user)}
                >
                  👤 {user.nickname}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedMembers.length > 0 && (
          <div className="selected-members">
            <label>Selected Members ({selectedMembers.length})</label>
            <div className="members-list">
              {selectedMembers.map(member => (
                <div key={member.userId} className="member-tag">
                  {member.nickname}
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.userId)}
                    className="remove-member"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onCancel} disabled={creating}>Cancel</button>
          <button onClick={handleCreate} disabled={creating || !groupName.trim() || selectedMembers.length === 0}>
            {creating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
