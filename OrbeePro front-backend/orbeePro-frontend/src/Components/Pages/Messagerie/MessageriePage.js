import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';
import './MessageriePage.css';
import { Send } from '@mui/icons-material';

const MessageriePage = () => {
    const [user] = useAuthState(auth);
    const [staff, setStaff] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // 1. Charger la liste du personnel (inchangé)
    useEffect(() => {
        if (!user) return;
        const staffQuery = query(collection(db, 'staff'), where('uid', '!=', user.uid));
        const unsubscribe = onSnapshot(staffQuery, snapshot => {
            setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [user]);

    // --- 👇 2. MODIFICATION : RECEVOIR LES MESSAGES ---
    useEffect(() => {
        if (!user || !selectedContact) {
            setMessages([]);
            return;
        }

        // Création de l'ID de conversation unique et prévisible
        const conversationId = [user.uid, selectedContact.uid].sort().join('_');

        // Nouvelle requête, beaucoup plus simple et correcte
        const messagesQuery = query(
            collection(db, 'chats'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, snapshot => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        
        return unsubscribe;
    }, [user, selectedContact]);

    // --- 👇 3. MODIFICATION : ENVOYER UN MESSAGE ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !selectedContact) return;

        // Création de l'ID de conversation à chaque envoi
        const conversationId = [user.uid, selectedContact.uid].sort().join('_');

        await addDoc(collection(db, 'chats'), {
            text: newMessage,
            senderId: user.uid,
            receiverId: selectedContact.uid,
            createdAt: serverTimestamp(),
            conversationId: conversationId, // <-- ON AJOUTE L'ID ICI
        });
        setNewMessage('');
    };
    return (
        <div className="messagerie-layout">
            {/* --- LISTE DES CONTACTS --- */}
            <aside className="contacts-sidebar">
                <div className="sidebar-header">
                    <h2>Contacts</h2>
                </div>
                <div className="contacts-list">
                    {staff.map(person => (
                        <div 
                            key={person.id} 
                            className={`contact-item ${selectedContact?.id === person.id ? 'active' : ''}`}
                            onClick={() => setSelectedContact(person)}
                        >
                            <span className="contact-name">{person.name}</span>
                            <span className="contact-role">{person.role}</span>
                        </div>
                    ))}
                </div>
            </aside>

            {/* --- FENÊTRE DE CHAT --- */}
            <main className="chat-window">
                {selectedContact ? (
                    <>
                        <header className="chat-header">
                            <h3>{selectedContact.name}</h3>
                            <p>{selectedContact.role}</p>
                        </header>

                        <div className="messages-container">
                            {messages.map(msg => (
                                <div key={msg.id} className={`message-bubble ${msg.senderId === user.uid ? 'sent' : 'received'}`}>
                                    {msg.text}
                                </div>
                            ))}
                        </div>

                        <form className="message-input-form" onSubmit={handleSendMessage}>
                            <input 
                                type="text" 
                                placeholder="Écrire un message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit"><Send /></button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <p>Sélectionnez un contact pour commencer à discuter.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MessageriePage;